import { SlideAnimationId } from './slideAnimations';
import { BlockAnimationId } from './blockEntranceAnimations';

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

export type CustomHtmlData = {
  html: string;
  sourceFile: string;
};

export type PollOptionDraft = { id: string; label: string };

export type PollData = {
  breadcrumb: string;
  question: string;
  options: PollOptionDraft[]; // 2-4 entries
};

export type BlankData = Record<string, never>;

export type ObjectivesData = {
  breadcrumb: string;
  obj1Verb: string;
  obj1Pre: string;
  obj1Hl: string;
  obj1Post: string;
  obj2Verb: string;
  obj2Text: string;
  obj3Verb: string;
  obj3Text: string;
};

export type GettingStartedData = {
  breadcrumb: string;
  title: string;
  subtitle: string;
  imageUrl: string;
};

export type ComparativeData = {
  breadcrumb: string;
  title: string;
  leftHl: string;
  leftText: string;
  rightHl: string;
  rightText: string;
};

export type MultipleChoiceOptionDraft = { id: string; text: string };

export type MultipleChoiceData = {
  breadcrumb: string;
  tag: string;
  question: string;
  options: MultipleChoiceOptionDraft[]; // any length, lettered A/B/C/... automatically
};

export type GuessFourImagesData = {
  breadcrumb: string;
  title: string;
  instruction: string;
  examplePre: string;
  exampleHl: string;
  imageUrls: [string, string, string, string];
};

export type CoverImageData = Record<string, never>;

export type ChangePlacesRow = { label: string; sentence: string };
export type ChangePlacesData = {
  breadcrumb: string;
  title: string;
  rows: ChangePlacesRow[]; // any length
};

export type CompleteTheChartRow = { sentence: string; answer: string };
export type CompleteTheChartGroup = { label: string; rows: CompleteTheChartRow[] };
export type CompleteTheChartData = {
  breadcrumb: string;
  title: string;
  group1: CompleteTheChartGroup;
  group2: CompleteTheChartGroup;
};

export type Fluency2Data = {
  breadcrumb: string;
  title: string;
  instructionPre: string;
  instructionHl: string;
  imageUrl: string;
};

export type Fluency3Data = {
  breadcrumb: string;
  title: string;
  instruction: string;
  imageUrl1: string;
  imageUrl2: string;
};

export type Fluency1Question = string | { pre: string };
export type Fluency1Data = {
  breadcrumb: string;
  title: string;
  instruction: string;
  questions: Fluency1Question[]; // any length, auto-split into 2 columns
};

export type WarmupOralTransformRow = { pre: string; answer: string; post: string };
export type WarmupOralTransformData = {
  breadcrumb: string;
  title: string;
  instruction: string;
  rows: WarmupOralTransformRow[]; // any length
  ctaTitle: string;
  ctaSubtitle: string; // empty -> subtitle paragraph dropped entirely
  timeBadge: string; // empty -> pink pill dropped entirely
};

export type ListenAndRepeatData = {
  breadcrumb: string;
  step1: string;
  step2: string;
  step3Pre: string;
  step3Hl: string;
  tip: string;
  dialogueLine1: string;
  dialogueLine2: string;
  avatar1Url: string;
  avatar2Url: string;
};

export type PhotoExerciseWhoIsThisData = {
  breadcrumb: string;
  title: string;
  personName: string;
  personRole: string;
  sentencePre: string;
  sentenceGap: string;
  imageUrl: string;
};

export type PhotoGridBlankItem = { answer: string; text: string; imageUrl: string };
export type PhotoGridBlankData = {
  breadcrumb: string;
  title: string;
  items: PhotoGridBlankItem[]; // any length
};

export type GrammarBoxLookRow = { subject: string; hl: string; text: string };
export type GrammarBoxLookTip = { full: string; short: string };
export type GrammarBoxLookData = {
  breadcrumb: string;
  topicName: string;
  ex1Pre: string;
  ex1Hl: string;
  ex1Post: string;
  ex2Pre: string;
  ex2Hl: string;
  ex2Post: string;
  tableHeader: string;
  rows: GrammarBoxLookRow[]; // any length
  tips: GrammarBoxLookTip[]; // any length
  imageUrl1: string;
  imageUrl2: string;
};

export type GrammarBox2YesNoRow = {
  subject: string;
  qHl: string;
  qPost: string;
  aPre: string;
  aYes: string;
  aMid: string;
  aNo: string;
};
export type GrammarBox2YesNoData = {
  breadcrumb: string;
  photo1Caption: string;
  photo2Caption: string;
  col2Header: string;
  col3Header: string;
  rows: GrammarBox2YesNoRow[]; // any length
  imageUrl1: string;
  imageUrl2: string;
};

export type MatchVocabImageData = {
  breadcrumb: string;
  title: string;
  instruction: string;
  keywords: string[]; // any length
  answers: string[]; // any length, independent of keywords
  imageUrl: string;
};

export type ModelExampleListData = {
  breadcrumb: string;
  title: string;
  example: string;
  items: string[]; // any length
};

