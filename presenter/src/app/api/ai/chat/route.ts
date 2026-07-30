import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { requireRoleApi } from '@/lib/dal';
import { AiSlideAction } from '@/lib/types';
import { ADDABLE_TEMPLATES } from '@/lib/slide-templates';
import { DRAG_KEYS_BY_TEMPLATE } from '@/lib/dragKeys';
import { TEMPLATE_META } from '@/lib/slideMeta';
import { pathExistsInShape } from '@/lib/dataPath';
import { prisma } from '@/lib/prisma';
import { isUserOverAiSpendCap } from '@/lib/aiUsage';
import { rateLimit } from '@/lib/rateLimit';

const TEACHER_OR_ABOVE = ['ADMIN', 'COORDINATOR', 'TEACHER'] as const;

// Per-user request cap, keyed on the authenticated id. The spend cap already
// bounds cost; this bounds request frequency (OpenAI TPM/RPM limits, runaway
// client loops) for a normal editing pace of a handful of turns per minute.
const AI_LIMIT_PER_MIN = 20;

type ChatMessage = { role: 'user' | 'assistant'; content: string; images?: string[] };

/** Cap on total attached images fed to the model per request, to bound payload/vision cost. */
const MAX_TOTAL_ATTACHMENTS = 12;

// Cost-bounding limits for a SINGLE request. The per-user spend cap and rate
// limit bound aggregate usage over time; these bound how expensive one call can
// get, so no individual request can run away with tokens or images.
const MAX_COMPLETION_TOKENS = 2000; // ceiling on tokens the model may generate per round
const MAX_HISTORY_MESSAGES = 24; // keep only the most recent turns of chat history
const MAX_MESSAGE_CHARS = 6000; // truncate any single message fed to the model
const MAX_SLIDE_JSON_CHARS = 20000; // truncate slide JSON dumped into context / tool results
const MAX_BODY_BYTES = 25 * 1024 * 1024; // reject absurd payloads outright (generous: fits ~12 image attachments)
const MAX_IMAGES_PER_REQUEST = 3; // cap on generate_image calls (the priciest op) per request

