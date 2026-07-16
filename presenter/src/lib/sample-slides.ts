import { Slide } from './types';

export const sampleSlides: Slide[] = [
  {
    id: 's1',
    template: 'sectionTransition',
    data: {
      breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · ROTINA',
      tag: 'ROLL CALL',
      title: 'Roll call!',
      subtitle: 'Study the sentences',
    },
  },
  {
    id: 's2',
    template: 'exercise1',
    data: {
      breadcrumb: 'UNIT 1 · LESSON A · PART 2 · PRACTICE',
      title: 'Transform the sentences',
      instructionPre: 'Rewrite each sentence using the',
      instructionHl: 'short form',
      instructionPost: '.',
      rows: [
        { orig: 'I am a teacher.', hl: "I'm", post: 'a teacher.' },
        { orig: 'You are from Brazil.', hl: "You're", post: 'from Brazil.' },
        { orig: 'We are students.', hl: "We're", post: 'students.' },
        { orig: 'They are at school.', hl: "They're", post: 'at school.' },
      ],
    },
  },
  {
    id: 's3',
    template: 'photoCaption',
    data: {
      breadcrumb: 'UNIT 1 · LESSON B · WHO IS THIS?',
      title: 'Who is this person?',
      name: 'Camila Souza',
      role: 'English Teacher',
      sentencePre: 'She is a',
      answer: 'teacher',
      sentencePost: 'at CCBEU.',
      imageUrl: '',
    },
    answerFields: ['answer'],
  },
];
