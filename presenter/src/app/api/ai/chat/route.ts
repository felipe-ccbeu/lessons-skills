import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireRoleApi } from '@/lib/dal';
import { AiSlideAction } from '@/lib/types';
import { ADDABLE_TEMPLATES } from '@/lib/slide-templates';

const TEACHER_OR_ABOVE = ['ADMIN', 'COORDINATOR', 'TEACHER'] as const;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const ADDABLE_TEMPLATE_NAMES = ADDABLE_TEMPLATES.map((t) => t.template);

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'set_field',
      description:
        'Set a single text field on the current slide\'s data, addressed by dot-path (e.g. "title", "rows.0.subject"). Use for editing existing titles, captions, sentences, labels, etc.',
      parameters: {
        type: 'object',
        properties: {
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
        'Append a new item to a list field on the slide (e.g. "rows", "tips", "questions"). The item shape must match the other items already in that list.',
      parameters: {
        type: 'object',
        properties: {
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
      description: 'Remove an item by index from a list field on the slide.',
      parameters: {
        type: 'object',
        properties: {
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

Você enxerga o deck inteiro como uma lista (índice + template de cada slide), mas só enxerga o CONTEÚDO (JSON de dados) do slide atualmente ativo, e só pode editar esse conteúdo. Além disso você pode: CRIAR slides novos via add_slide (sempre inseridos no final do deck, escolhendo o template mais adequado a partir do catálogo abaixo); e REORDENAR qualquer slide do deck via reorder_slide, usando os índices da lista de contexto. Você não pode remover slides nem editar o conteúdo de um slide que não é o ativo — para editar o conteúdo de outro slide, oriente o professor a selecioná-lo primeiro.

Catálogo de templates disponíveis para add_slide:
${TEMPLATE_CATALOG}

Use as ferramentas disponíveis (add_slide, reorder_slide, set_field, add_list_item, remove_list_item, move_block) para aplicar mudanças reais; não basta descrever em texto o que mudaria, você deve chamar a ferramenta.

Fluxo típico ao criar um slide: chame add_slide primeiro; nas chamadas seguintes DENTRO DO MESMO TURNO, set_field/add_list_item já se aplicam ao slide recém-criado (que passou a ser o ativo) — use isso para já preencher título, textos e itens de lista com conteúdo relevante ao pedido, em vez de deixar os placeholders genéricos do template.

Regras:
- Preserve o idioma e o tom do conteúdo existente (a maior parte do texto do slide costuma estar em inglês, sendo uma aula de inglês; breadcrumbs/labels de UI podem estar em português).
- Ao adicionar itens a uma lista (rows, tips, questions, etc.), siga exatamente a forma (as mesmas chaves) dos itens já existentes nessa lista, que você vê no JSON de dados do slide (ou, para um slide recém-criado, a forma já preenchida por padrão nesse template).
- Ao mover um bloco (move_block), use apenas os dragKeys listados no contexto de layout do slide — nunca invente um dragKey. Um slide recém-criado via add_slide pode ter dragKeys diferentes dos do slide anterior; não reaproveite a lista antiga.
- Os índices do deck no contexto refletem o estado ANTES desta rodada de ferramentas. Um add_slide sempre insere no final da lista atual (índice = tamanho do deck antes de inserir); se você chamar add_slide e depois reorder_slide no mesmo turno, calcule o índice de origem do novo slide considerando essa inserção.
- Depois de aplicar as mudanças, responda ao professor em texto de forma breve confirmando o que foi feito.
- Se o pedido for ambíguo, ou exigir editar/remover o conteúdo de um slide que não é o ativo, explique a limitação em vez de tentar aplicar algo incorreto.`;

export async function POST(req: NextRequest) {
  const guard = await requireRoleApi([...TEACHER_OR_ABOVE]);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no servidor.' }, { status: 500 });
  }

  const body = await req.json();
  const messages = body.messages as ChatMessage[];
  const slideData = body.slideData as unknown;
  const template = body.template as string;
  const dragKeys = (body.dragKeys as string[] | undefined) ?? [];
  const deckOverview = (body.deckOverview as { template: string }[] | undefined) ?? [];
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
    for (let round = 0; round < 4; round++) {
      const completion = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: chatMessages,
        tools,
      });

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
          case 'add_slide':
            if (typeof args.template === 'string' && (ADDABLE_TEMPLATE_NAMES as string[]).includes(args.template)) {
              actions.push({ kind: 'addSlide', template: args.template as (typeof ADDABLE_TEMPLATE_NAMES)[number] });
            } else {
              resultSummary = 'error: invalid or missing template';
            }
            break;
          case 'set_field':
            if (typeof args.path === 'string' && typeof args.value === 'string') {
              actions.push({ kind: 'setField', path: args.path, value: args.value });
            } else {
              resultSummary = 'error: missing path/value';
            }
            break;
          case 'add_list_item':
            if (typeof args.listPath === 'string' && args.item && typeof args.item === 'object') {
              actions.push({ kind: 'addListItem', listPath: args.listPath, item: args.item as Record<string, unknown> });
            } else {
              resultSummary = 'error: missing listPath/item';
            }
            break;
          case 'remove_list_item':
            if (typeof args.listPath === 'string' && typeof args.index === 'number') {
              actions.push({ kind: 'removeListItem', listPath: args.listPath, index: args.index });
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
              actions.push({ kind: 'moveBlock', dragKey: args.dragKey, dx: args.dx, dy: args.dy });
            } else {
              resultSummary = 'error: missing dragKey/dx/dy';
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