/** Truncates text to at most `max` chars, marking the cut so the model knows content was omitted. */
function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n…(truncado: ${text.length - max} caracteres omitidos)`;
}

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
      name: 'place_attached_image',
      description:
        'Places an image the teacher ATTACHED to the chat (not a generated one) onto an imageUrl-like field of a slide. Use this when the teacher wants their own uploaded photo/screenshot to appear on the slide (as reference material, a real photo, etc.), instead of generating a new one. The attachment is identified by its 0-based index in the "imagens anexadas" list from the context. Do NOT use this to transcribe/extract text from an image — for that, just read the attached image and use set_field/add_slide/etc.',
      parameters: {
        type: 'object',
        properties: {
          slideIndex: { type: 'number', description: 'Omit to target the active slide. Otherwise, the 0-based index of a slide previously fetched via get_slide_data in this turn.' },
          attachmentIndex: { type: 'number', description: '0-based index of the attached image, per the "imagens anexadas" list in the context.' },
          path: { type: 'string', description: 'Dot-path to the imageUrl-like field to fill, e.g. "imageUrl", "imageUrl1", "imageUrls.0", "items.2.imageUrl".' },
        },
        required: ['attachmentIndex', 'path'],
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

Use as ferramentas disponíveis (get_slide_data, add_slide, reorder_slide, set_field, add_list_item, remove_list_item, move_block, generate_image, place_attached_image) para aplicar mudanças reais; não basta descrever em texto o que mudaria, você deve chamar a ferramenta.

Fluxo típico ao criar um slide: chame add_slide primeiro; nas chamadas seguintes DENTRO DO MESMO TURNO, set_field/add_list_item já se aplicam ao slide recém-criado (que passou a ser o ativo) — use isso para já preencher título, textos e itens de lista com conteúdo relevante ao pedido, em vez de deixar os placeholders genéricos do template.

Imagens: campos de imagem no JSON do slide seguem o padrão de nome imageUrl, imageUrl1/imageUrl2, imageUrls (array), avatar1Url/avatar2Url, etc. — mas o único jeito confiável de saber se (e onde) um slide tem campo de imagem é OLHAR o JSON de dados dele: nem todo template tem um. Se o JSON do slide ativo (ou do slide buscado via get_slide_data) não tiver nenhuma chave desse tipo, ele NÃO suporta imagem — diga isso ao professor em vez de inventar um nome de campo. set_field/add_list_item/place_attached_image validam o path contra o schema real do template e retornam "error: field ... does not exist" quando o campo não existe; se isso acontecer, NÃO diga ao professor que a imagem foi colocada — releia o JSON do slide, corrija o path para um campo que realmente existe (ou informe que esse slide não tem onde colocar imagem). Quando o professor pedir para adicionar/gerar/criar uma imagem (foto, ilustração, ícone...) num campo que existe, chame generate_image com um prompt visual detalhado em inglês; a ferramenta retorna a URL da imagem gerada, que você deve então aplicar com set_field (ou, se o campo for um item de uma lista de fotos, add_list_item) no campo apropriado. Nunca invente uma URL de imagem nem deixe o campo vazio quando o pedido for para gerar uma imagem — sempre chame generate_image primeiro. Não chame generate_image para um campo que já tem uma imagem, a menos que o professor peça para trocar/regenerar.

Imagens ANEXADAS pelo professor: o professor pode anexar imagens à conversa (o contexto informa quantas há e seus índices; você enxerga o conteúdo delas). Há dois usos possíveis, decida pelo que ele pediu:
- EXTRAIR conteúdo: se ele quer transcrever/aproveitar o que está NA imagem (texto de uma página de livro, um exercício fotografado, uma lista, uma tabela...), leia a imagem e use as ferramentas normais (set_field, add_slide, add_list_item, etc.) para transformar esse conteúdo em slide(s). Nesse caso NÃO use place_attached_image — a imagem é só a fonte, não vai para o slide.
- COLOCAR a imagem no slide: se ele quer que a própria foto/screenshot anexada apareça no slide (como referência, foto real, etc.), chame place_attached_image com o attachmentIndex e o path do campo de imagem. Não use set_field para isso — os dados binários da imagem são grandes; place_attached_image cuida de salvar a imagem e preencher o campo com a URL certa.
- A imagem anexada também pode servir de REFERÊNCIA VISUAL para um generate_image (ex.: "gere algo no estilo dessa foto"): descreva no prompt em inglês o que você vê nela.

Regras:
- Preserve o idioma e o tom do conteúdo existente (a maior parte do texto do slide costuma estar em inglês, sendo uma aula de inglês; breadcrumbs/labels de UI podem estar em português).
- Ao adicionar itens a uma lista (rows, tips, questions, etc.), siga exatamente a forma (as mesmas chaves) dos itens já existentes nessa lista, que você vê no JSON de dados do slide (ou, para um slide recém-criado, a forma já preenchida por padrão nesse template).
- Ao mover um bloco (move_block), use apenas os dragKeys listados no contexto de layout do slide (ou, para um slide não-ativo, os dragKeys retornados por get_slide_data) — nunca invente um dragKey. Um slide recém-criado via add_slide pode ter dragKeys diferentes dos do slide anterior; não reaproveite a lista antiga.
- Os índices do deck no contexto refletem o estado ANTES desta rodada de ferramentas. Um add_slide sempre insere no final da lista atual (índice = tamanho do deck antes de inserir); se você chamar add_slide e depois reorder_slide no mesmo turno, calcule o índice de origem do novo slide considerando essa inserção.
- Só chame get_slide_data para slides que você realmente vai editar nesta rodada — cada chamada tem custo. Se o pedido envolver vários slides (ex: "mude do slide X ao Y"), chame get_slide_data para cada um deles que for editar, um por um.
- Ao falar em texto com o professor sobre a posição de um slide (não em parâmetros de ferramentas, que continuam 0-based), use numeração igual à da interface: índice 0 da lista de contexto = "slide 1", índice 4 = "slide 5", etc. Nunca exponha o índice 0-based cru numa frase para o professor.
- Depois de aplicar as mudanças, responda ao professor em texto de forma breve confirmando o que foi feito — mas só confirme o que as ferramentas de fato retornaram como "ok"; se alguma chamada relevante ao pedido voltou "error", reporte a limitação real em vez de dizer que deu certo.
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

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Writes raw image bytes under public/uploads/<subdir>/ and returns the public URL. */
async function saveImageBuffer(buffer: Buffer, subdir: string, ext: string): Promise<string> {
  const dirRel = path.join('uploads', subdir);
  const dirAbs = path.join(process.cwd(), 'public', dirRel);
  await mkdir(dirAbs, { recursive: true });

  const fileName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dirAbs, fileName), buffer);

  return `/${dirRel.replace(/\\/g, '/')}/${fileName}`;
}

/** Parses a `data:<mime>;base64,<bytes>` URL into a Buffer + file extension. Returns null if not a data URL. */
function parseDataUrl(dataUrl: string): { buffer: Buffer; ext: string } | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match || !match[2]) return null; // only base64 data URLs are supported
  const mime = (match[1] || 'image/png').toLowerCase();
  if (!mime.startsWith('image/')) return null;
  return { buffer: Buffer.from(match[3], 'base64'), ext: EXT_BY_MIME[mime] ?? 'png' };
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

  return saveImageBuffer(Buffer.from(b64, 'base64'), 'ai-generated', 'png');
}

export async function POST(req: NextRequest) {
  const guard = await requireRoleApi([...TEACHER_OR_ABOVE]);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const rl = rateLimit(`ai:${guard.user.id}`, AI_LIMIT_PER_MIN, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Muitas requisições em pouco tempo. Aguarde um momento e tente de novo.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

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

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Requisição muito grande.' }, { status: 413 });
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

  // Bound input cost: keep only the most recent turns and cap each message's length.
  const trimmedMessages = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ ...m, content: typeof m.content === 'string' ? truncate(m.content, MAX_MESSAGE_CHARS) : m.content }));

  const client = new OpenAI({ apiKey });

  const deckList = deckOverview
    .map((s, i) => `${i}: ${s.template}${i === activeIndex ? ' (slide ativo)' : ''}`)
    .join('\n');

  // Flatten every attached image across the conversation into a stable, indexed list, and build the
  // OpenAI message params — user messages with images become multimodal content so the vision-capable
  // model can actually see them. Each image is tagged with its index so place_attached_image lines up.
  const attachments: string[] = [];
  const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = trimmedMessages.map((m) => {
    const imgs = Array.isArray(m.images)
      ? m.images.filter((s): s is string => typeof s === 'string' && s.startsWith('data:image/'))
      : [];
    if (m.role !== 'user' || imgs.length === 0) {
      return { role: m.role, content: m.content } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
    }
    const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    if (m.content) parts.push({ type: 'text', text: m.content });
    for (const img of imgs) {
      if (attachments.length >= MAX_TOTAL_ATTACHMENTS) break;
      parts.push({ type: 'text', text: `[imagem anexada #${attachments.length}]` });
      parts.push({ type: 'image_url', image_url: { url: img } });
      attachments.push(img);
    }
    return { role: 'user', content: parts };
  });

  const attachmentsNote = attachments.length
    ? `\nImagens anexadas nesta conversa: ${attachments.length} (índices 0 a ${attachments.length - 1}, na ordem em que aparecem, cada uma marcada acima com "[imagem anexada #N]"). Para COLOCAR uma delas num campo de imagem do slide, chame place_attached_image com o attachmentIndex correspondente. Para EXTRAIR o conteúdo delas, apenas leia a imagem e use as ferramentas normais.`
    : '';

  const contextMessage = [
    `Deck completo (índice: template) — use estes índices em reorder_slide:`,
    deckList || '(deck vazio)',
    '',
    `Template do slide ativo: "${template}" (índice ${activeIndex}).`,
    `Blocos móveis (dragKey) disponíveis para move_block: ${dragKeys.length ? dragKeys.join(', ') : '(nenhum)'}.`,
    'JSON de dados atual do slide ativo:',
    truncate(JSON.stringify(slideData, null, 2), MAX_SLIDE_JSON_CHARS),
    attachmentsNote,
  ].join('\n');

  const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextMessage },
    ...conversation,
  ];

  /** Resolves which template a tool call targets (explicit slideIndex, or the active slide) and
   *  checks `path`/`listPath` against that template's default data shape. Returns an error string
   *  to feed back to the model, or null if the path is valid. */
  function invalidPathError(slideIndex: number | undefined, dotPath: string): string | null {
    const targetTemplate = typeof slideIndex === 'number' ? deckOverview[slideIndex]?.template : template;
    if (!targetTemplate) return `error: slideIndex ${slideIndex} out of range`;
    const shape = TEMPLATE_META[targetTemplate as keyof typeof TEMPLATE_META]?.createData();
    if (shape === undefined) return null; // unknown template shape; don't block on it
    if (!pathExistsInShape(shape, dotPath)) {
      return `error: field "${dotPath}" does not exist on template "${targetTemplate}" — check the slide's JSON data shape and use an existing field path instead of inventing one`;
    }
    return null;
  }

  let reply = '';
  let imagesGenerated = 0;
  const actions: AiSlideAction[] = [];

  try {
    for (let round = 0; round < 6; round++) {
      const completion = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: chatMessages,
        tools,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
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
              truncate(JSON.stringify(target.data, null, 2), MAX_SLIDE_JSON_CHARS),
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
          case 'set_field': {
            if (typeof args.path !== 'string' || typeof args.value !== 'string') {
              resultSummary = 'error: missing path/value';
              break;
            }
            const slideIndex = typeof args.slideIndex === 'number' ? args.slideIndex : undefined;
            const pathError = invalidPathError(slideIndex, args.path);
            if (pathError) {
              resultSummary = pathError;
              break;
            }
            actions.push({ kind: 'setField', slideIndex, path: args.path, value: args.value });
            break;
          }
          case 'add_list_item': {
            if (typeof args.listPath !== 'string' || !args.item || typeof args.item !== 'object') {
              resultSummary = 'error: missing listPath/item';
              break;
            }
            const slideIndex = typeof args.slideIndex === 'number' ? args.slideIndex : undefined;
            const pathError = invalidPathError(slideIndex, args.listPath);
            if (pathError) {
              resultSummary = pathError;
              break;
            }
            actions.push({ kind: 'addListItem', slideIndex, listPath: args.listPath, item: args.item as Record<string, unknown> });
            break;
          }
          case 'remove_list_item': {
            if (typeof args.listPath !== 'string' || typeof args.index !== 'number') {
              resultSummary = 'error: missing listPath/index';
              break;
            }
            const slideIndex = typeof args.slideIndex === 'number' ? args.slideIndex : undefined;
            const pathError = invalidPathError(slideIndex, args.listPath);
            if (pathError) {
              resultSummary = pathError;
              break;
            }
            actions.push({ kind: 'removeListItem', slideIndex, listPath: args.listPath, index: args.index });
            break;
          }
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
              if (imagesGenerated >= MAX_IMAGES_PER_REQUEST) {
                resultSummary = `error: image limit reached (${MAX_IMAGES_PER_REQUEST} per request) — stop generating; tell the teacher to ask again in a new message if more images are needed`;
              } else if (guard.user.role !== 'ADMIN' && (await isUserOverAiSpendCap(guard.user.id))) {
                resultSummary = 'error: user reached their AI spend cap — stop and tell the teacher to contact an admin';
              } else {
                try {
                  const url = await generateSlideImage(client, args.prompt, args.orientation, guard.user.id);
                  imagesGenerated++;
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
          case 'place_attached_image': {
            const attachmentIndex = args.attachmentIndex;
            const targetPath = args.path;
            if (
              typeof attachmentIndex !== 'number' ||
              !Number.isInteger(attachmentIndex) ||
              attachmentIndex < 0 ||
              attachmentIndex >= attachments.length
            ) {
              resultSummary = 'error: attachmentIndex out of range';
              break;
            }
            if (typeof targetPath !== 'string' || !targetPath) {
              resultSummary = 'error: missing path';
              break;
            }
            const slideIndex = typeof args.slideIndex === 'number' ? args.slideIndex : undefined;
            const pathError = invalidPathError(slideIndex, targetPath);
            if (pathError) {
              resultSummary = pathError;
              break;
            }
            const parsed = parseDataUrl(attachments[attachmentIndex]);
            if (!parsed) {
              resultSummary = 'error: attachment is not a valid image';
              break;
            }
            try {
              const url = await saveImageBuffer(parsed.buffer, 'chat-attachments', parsed.ext);
              actions.push({ kind: 'setField', slideIndex, path: targetPath, value: url });
              resultSummary = `ok: attached image ${attachmentIndex} placed at ${targetPath} (url ${url})`;
            } catch (err) {
              const message = err instanceof Error ? err.message : 'unknown error';
              resultSummary = `error: failed to place attached image — ${message}`;
            }
            break;
          }
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
