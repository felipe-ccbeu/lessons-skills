import { Slide, SlideTemplate } from './types';

export type TemplateInfo = { template: SlideTemplate; label: string; description: string };

/** Templates offered when adding a new slide — excludes `pptxImage`, which only comes from importing a file. */
export const ADDABLE_TEMPLATES: TemplateInfo[] = [
  { template: 'coverImage', label: 'Capa', description: 'Abertura só com logo' },
  { template: 'objectives', label: 'Objetivos', description: 'Abertura da aula' },
  { template: 'gettingStarted', label: 'Abertura de unidade', description: 'Número + título + foto' },
  { template: 'sectionTransition', label: 'Transição', description: 'Título de seção' },
  { template: 'warmupOralTransform', label: 'Warm-up (transformar)', description: 'Aquecimento oral com CTA' },
  { template: 'grammarBoxLook', label: 'Grammar box', description: 'Tabela + dicas de gramática' },
  { template: 'grammarBox2YesNo', label: 'Grammar box (sim/não)', description: 'Tabela pergunta/resposta' },
  { template: 'comparative', label: 'Comparativo', description: 'Dois cartões lado a lado' },
  { template: 'changePlaces', label: 'Transformar frases', description: 'Cartões label + frase' },
  { template: 'completeTheChart', label: 'Complete o quadro', description: '2 grupos de lacunas' },
  { template: 'exercise1', label: 'Exercício', description: 'Lista de frases' },
  { template: 'multipleChoice', label: 'Múltipla escolha', description: 'Pergunta com alternativas' },
  { template: 'practiceQaBadges', label: 'Perguntas sim/não', description: 'Pergunta com respostas sim/não' },
  { template: 'modelExampleList', label: 'Exemplo + prática', description: 'Modelo seguido de itens' },
  { template: 'photoCaption', label: 'Foto + legenda', description: 'Pessoa com frase' },
  { template: 'photoExerciseWhoIsThis', label: 'Quem é essa pessoa?', description: 'Foto com lacuna' },
  { template: 'photoGridBlank', label: 'Grade de fotos', description: 'Fotos com legenda lacunada' },
  { template: 'guessFourImages', label: 'Adivinhe (4 fotos)', description: 'Jogo com 4 imagens' },
  { template: 'fluency1', label: 'Fluência (perguntas)', description: '2 colunas de perguntas' },
  { template: 'fluency2', label: 'Fluência (descrever)', description: 'Foto grande + instrução' },
  { template: 'fluency3', label: 'Fluência (comparar)', description: '2 fotos lado a lado' },
  { template: 'listenAndRepeat', label: 'Escute e repita', description: 'Passos + diálogo modelo' },
  { template: 'matchVocabImage', label: 'Combine com a imagem', description: 'Vocabulário + mapa/imagem' },
  { template: 'matchLetters', label: 'Combine (com fotos)', description: 'Grade de fotos + letras' },
  { template: 'matchingWithChart', label: 'Combine + quadro', description: 'Correspondência + lacunas' },
  { template: 'lessonComplete', label: 'Aula completa', description: 'Recapitulação final' },
  { template: 'poll', label: 'Enquete', description: 'Pergunta com opções' },
  { template: 'blank', label: 'Em branco', description: 'Slide vazio' },
];

