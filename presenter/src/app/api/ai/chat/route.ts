import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { requireRoleApi } from '@/lib/dal';
import { AiSlideAction } from '@/lib/types';
import { ADDABLE_TEMPLATES } from '@/lib/slide-templates';
import { DRAG_KEYS_BY_TEMPLATE } from '@/lib/dragKeys';
import { prisma } from '@/lib/prisma';
import { isUserOverAiSpendCap } from '@/lib/aiUsage';

const TEACHER_OR_ABOVE = ['ADMIN', 'COORDINATOR', 'TEACHER'] as const;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const ADDABLE_TEMPLATE_NAMES = ADDABLE_TEMPLATES.map((t) => t.template);

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_slide_data',
      description:
        'Fetches the JSON data (and available move_block dragKeys) for a slide elsewhere in the deck, by its 0-based index from the deck list in context. Call this BEFORE set_field/add_list_item/remove_list_item/move_block whenever you need to edit a slide that is not the active one — you cannot see or edit another slide\'s content until you fetch it this way. Costs extra tokens, so only fetch slides you actually intend to edit.',
      parameters: {
        type: 'object',
        properties: {
          slideIndex: { type: 'number', description: '0-based index of the slide to fetch, per the deck list in context.' },
        },
        required: ['slideIndex'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_field',
      description:
        'Set a single text field on a slide\'s data, addressed by dot-path (e.g. "title", "rows.0.subject"). Use for editing existing titles, captions, sentences, labels, etc. Targets the active slide unless slideIndex is given, in which case you must have already called get_slide_data for that index in this same turn.',
      parameters: {
        type: 'object',
        properties: {
          slideIndex: { type: 'number', description: 'Omit to target the active slide. Otherwise, the 0-based index of a slide previously fetched via get_slide_data in this turn.' },
          path: { type: 'string', description: 'Dot-path into the slide data, matching its existing JSON shape.' },
          value: { type: 'string', description: 'The new text value.' },
        },
        required: ['path', 'value'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_list_item',
      description:
        'Append a new item to a list field on a slide (e.g. "rows", "tips", "questions"). The item shape must match the other items already in that list. Targets the active slide unless slideIndex is given, in which case you must have already called get_slide_data for that index in this same turn.',
      parameters: {
        type: 'object',
        properties: {
          slideIndex: { type: 'number', description: 'Omit to target the active slide. Otherwise, the 0-based index of a slide previously fetched via get_slide_data in this turn.' },
          listPath: { type: 'string', description: 'Dot-path to the array field, e.g. "rows" or "tips".' },
          item: { type: 'object', description: 'The new item, matching the shape of existing items in that list.' },
        },
        required: ['listPath', 'item'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_list_item',
      description: 'Remove an item by index from a list field on a slide. Targets the active slide unless slideIndex is given, in which case you must have already called get_slide_data for that index in this same turn.',
      parameters: {
        type: 'object',
        properties: {
          slideIndex: { type: 'number', description: 'Omit to target the active slide. Otherwise, the 0-based index of a slide previously fetched via get_slide_data in this turn.' },
          listPath: { type: 'string', description: 'Dot-path to the array field, e.g. "rows" or "tips".' },
          index: { type: 'number', description: 'Zero-based index of the item to remove.' },
        },
        required: ['listPath', 'index'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_slide',
      description:
        'Creates a new slide at the end of the deck, using one of the available templates, and makes it the active slide. After calling this, any subsequent set_field / add_list_item / remove_list_item / move_block calls in this turn apply to the NEW slide, not the one that was active before.',
      parameters: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            enum: ADDABLE_TEMPLATE_NAMES,
            description: 'Which slide template to use for the new slide — pick the one that best matches what the teacher asked for.',
          },
        },
        required: ['template'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reorder_slide',
      description:
        'Moves a slide from one position to another in the deck (0-based indices, per the slide list in the context). Use this to reorder existing slides — e.g. move slide 3 to be first, or move the active slide right after slide 1.',
      parameters: {
        type: 'object',
        properties: {
          fromIndex: { type: 'number', description: 'Current 0-based index of the slide to move.' },
          toIndex: { type: 'number', description: 'Target 0-based index it should end up at.' },
        },
        required: ['fromIndex', 'toIndex'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description:
        'Generates a new image from a text description and returns its URL. The URL is NOT applied to the slide automatically — after calling this, use set_field (or add_list_item, for a list of image items) with the returned URL to actually place the image on an imageUrl-like field. Use this whenever the teacher asks to add/create/generate a picture, photo, illustration, icon, or similar for the slide, instead of leaving an imageUrl field empty or inventing a fake URL.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description:
              'Detailed visual description of the image to generate, in English, for best results. Include style (e.g. "flat vector illustration", "photorealistic photo", "simple line icon") appropriate for a classroom slide.',
          },
          orientation: {
            type: 'string',
            enum: ['landscape', 'portrait', 'square'],
            description: 'Overall shape of the image — pick based on where it will be placed on the slide (e.g. a wide banner photo vs. a small square avatar).',
          },
        },
        required: ['prompt', 'orientation'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'move_block',
      description:
        'Nudge a visual block on the slide by a pixel offset, relative to its current position, in the 1280x720 slide coordinate space. Use the dragKey values listed in the slide layout context.',
      parameters: {
        type: 'object',
        properties: {
          dragKey: { type: 'string', description: 'The block\'s dragKey, as listed in the slide layout context.' },
          dx: { type: 'number', description: 'Additional horizontal offset in pixels.' },
          dy: { type: 'number', description: 'Additional vertical offset in pixels.' },
        },
        required: ['dragKey', 'dx', 'dy'],
        additionalProperties: false,
      },
    },
  },
];

const TEMPLATE_CATALOG = ADDABLE_TEMPLATES.map((t) => `- ${t.template}: ${t.label} — ${t.description}`).join('\n');

const SYSTEM_PROMPT = `Você é um assistente que ajuda um professor a montar/editar slides de uma aula de inglês (CCBEU English Center), dentro de um editor de apresentações.

Você enxerga o deck inteiro como uma lista (índice + template de cada slide), mas só enxerga de cara o CONTEÚDO (JSON de dados) do slide atualmente ativo. Se o professor pedir pra editar um slide diferente do ativo, chame get_slide_data com o índice desse slide antes de editar — isso busca o JSON dele (e os dragKeys disponíveis) sob demanda, sem custo desnecessário nos outros slides. Depois de buscar, use slideIndex nas chamadas de set_field/add_list_item/remove_list_item/move_block pra mirar nesse slide especificamente (omitindo slideIndex elas miram no slide ativo). Além disso você pode: CRIAR slides novos via add_slide (sempre inseridos no final do deck, escolhendo o template mais adequado a partir do catálogo abaixo); e REORDENAR qualquer slide do deck via reorder_slide, usando os índices da lista de contexto. Você não pode remover slides.

Catálogo de templates disponíveis para add_slide:
${TEMPLATE_CATALOG}

Use as ferramentas disponíveis (get_slide_data, add_slide, reorder_slide, set_field, add_list_item, remove_list_item, move_block, generate_image) para aplicar mudanças reais; não basta descrever em texto o que mudaria, você deve chamar a ferramenta.

Fluxo típico ao criar um slide: chame add_slide primeiro; nas chamadas seguintes DENTRO DO MESMO TURNO, set_field/add_list_item já se aplicam ao slide recém-criado (que passou a ser o ativo) — use isso para já preencher título, textos e itens de lista com conteúdo relevante ao pedido, em vez de deixar os placeholders genéricos do template.

Imagens: campos de imagem no JSON do slide seguem o padrão de nome imageUrl, imageUrl1/imageUrl2, imageUrls (array), avatar1Url/avatar2Url, etc. Quando o professor pedir para adicionar/gerar/criar uma imagem (foto, ilustração, ícone...), chame generate_image com um prompt visual detalhado em inglês; a ferramenta retorna a URL da imagem gerada, que você deve então aplicar com set_field (ou, se o campo for um item de uma lista de fotos, add_list_item) no campo apropriado. Nunca invente uma URL de imagem nem deixe o campo vazio quando o pedido for para gerar uma imagem — sempre chame generate_image primeiro. Não chame generate_image para um campo que já tem uma imagem, a menos que o professor peça para trocar/regenerar.

Regras:
- Preserve o idioma e o tom do conteúdo existente (a maior parte do texto do slide costuma estar em inglês, sendo uma aula de inglês; breadcrumbs/labels de UI podem estar em português).
- Ao adicionar itens a uma lista (rows, tips, questions, etc.), siga exatamente a forma (as mesmas chaves) dos itens já existentes nessa lista, que você vê no JSON de dados do slide (ou, para um slide recém-criado, a forma já preenchida por padrão nesse template).
- Ao mover um bloco (move_block), use apenas os dragKeys listados no contexto de layout do slide (ou, para um slide não-ativo, os dragKeys retornados por get_slide_data) — nunca invente um dragKey. Um slide recém-criado via add_slide pode ter dragKeys diferentes dos do slide anterior; não reaproveite a lista antiga.
- Os índices do deck no contexto refletem o estado ANTES desta rodada de ferramentas. Um add_slide sempre insere no final da lista atual (índice = tamanho do deck antes de inserir); se você chamar add_slide e depois reorder_slide no mesmo turno, calcule o índice de origem do novo slide considerando essa inserção.
- Só chame get_slide_data para slides que você realmente vai editar nesta rodada — cada chamada tem custo. Se o pedido envolver vários slides (ex: "mude do slide X ao Y"), chame get_slide_data para cada um deles que for editar, um por um.
- Ao falar em texto com o professor sobre a posição de um slide (não em parâmetros de ferramentas, que continuam 0-based), use numeração igual à da interface: índice 0 da lista de contexto = "slide 1", índice 4 = "slide 5", etc. Nunca exponha o índice 0-based cru numa frase para o professor.
- Depois de aplicar as mudanças, responda ao professor em texto de forma breve confirmando o que foi feito.
- Se o pedido for ambíguo, explique a limitação em vez de tentar aplicar algo incorreto.`;

const IMAGE_SIZE_BY_ORIENTATION: Record<string, '1536x1024' | '1024x1536' | '1024x1024'> = {
  landscape: '1536x1024',
  portrait: '1024x1536',
  square: '1024x1024',
};

// Approximate public pricing — check platform.openai.com/usage for actual spend; these are estimates only.
const TEXT_MODEL = 'gpt-4.1-mini';
const TEXT_PRICE_PER_MTOK_USD = { prompt: 0.4, completion: 1.6 };
const IMAGE_PRICE_USD_MEDIUM: Record<string, number> = {
  '1024x1024': 0.04,
  '1536x1024': 0.06,
  '1024x1536': 0.06,
};

async function logTextUsage(userId: string | undefined, usage: OpenAI.CompletionUsage | undefined) {
  if (!usage) return;
  const costUsd =
    (usage.prompt_tokens / 1_000_000) * TEXT_PRICE_PER_MTOK_USD.prompt +
    (usage.completion_tokens / 1_000_000) * TEXT_PRICE_PER_MTOK_USD.completion;
  await prisma.aiUsageLog.create({
    data: {
      kind: 'text',
      userId,
      model: TEXT_MODEL,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      estimatedCostUsd: costUsd,
    },
  });
}

async function logImageUsage(userId: string | undefined, size: string) {
  await prisma.aiUsageLog.create({
    data: {
      kind: 'image',
      userId,
      model: 'gpt-image-1',
      imageSize: size,
      imageQuality: 'medium',
      estimatedCostUsd: IMAGE_PRICE_USD_MEDIUM[size] ?? IMAGE_PRICE_USD_MEDIUM['1536x1024'],
    },
  });
}

/** Generates an image via gpt-image-1 and saves it under public/uploads/ai-generated, returning its public URL. */
async function generateSlideImage(client: OpenAI, prompt: string, orientation: string, userId: string | undefined): Promise<string> {
  const size = IMAGE_SIZE_BY_ORIENTATION[orientation] ?? IMAGE_SIZE_BY_ORIENTATION.landscape;

  const result = await client.images.generate({
    model: 'gpt-image-1',
    prompt,
    size,
    quality: 'medium',
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('Nenhuma imagem retornada pela API.');

  await logImageUsage(userId, size);

  const dirRel = path.join('uploads', 'ai-generated');
  const dirAbs = path.join(process.cwd(), 'public', dirRel);
  await mkdir(dirAbs, { recursive: true });

  const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  await writeFile(path.join(dirAbs, fileName), Buffer.from(b64, 'base64'));

  return `/${dirRel.replace(/\\/g, '/')}/${fileName}`;
}

export async function POST(req: NextRequest) {
  const guard = await requireRoleApi([...TEACHER_OR_ABOVE]);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  if (guard.user.role !== 'ADMIN' && (await isUserOverAiSpendCap(guard.user.id))) {
    return NextResponse.json(
      { error: 'Você atingiu o limite de uso da IA definido pelo administrador. Fale com um administrador para liberar mais uso.' },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no servidor.' }, { status: 500 });
  }

  const body = await req.json();
  const messages = body.messages as ChatMessage[];
  const slideData = body.slideData as unknown;
  const template = body.template as string;
  const dragKeys = (body.dragKeys as string[] | undefined) ?? [];
  const deckOverview = (body.deckOverview as { template: string; data: unknown }[] | undefined) ?? [];
  const activeIndex = body.activeIndex as number | undefined;

  if (!Array.isArray(messages) || slideData === undefined || typeof template !== 'string') {
    return NextResponse.json({ error: 'Body deve incluir messages[], slideData e template.' }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const deckList = deckOverview
    .map((s, i) => `${i}: ${s.template}${i === activeIndex ? ' (slide ativo)' : ''}`)
    .join('\n');

  const contextMessage = [
    `Deck completo (índice: template) — use estes índices em reorder_slide:`,
    deckList || '(deck vazio)',
    '',
    `Template do slide ativo: "${template}" (índice ${activeIndex}).`,
    `Blocos móveis (dragKey) disponíveis para move_block: ${dragKeys.length ? dragKeys.join(', ') : '(nenhum)'}.`,
    'JSON de dados atual do slide ativo:',
    JSON.stringify(slideData, null, 2),
  ].join('\n');

  const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextMessage },
    ...messages.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
  ];

  let reply = '';
  const actions: AiSlideAction[] = [];

  try {
    for (let round = 0; round < 6; round++) {
      const completion = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: chatMessages,
        tools,
      });

      await logTextUsage(guard.user.id, completion.usage);

      const choice = completion.choices[0];
      const msg = choice.message;

      if (msg.content) reply = msg.content;

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        break;
      }

      chatMessages.push(msg);

      for (const call of msg.tool_calls) {
        if (call.type !== 'function') continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          // leave args empty; the tool result below reports the failure to the model
        }

        let resultSummary = 'ok';
        switch (call.function.name) {
          case 'get_slide_data': {
            const slideIndex = args.slideIndex;
            if (typeof slideIndex !== 'number' || !Number.isInteger(slideIndex) || slideIndex < 0 || slideIndex >= deckOverview.length) {
              resultSummary = 'error: slideIndex out of range';
              break;
            }
            const target = deckOverview[slideIndex];
            const slideDragKeys = DRAG_KEYS_BY_TEMPLATE[target.template as keyof typeof DRAG_KEYS_BY_TEMPLATE] ?? [];
            resultSummary = [
              `ok: slide ${slideIndex} template "${target.template}"`,
              `dragKeys for move_block: ${slideDragKeys.length ? slideDragKeys.join(', ') : '(none)'}`,
              'data:',
              JSON.stringify(target.data, null, 2),
            ].join('\n');
            break;
          }
          case 'add_slide':
            if (typeof args.template === 'string' && (ADDABLE_TEMPLATE_NAMES as string[]).includes(args.template)) {
              actions.push({ kind: 'addSlide', template: args.template as (typeof ADDABLE_TEMPLATE_NAMES)[number] });
            } else {
              resultSummary = 'error: invalid or missing template';
            }
            break;
          case 'set_field':
            if (typeof args.path === 'string' && typeof args.value === 'string') {
              actions.push({
                kind: 'setField',
                slideIndex: typeof args.slideIndex === 'number' ? args.slideIndex : undefined,
                path: args.path,
                value: args.value,
              });
            } else {
              resultSummary = 'error: missing path/value';
            }
            break;
          case 'add_list_item':
            if (typeof args.listPath === 'string' && args.item && typeof args.item === 'object') {
              actions.push({
                kind: 'addListItem',
                slideIndex: typeof args.slideIndex === 'number' ? args.slideIndex : undefined,
                listPath: args.listPath,
                item: args.item as Record<string, unknown>,
              });
            } else {
              resultSummary = 'error: missing listPath/item';
            }
            break;
          case 'remove_list_item':
            if (typeof args.listPath === 'string' && typeof args.index === 'number') {
              actions.push({
                kind: 'removeListItem',
                slideIndex: typeof args.slideIndex === 'number' ? args.slideIndex : undefined,
                listPath: args.listPath,
                index: args.index,
              });
            } else {
              resultSummary = 'error: missing listPath/index';
            }
            break;
          case 'reorder_slide':
            if (typeof args.fromIndex === 'number' && typeof args.toIndex === 'number') {
              actions.push({ kind: 'reorderSlide', fromIndex: args.fromIndex, toIndex: args.toIndex });
            } else {
              resultSummary = 'error: missing fromIndex/toIndex';
            }
            break;
          case 'move_block':
            if (typeof args.dragKey === 'string' && typeof args.dx === 'number' && typeof args.dy === 'number') {
              actions.push({
                kind: 'moveBlock',
                slideIndex: typeof args.slideIndex === 'number' ? args.slideIndex : undefined,
                dragKey: args.dragKey,
                dx: args.dx,
                dy: args.dy,
              });
            } else {
              resultSummary = 'error: missing dragKey/dx/dy';
            }
            break;
          case 'generate_image':
            if (typeof args.prompt === 'string' && typeof args.orientation === 'string') {
              if (guard.user.role !== 'ADMIN' && (await isUserOverAiSpendCap(guard.user.id))) {
                resultSummary = 'error: user reached their AI spend cap — stop and tell the teacher to contact an admin';
              } else {
                try {
                  const url = await generateSlideImage(client, args.prompt, args.orientation, guard.user.id);
                  resultSummary = `ok: image generated at url ${url} — use set_field/add_list_item to place it on the appropriate imageUrl field`;
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'unknown error';
                  resultSummary = `error: image generation failed — ${message}`;
                }
              }
            } else {
              resultSummary = 'error: missing prompt/orientation';
            }
            break;
          default:
            resultSummary = `error: unknown tool ${call.function.name}`;
        }

        chatMessages.push({ role: 'tool', tool_call_id: call.id, content: resultSummary });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao chamar a IA.';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ reply, actions });
}
