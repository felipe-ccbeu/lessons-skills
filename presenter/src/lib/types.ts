export type ExerciseRow = {
  orig: string;
  hl: string;
  post: string;
};

export type SectionTransitionData = {
  breadcrumb: string;
  tag: string;
  title: string;
  subtitle: string;
};

export type Exercise1Data = {
  breadcrumb: string;
  title: string;
  instructionPre: string;
  instructionHl: string;
  instructionPost: string;
  rows: ExerciseRow[];
};

export type PhotoCaptionData = {
  breadcrumb: string;
  title: string;
  name: string;
  role: string;
  sentencePre: string;
  answer: string;
  sentencePost: string;
  imageUrl: string;
};

export type PptxImageData = {
  imageUrl: string;
  sourceFile: string;
  slideNumber: number;
};

export type PollOptionDraft = { id: string; label: string };

export type PollData = {
  breadcrumb: string;
  question: string;
  options: PollOptionDraft[]; // 2-4 entries
};

/** Keys of `data` (per slide) that the teacher marked as an answer, hidden until revealed. */
export type AnswerFields = string[];

export type Slide =
  | { id: string; template: 'sectionTransition'; data: SectionTransitionData; answerFields?: AnswerFields }
  | { id: string; template: 'exercise1'; data: Exercise1Data; answerFields?: AnswerFields }
  | { id: string; template: 'photoCaption'; data: PhotoCaptionData; answerFields?: AnswerFields }
  | { id: string; template: 'pptxImage'; data: PptxImageData; answerFields?: AnswerFields }
  | { id: string; template: 'poll'; data: PollData; answerFields?: AnswerFields };

export type SlideTemplate = Slide['template'];