/** Default `data` shown as a template's preview and used when a new slide of that template is created. */
export function createSlideData(template: SlideTemplate): Slide['data'] {
  switch (template) {
    case 'sectionTransition':
      return { breadcrumb: 'BREADCRUMB', tag: 'TAG', title: 'Título', subtitle: 'Subtítulo' };
    case 'exercise1':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Título do exercício',
        instructionPre: 'Instrução com',
        instructionHl: 'destaque',
        instructionPost: '.',
        rows: [{ orig: 'Frase original.', hl: 'Destaque', post: 'restante.' }],
      };
    case 'photoCaption':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Título',
        name: 'Nome',
        role: 'Cargo',
        sentencePre: 'Frase com',
        answer: 'resposta',
        sentencePost: 'no final.',
        imageUrl: '',
      };
    case 'poll':
      return {
        breadcrumb: 'Enquete',
        question: 'Qual a forma correta?',
        options: [
          { id: `opt-${Date.now()}-1`, label: 'Opção A' },
          { id: `opt-${Date.now()}-2`, label: 'Opção B' },
        ],
      };
    case 'pptxImage':
      return { imageUrl: '', sourceFile: '', slideNumber: 1 };
    case 'blank':
      return {};
    case 'objectives':
      return {
        breadcrumb: 'BREADCRUMB',
        obj1Verb: 'USE',
        obj1Pre: 'the verb',
        obj1Hl: 'to be',
        obj1Post: 'to talk about yourself.',
        obj2Verb: 'ASK',
        obj2Text: 'and answer simple questions.',
        obj3Verb: 'TALK',
        obj3Text: 'about where people are from.',
      };
    case 'gettingStarted':
      return { breadcrumb: 'BREADCRUMB', title: 'Título da unidade', subtitle: 'Descrição curta da unidade.', imageUrl: '' };
    case 'comparative':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Título comparativo',
        leftHl: 'Afirmação',
        leftText: 'resto da frase.',
        rightHl: 'Pergunta',
        rightText: 'resto da frase?',
      };
    case 'multipleChoice':
      return {
        breadcrumb: 'BREADCRUMB',
        tag: 'Books closed! Do you remember?',
        question: 'Pergunta de múltipla escolha?',
        options: [
          { id: `mc-${Date.now()}-1`, text: 'Alternativa 1' },
          { id: `mc-${Date.now()}-2`, text: 'Alternativa 2' },
          { id: `mc-${Date.now()}-3`, text: 'Alternativa 3' },
        ],
      };
    case 'guessFourImages':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Where are they from?',
        instruction: 'Guess where each person is from.',
        examplePre: 'Ex. She is from',
        exampleHl: 'Japan',
        imageUrls: ['', '', '', ''],
      };
    case 'coverImage':
      return {};
    case 'changePlaces':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Change to the negative!',
        rows: [
          { label: '1', sentence: "I'm not from China." },
          { label: '2', sentence: "I'm not James." },
        ],
      };
    case 'completeTheChart':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Complete the chart',
        group1: { label: 'CONTRACTIONS', rows: [{ sentence: 'I am', answer: "I'm" }] },
        group2: { label: 'NEGATIVES', rows: [{ sentence: 'I am not', answer: "I'm not" }] },
      };
    case 'fluency1':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Fluency practice',
        instruction: 'Ask and answer with a partner.',
        questions: ['What is your name?', { pre: 'My favorite color is' }],
      };
    case 'fluency2':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Look and describe',
        instructionPre: 'Describe the',
        instructionHl: 'picture',
        imageUrl: '',
      };
    case 'fluency3':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Compare the two people',
        instruction: 'Compare the two photos with a partner.',
        imageUrl1: '',
        imageUrl2: '',
      };
    case 'warmupOralTransform':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Change to the negative!',
        instruction: 'Change the sentences to the negative!',
        rows: [{ pre: '', answer: "I'm not", post: 'from China.' }],
        ctaTitle: 'Work in Pairs!',
        ctaSubtitle: '',
        timeBadge: '',
      };
    case 'listenAndRepeat':
      return {
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
      };
    case 'photoExerciseWhoIsThis':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Who is this person?',
        personName: 'Nome',
        personRole: 'Cargo',
        sentencePre: 'She is a',
        sentenceGap: 'teacher',
        imageUrl: '',
      };
    case 'photoGridBlank':
      return {
        breadcrumb: 'BREADCRUMB',
        title: "Complete the sentences with he's, she's, or they're.",
        items: [
          { answer: "He's", text: 'Italian.', imageUrl: '' },
          { answer: "She's", text: 'Chinese.', imageUrl: '' },
        ],
      };
    case 'grammarBoxLook':
      return {
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
      };
    case 'grammarBox2YesNo':
      return {
        breadcrumb: 'BREADCRUMB',
        photo1Caption: '"Are you students?"',
        photo2Caption: '"Is she a teacher?"',
        col2Header: 'YES/NO QUESTION',
        col3Header: 'SHORT ANSWER',
        rows: [{ subject: 'you', qHl: 'Are', qPost: 'a student?', aPre: 'Yes, I', aYes: 'am', aMid: 'No, I', aNo: "'m not" }],
        imageUrl1: '',
        imageUrl2: '',
      };
    case 'matchVocabImage':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Match the vocabulary',
        instruction: 'Look at the map and match each word to the picture.',
        keywords: ['park', 'school', 'hospital'],
        answers: ['park', 'school'],
        imageUrl: '',
      };
    case 'modelExampleList':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Talk about nationalities and jobs',
        example: 'Neymar is Brazilian, he is a soccer player.',
        items: ['Zhu Ting is Chinese, she is a volleyball player.'],
      };
    case 'lessonComplete':
      return {
        breadcrumb: 'BREADCRUMB',
        columns: [
          { header: 'AFFIRMATIVES', terms: [{ t: "She's", d: 'Spanish.' }] },
          { header: 'NEGATIVES', terms: [{ t: "She's not", d: 'Japanese.' }] },
        ],
      };
    case 'practiceQaBadges':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Ask and answer!',
        rows: [{ question: 'Are you a student?', yes: 'Yes, I am.', no: "No, I'm not." }],
      };
    case 'matchingWithChart':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Match 1-3 with a-c. Listen and check.',
        matchLabel: 'Match 1-3 with a-c',
        matchPrompts: ['Heather Watson is a tennis player.'],
        matchOptions: ["He's Japanese."],
        matchAnswerKey: '',
        chartLabel: 'Complete the chart',
        chartRows: [{ label: 'he is', answer: "he's" }],
      };
    case 'matchLetters':
      return {
        breadcrumb: 'BREADCRUMB',
        title: 'Match the nationalities',
        instruction: 'Match each nationality to its letter.',
        rows: [{ term: 'American', letter: 'A' }],
        gridImageUrl: '',
      };
  }
}

export function createSlide(template: SlideTemplate): Slide {
  const id = `${template}-${Date.now()}`;
  return { id, template, data: createSlideData(template) } as Slide;
}
