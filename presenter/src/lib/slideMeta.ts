// Single source of truth for every slide template's METADATA — the menu
// label/description, its default `data`, the drag targets it exposes and which
// of its lists are removable. Previously these four facts lived in four separate
// structures across three files (ADDABLE_TEMPLATES + createSlideData in
// slide-templates.ts, DRAG_KEYS_BY_TEMPLATE in dragKeys.ts,
// REMOVABLE_LISTS_BY_TEMPLATE in removableLists.ts), which made adding a
// template a five-file chore and let them drift out of sync silently. They're
// now one object per template here, and those modules re-derive their exports
// from this — so they can't disagree.
//
// IMPORTANT: this file must stay free of React component imports. It's pulled in
// by the AI chat *route handler* (server) via ADDABLE_TEMPLATES / DRAG_KEYS; the
// slide renderers are client components and live in the separate RENDERERS map
// (components/slides/index.ts). Keeping metadata and components apart is what
// lets the server read this without bundling the whole slide component tree.
import { SlideTemplate, TemplateDataMap } from './types';

export type RemovableList = {
  /** Prefix used by each row's own dragKey (row i => `${rowDragKeyPrefix}.${i}`). */
  rowDragKeyPrefix: string;
  /** Dot-path into `data` that getAtPath/removeAtPath operate on. */
  listPath: string;
  /** Mirrors a MIN_* constant local to the template component (e.g. MIN_OPTIONS in
   *  PollSlide.tsx) so removal-by-selection respects the same floor the template's
   *  own UI enforces. Keep in sync manually if that constant changes. */
  minLength?: number;
};

export type TemplateMeta<K extends SlideTemplate = SlideTemplate> = {
  /** Shown in the "add slide" menu. `false` = only created via import (pptxImage)
   *  or by code (customHtml), never offered as a fresh blank slide. */
  addable: boolean;
  label: string;
  description: string;
  /** Fresh default `data` for a new slide of this template (called per creation,
   *  so id-generating defaults like poll options get unique ids each time). */
  createData: () => TemplateDataMap[K];
  /** Every dragProps(...) key the renderer exposes (drag targets + AI move_block). */
  dragKeys?: string[];
  /** Lists whose rows can be removed by selection (right-click / delete). */
  removableLists?: RemovableList[];
};