export type LessonCompleteTerm = { t: string; d: string };
export type LessonCompleteColumn = { header: string; terms: LessonCompleteTerm[] };
export type LessonCompleteData = {
  breadcrumb: string;
  columns: LessonCompleteColumn[]; // 1-4 columns
};

export type PracticeQaBadgesRow = { question: string; yes: string; no: string };
export type PracticeQaBadgesData = {
  breadcrumb: string;
  title: string;
  rows: PracticeQaBadgesRow[]; // any length
};

export type MatchingWithChartRow = { label: string; answer: string };
export type MatchingWithChartData = {
  breadcrumb: string;
  title: string;
  matchLabel: string;
  matchPrompts: string[]; // any length, numbered
  matchOptions: string[]; // any length, lettered
  matchAnswerKey: string; // optional
  chartLabel: string;
  chartRows: MatchingWithChartRow[]; // any length
};

export type MatchLettersRow = { term: string; letter: string };
export type MatchLettersData = {
  breadcrumb: string;
  title: string;
  instruction: string;
  rows: MatchLettersRow[]; // any length
  gridImageUrl: string;
};

/** Keys of `data` (per slide) that the teacher marked as an answer, hidden until revealed. */
export type AnswerFields = string[];

/** Per-field text style override, applied on top of a template's built-in styling. */
export type TextStyleOverride = {
  color?: string;
  fontSize?: number; // px
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
};

/** Keyed the same way as `AnswerFields` (a `data` field path, e.g. `"rows.0.orig"`). */
export type StyleOverrides = Record<string, TextStyleOverride>;

/** Pixel offset from a block's default position (applied at 1280x720 stage scale). */
export type LayoutOffset = { dx: number; dy: number };

/** Keyed by the block's `dragKey` (a stable per-template id, e.g. `"grammarBox"`, `"tips"`). */
export type LayoutOverrides = Record<string, LayoutOffset>;

/** Per-block entrance animation override, keyed the same way as `LayoutOverrides` (by `dragKey`). */
export type BlockAnimations = Record<string, BlockAnimationId>;

/**
 * A block copied from a template (via its `dragKey`) and pasted onto a slide as a free-floating
 * element — a frozen HTML snapshot, editable as plain text but disconnected from the source
 * template's data bindings. Lets a teacher move a component (e.g. a Tips box) onto a slide whose
 * template doesn't natively have one.
 */
export type PastedBlock = {
  id: string;
  html: string;
  x: number;
  y: number;
  width?: number;
};

/**
 * One resolved AI tool call the client applies via its existing edit handlers. `addSlide` targets
 * the deck as a whole (appends + activates); the rest target whichever slide is active *after* any
 * prior `addSlide` in the same batch has been applied — see `applyAiActions` in PresenterApp.
 */
export type AiSlideAction =
  | { kind: 'addSlide'; template: SlideTemplate }
  | { kind: 'reorderSlide'; fromIndex: number; toIndex: number }
  | { kind: 'setField'; path: string; value: string }
  | { kind: 'addListItem'; listPath: string; item: Record<string, unknown> }
  | { kind: 'removeListItem'; listPath: string; index: number }
  | { kind: 'moveBlock'; dragKey: string; dx: number; dy: number };

export type Slide =
  | { id: string; template: 'sectionTransition'; data: SectionTransitionData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'exercise1'; data: Exercise1Data; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'photoCaption'; data: PhotoCaptionData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'pptxImage'; data: PptxImageData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'customHtml'; data: CustomHtmlData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'poll'; data: PollData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'blank'; data: BlankData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'objectives'; data: ObjectivesData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'gettingStarted'; data: GettingStartedData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'comparative'; data: ComparativeData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'multipleChoice'; data: MultipleChoiceData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'guessFourImages'; data: GuessFourImagesData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'coverImage'; data: CoverImageData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'changePlaces'; data: ChangePlacesData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'completeTheChart'; data: CompleteTheChartData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'fluency1'; data: Fluency1Data; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'fluency2'; data: Fluency2Data; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'fluency3'; data: Fluency3Data; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'warmupOralTransform'; data: WarmupOralTransformData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'listenAndRepeat'; data: ListenAndRepeatData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'photoExerciseWhoIsThis'; data: PhotoExerciseWhoIsThisData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'photoGridBlank'; data: PhotoGridBlankData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'grammarBoxLook'; data: GrammarBoxLookData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'grammarBox2YesNo'; data: GrammarBox2YesNoData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'matchVocabImage'; data: MatchVocabImageData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'modelExampleList'; data: ModelExampleListData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'lessonComplete'; data: LessonCompleteData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'practiceQaBadges'; data: PracticeQaBadgesData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'matchingWithChart'; data: MatchingWithChartData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations }
  | { id: string; template: 'matchLetters'; data: MatchLettersData; answerFields?: AnswerFields; styleOverrides?: StyleOverrides; layoutOverrides?: LayoutOverrides; pastedBlocks?: PastedBlock[]; animation?: SlideAnimationId; blockAnimations?: BlockAnimations };

export type SlideTemplate = Slide['template'];