// Ordered to match the "add slide" menu; the two non-addable templates
// (pptxImage, customHtml) come last. The `Record<SlideTemplate, …>` type makes
// this exhaustive — TypeScript errors if a new template is missing an entry.
export const TEMPLATE_META: { [K in SlideTemplate]: TemplateMeta<K> } = {
  coverImage: {
    addable: true,
    label: 'Capa',
    description: 'Abertura só com logo',
    createData: () => ({}),
  },
  objectives: {
    addable: true,
    label: 'Objetivos',
    description: 'Abertura da aula',
    dragKeys: ['title', 'objective1', 'objective2', 'objective3'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      obj1Verb: 'USE',
      obj1Pre: 'the verb',
      obj1Hl: 'to be',
      obj1Post: 'to talk about yourself.',
      obj2Verb: 'ASK',
      obj2Text: 'and answer simple questions.',
      obj3Verb: 'TALK',
      obj3Text: 'about where people are from.',
    }),
  },
  gettingStarted: {
    addable: true,
    label: 'Abertura de unidade',
    description: 'Número + título + foto',
    dragKeys: ['photo', 'title', 'subtitle'],
    createData: () => ({ breadcrumb: 'BREADCRUMB', title: 'Título da unidade', subtitle: 'Descrição curta da unidade.', imageUrl: '' }),
  },
  sectionTransition: {
    addable: true,
    label: 'Transição',
    description: 'Título de seção',
    dragKeys: ['tag', 'title', 'subtitle'],
    createData: () => ({ breadcrumb: 'BREADCRUMB', tag: 'TAG', title: 'Título', subtitle: 'Subtítulo' }),
  },
  warmupOralTransform: {
    addable: true,
    label: 'Warm-up (transformar)',
    description: 'Aquecimento oral com CTA',
    dragKeys: ['title', 'instruction', 'rows', 'ctaBox'],
    removableLists: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Change to the negative!',
      instruction: 'Change the sentences to the negative!',
      rows: [{ pre: '', answer: "I'm not", post: 'from China.' }],
      ctaTitle: 'Work in Pairs!',
      ctaSubtitle: '',
      timeBadge: '',
    }),
  },
  grammarBoxLook: {
    addable: true,
    label: 'Grammar box',
    description: 'Tabela + dicas de gramática',
    dragKeys: ['grammarBoxLabel', 'title', 'example1', 'example2', 'grammarBox', 'tips'],
    removableLists: [
      { rowDragKeyPrefix: 'rows', listPath: 'rows' },
      { rowDragKeyPrefix: 'tips', listPath: 'tips' },
    ],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      topicName: 'VERB TO BE',
      ex1Pre: 'Hi, ',
      ex1Hl: "I'm",
      ex1Post: 'Camila.',
      ex2Pre: 'Hi, ',
      ex2Hl: "I'm",
      ex2Post: 'Rubén.',
      tableHeader: 'AM / IS / ARE',
      rows: [{ subject: 'I', hl: 'am', text: 'from Brazil.' }],
      tips: [{ full: 'I am', short: "I'm" }],
      imageUrl1: '',
      imageUrl2: '',
    }),
  },
  grammarBox2YesNo: {
    addable: true,
    label: 'Grammar box (sim/não)',
    description: 'Tabela pergunta/resposta',
    dragKeys: ['title', 'photo1', 'photo2', 'grammarBox'],
    removableLists: [{ rowDragKeyPrefix: 'grammarBox.rows', listPath: 'rows' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      photo1Caption: '"Are you students?"',
      photo2Caption: '"Is she a teacher?"',
      col2Header: 'YES/NO QUESTION',
      col3Header: 'SHORT ANSWER',
      rows: [{ subject: 'you', qHl: 'Are', qPost: 'a student?', aPre: 'Yes, I', aYes: 'am', aMid: 'No, I', aNo: "'m not" }],
      imageUrl1: '',
      imageUrl2: '',
    }),
  },
  comparative: {
    addable: true,
    label: 'Comparativo',
    description: 'Dois cartões lado a lado',
    dragKeys: ['title', 'leftBox', 'rightBox'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Título comparativo',
      leftHl: 'Afirmação',
      leftText: 'resto da frase.',
      rightHl: 'Pergunta',
      rightText: 'resto da frase?',
    }),
  },
  changePlaces: {
    addable: true,
    label: 'Transformar frases',
    description: 'Cartões label + frase',
    dragKeys: ['title'],
    // ChangePlacesSlide's rows predate the `${prefix}.${i}` convention and persist
    // dragKeys as `row${i}` (no separator) — resolveRemovableRow matches both.
    removableLists: [{ rowDragKeyPrefix: 'row', listPath: 'rows' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Change to the negative!',
      rows: [
        { label: '1', sentence: "I'm not from China." },
        { label: '2', sentence: "I'm not James." },
      ],
    }),
  },
  completeTheChart: {
    addable: true,
    label: 'Complete o quadro',
    description: '2 grupos de lacunas',
    dragKeys: ['title', 'imagePlaceholder1', 'imagePlaceholder2', 'imagePlaceholder3'],
    removableLists: [
      { rowDragKeyPrefix: 'group1.rows', listPath: 'group1.rows' },
      { rowDragKeyPrefix: 'group2.rows', listPath: 'group2.rows' },
    ],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Complete the chart',
      group1: { label: 'CONTRACTIONS', rows: [{ sentence: 'I am', answer: "I'm" }] },
      group2: { label: 'NEGATIVES', rows: [{ sentence: 'I am not', answer: "I'm not" }] },
      imageUrl1: '',
      imageUrl2: '',
      imageUrl3: '',
    }),
  },
  exercise1: {
    addable: true,
    label: 'Exercício',
    description: 'Lista de frases',
    dragKeys: ['title', 'instruction', 'rows'],
    removableLists: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Título do exercício',
      instructionPre: 'Instrução com',
      instructionHl: 'destaque',
      instructionPost: '.',
      rows: [{ orig: 'Frase original.', hl: 'Destaque', post: 'restante.' }],
    }),
  },
  multipleChoice: {
    addable: true,
    label: 'Múltipla escolha',
    description: 'Pergunta com alternativas',
    dragKeys: ['tag', 'question', 'options'],
    removableLists: [{ rowDragKeyPrefix: 'options', listPath: 'options', minLength: 2 /* mirrors MIN_OPTIONS in MultipleChoiceSlide.tsx */ }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      tag: 'Books closed! Do you remember?',
      question: 'Pergunta de múltipla escolha?',
      options: [
        { id: `mc-${Date.now()}-1`, text: 'Alternativa 1' },
        { id: `mc-${Date.now()}-2`, text: 'Alternativa 2' },
        { id: `mc-${Date.now()}-3`, text: 'Alternativa 3' },
      ],
    }),
  },
  practiceQaBadges: {
    addable: true,
    label: 'Perguntas sim/não',
    description: 'Pergunta com respostas sim/não',
    dragKeys: ['title', 'rows'],
    removableLists: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Ask and answer!',
      rows: [{ question: 'Are you a student?', yes: 'Yes, I am.', no: "No, I'm not." }],
    }),
  },
  modelExampleList: {
    addable: true,
    label: 'Exemplo + prática',
    description: 'Modelo seguido de itens',
    dragKeys: ['title', 'list'],
    removableLists: [{ rowDragKeyPrefix: 'list', listPath: 'items' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Talk about nationalities and jobs',
      example: 'Neymar is Brazilian, he is a soccer player.',
      items: ['Zhu Ting is Chinese, she is a volleyball player.'],
    }),
  },
  photoCaption: {
    addable: true,
    label: 'Foto + legenda',
    description: 'Pessoa com frase',
    dragKeys: ['title', 'name', 'role', 'sentence', 'photo'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Título',
      name: 'Nome',
      role: 'Cargo',
      sentencePre: 'Frase com',
      answer: 'resposta',
      sentencePost: 'no final.',
      imageUrl: '',
    }),
  },
  photoExerciseWhoIsThis: {
    addable: true,
    label: 'Quem é essa pessoa?',
    description: 'Foto com lacuna',
    dragKeys: ['photo', 'title', 'personName', 'personRole', 'sentence'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Who is this person?',
      personName: 'Nome',
      personRole: 'Cargo',
      sentencePre: 'She is a',
      sentenceGap: 'teacher',
      imageUrl: '',
    }),
  },
  photoGridBlank: {
    addable: true,
    label: 'Grade de fotos',
    description: 'Fotos com legenda lacunada',
    dragKeys: ['title', 'items'],
    removableLists: [{ rowDragKeyPrefix: 'items', listPath: 'items' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: "Complete the sentences with he's, she's, or they're.",
      items: [
        { answer: "He's", text: 'Italian.', imageUrl: '' },
        { answer: "She's", text: 'Chinese.', imageUrl: '' },
      ],
    }),
  },
  guessFourImages: {
    addable: true,
    label: 'Adivinhe (4 fotos)',
    description: 'Jogo com 4 imagens',
    dragKeys: ['title', 'instruction', 'example'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Where are they from?',
      instruction: 'Guess where each person is from.',
      examplePre: 'Ex. She is from',
      exampleHl: 'Japan',
      imageUrls: ['', '', '', ''],
    }),
  },
  fluency1: {
    addable: true,
    label: 'Fluência (perguntas)',
    description: '2 colunas de perguntas',
    dragKeys: ['title', 'instruction', 'leftColumn', 'rightColumn'],
    removableLists: [{ rowDragKeyPrefix: 'questions', listPath: 'questions' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Fluency practice',
      instruction: 'Ask and answer with a partner.',
      questions: ['What is your name?', { pre: 'My favorite color is' }],
    }),
  },
  fluency2: {
    addable: true,
    label: 'Fluência (descrever)',
    description: 'Foto grande + instrução',
    dragKeys: ['title', 'instruction', 'image'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Look and describe',
      instructionPre: 'Describe the',
      instructionHl: 'picture',
      imageUrl: '',
    }),
  },
  fluency3: {
    addable: true,
    label: 'Fluência (comparar)',
    description: '2 fotos lado a lado',
    dragKeys: ['title', 'instruction', 'photo1', 'photo2'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Compare the two people',
      instruction: 'Compare the two photos with a partner.',
      imageUrl1: '',
      imageUrl2: '',
    }),
  },
  listenAndRepeat: {
    addable: true,
    label: 'Escute e repita',
    description: 'Passos + diálogo modelo',
    dragKeys: ['title', 'pairWorkLabel', 'steps', 'tip', 'dialogue1', 'avatar1', 'avatar2', 'dialogue2'],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      step1: 'Listen to the dialogue.',
      step2: 'Repeat each line.',
      step3Pre: 'Practice with a',
      step3Hl: 'partner',
      tip: 'Focus on pronunciation.',
      dialogueLine1: "Hi, I'm Camila.",
      dialogueLine2: 'Nice to meet you!',
      avatar1Url: '',
      avatar2Url: '',
    }),
  },
  matchVocabImage: {
    addable: true,
    label: 'Combine com a imagem',
    description: 'Vocabulário + mapa/imagem',
    dragKeys: ['title', 'instruction', 'keywords', 'image', 'answers'],
    removableLists: [
      { rowDragKeyPrefix: 'keywords', listPath: 'keywords' },
      { rowDragKeyPrefix: 'answers', listPath: 'answers' },
    ],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Match the vocabulary',
      instruction: 'Look at the map and match each word to the picture.',
      keywords: ['park', 'school', 'hospital'],
      answers: ['park', 'school'],
      imageUrl: '',
    }),
  },
  matchLetters: {
    addable: true,
    label: 'Combine (com fotos)',
    description: 'Grade de fotos + letras',
    dragKeys: ['title', 'instruction', 'gridImage', 'rows'],
    removableLists: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Match the nationalities',
      instruction: 'Match each nationality to its letter.',
      rows: [{ term: 'American', letter: 'A' }],
      gridImageUrl: '',
    }),
  },
  matchingWithChart: {
    addable: true,
    label: 'Combine + quadro',
    description: 'Correspondência + lacunas',
    dragKeys: ['title', 'matchColumn', 'chartColumn'],
    removableLists: [
      { rowDragKeyPrefix: 'matchColumn.prompts', listPath: 'matchPrompts' },
      { rowDragKeyPrefix: 'matchColumn.options', listPath: 'matchOptions' },
      { rowDragKeyPrefix: 'chartColumn.rows', listPath: 'chartRows' },
    ],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Match 1-3 with a-c. Listen and check.',
      matchLabel: 'Match 1-3 with a-c',
      matchPrompts: ['Heather Watson is a tennis player.'],
      matchOptions: ["He's Japanese."],
      matchAnswerKey: '',
      chartLabel: 'Complete the chart',
      chartRows: [{ label: 'he is', answer: "he's" }],
    }),
  },
  lessonComplete: {
    addable: true,
    label: 'Aula completa',
    description: 'Recapitulação final',
    dragKeys: ['title'],
    // Column count is data-driven (`data.columns`); this static list covers up
    // to 4 columns (more than the layout realistically fits). A 5th column falls
    // back to "not removable" (reset-only) rather than crash.
    removableLists: [0, 1, 2, 3].map((ci) => ({
      rowDragKeyPrefix: `column${ci}.terms`,
      listPath: `columns.${ci}.terms`,
    })),
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      columns: [
        { header: 'AFFIRMATIVES', terms: [{ t: "She's", d: 'Spanish.' }] },
        { header: 'NEGATIVES', terms: [{ t: "She's not", d: 'Japanese.' }] },
      ],
    }),
  },
  poll: {
    addable: true,
    label: 'Enquete',
    description: 'Pergunta com opções',
    dragKeys: ['question', 'options'],
    removableLists: [{ rowDragKeyPrefix: 'options', listPath: 'options', minLength: 2 /* mirrors MIN_OPTIONS in PollSlide.tsx */ }],
    createData: () => ({
      breadcrumb: 'Enquete',
      question: 'Qual a forma correta?',
      options: [
        { id: `opt-${Date.now()}-1`, label: 'Opção A' },
        { id: `opt-${Date.now()}-2`, label: 'Opção B' },
      ],
    }),
  },
  blank: {
    addable: true,
    label: 'Em branco',
    description: 'Slide vazio',
    createData: () => ({}),
  },
  rollCall: {
    addable: true,
    label: 'Chamada / frases úteis',
    description: 'Bolhas de frase + foto',
    dragKeys: ['title', 'phrases', 'photo'],
    removableLists: [{ rowDragKeyPrefix: 'phrases', listPath: 'phrases' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Roll call! Study the sentences',
      phrases: ['How can I say _____ in English?', 'Can you repeat please?', 'Excuse me.'],
      imageUrl: '',
    }),
  },
  dialoguePractice: {
    addable: true,
    label: 'Diálogo (com lacunas)',
    description: 'Word bank + falas em par',
    dragKeys: ['title', 'instruction', 'wordBank', 'lines'],
    removableLists: [
      { rowDragKeyPrefix: 'wordBank', listPath: 'wordBank' },
      { rowDragKeyPrefix: 'lines', listPath: 'lines' },
    ],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Practice the conversation with a pair!',
      instruction: 'Listen and complete 1-6 with the words in the box.',
      wordBank: ['American', 'Brazilian'],
      lines: [
        { speaker: 'A', textParts: ['This is Anna. ', { hl: "She's American." }] },
        { speaker: 'B', textParts: ['OK. And who is this?'] },
      ],
    }),
  },
  revealCardGrid: {
    addable: true,
    label: 'Cartões (pergunta + resposta)',
    description: 'Grade de fotos com resposta',
    dragKeys: ['title', 'items'],
    removableLists: [{ rowDragKeyPrefix: 'items', listPath: 'items' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: "What's the plural form of these words?",
      items: [
        { imageUrl: '', term: 'BOOK', answer: 'BOOKS' },
        { imageUrl: '', term: 'WATCH', answer: 'WATCHES' },
      ],
    }),
  },
  photoLabelGrid: {
    addable: true,
    label: 'Grade de fotos (vocabulário)',
    description: 'Fotos com legenda curta',
    dragKeys: ['title', 'items'],
    removableLists: [{ rowDragKeyPrefix: 'items', listPath: 'items' }],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      title: 'Look, listen and repeat.',
      items: [
        { imageUrl: '', caption: 'a suitcase' },
        { imageUrl: '', caption: 'a passport' },
      ],
    }),
  },
  lookLight: {
    addable: true,
    label: 'LOOK! (simples)',
    description: 'Exemplos + fotos, sem tabela',
    dragKeys: ['examples', 'tip', 'images'],
    removableLists: [
      { rowDragKeyPrefix: 'examples', listPath: 'examples' },
      { rowDragKeyPrefix: 'images', listPath: 'imageUrls' },
    ],
    createData: () => ({
      breadcrumb: 'BREADCRUMB',
      examples: [
        { pre: "It's", hl: 'a', post: 'banana.' },
        { pre: "It's", hl: 'an', post: 'apple.' },
      ],
      tip: 'Use a before a consonant sound. Use an before a vowel sound.',
      imageUrls: ['', ''],
    }),
  },
  // Non-addable: created only by importing a .pptx (pptxImage) or by code paths
  // that inject raw HTML (customHtml). They still need default data + metadata.
  pptxImage: {
    addable: false,
    label: 'Imagem (PPTX)',
    description: 'Slide importado de um .pptx como imagem',
    createData: () => ({ imageUrl: '', sourceFile: '', slideNumber: 1 }),
  },
  customHtml: {
    addable: false,
    label: 'HTML personalizado',
    description: 'Slide de HTML livre importado',
    createData: () => ({ html: '<!doctype html>\n<html>\n<body>\n</body>\n</html>', sourceFile: '' }),
  },
};
