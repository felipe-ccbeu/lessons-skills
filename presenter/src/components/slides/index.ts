import { SectionTransitionSlide } from './SectionTransitionSlide';
import { Exercise1Slide } from './Exercise1Slide';
import { PhotoCaptionSlide } from './PhotoCaptionSlide';
import { PptxImageSlide } from './PptxImageSlide';
import { PollSlide } from './PollSlide';
import { BlankSlide } from './BlankSlide';
import { ObjectivesSlide } from './ObjectivesSlide';
import { GettingStartedSlide } from './GettingStartedSlide';
import { ComparativeSlide } from './ComparativeSlide';
import { MultipleChoiceSlide } from './MultipleChoiceSlide';
import { GuessFourImagesSlide } from './GuessFourImagesSlide';
import { CoverImageSlide } from './CoverImageSlide';
import { ChangePlacesSlide } from './ChangePlacesSlide';
import { CompleteTheChartSlide } from './CompleteTheChartSlide';
import { Fluency1Slide } from './Fluency1Slide';
import { Fluency2Slide } from './Fluency2Slide';
import { Fluency3Slide } from './Fluency3Slide';
import { WarmupOralTransformSlide } from './WarmupOralTransformSlide';
import { ListenAndRepeatSlide } from './ListenAndRepeatSlide';
import { PhotoExerciseWhoIsThisSlide } from './PhotoExerciseWhoIsThisSlide';
import { PhotoGridBlankSlide } from './PhotoGridBlankSlide';
import { GrammarBoxLookSlide } from './GrammarBoxLookSlide';
import { GrammarBox2YesNoSlide } from './GrammarBox2YesNoSlide';
import { MatchVocabImageSlide } from './MatchVocabImageSlide';
import { ModelExampleListSlide } from './ModelExampleListSlide';
import { LessonCompleteSlide } from './LessonCompleteSlide';
import { PracticeQaBadgesSlide } from './PracticeQaBadgesSlide';
import { MatchingWithChartSlide } from './MatchingWithChartSlide';
import { MatchLettersSlide } from './MatchLettersSlide';
import { SlideTemplate } from '@/lib/types';

export const RENDERERS: Record<SlideTemplate, React.ComponentType<any>> = {
  sectionTransition: SectionTransitionSlide,
  exercise1: Exercise1Slide,
  photoCaption: PhotoCaptionSlide,
  pptxImage: PptxImageSlide,
  poll: PollSlide,
  blank: BlankSlide,
  objectives: ObjectivesSlide,
  gettingStarted: GettingStartedSlide,
  comparative: ComparativeSlide,
  multipleChoice: MultipleChoiceSlide,
  guessFourImages: GuessFourImagesSlide,
  coverImage: CoverImageSlide,
  changePlaces: ChangePlacesSlide,
  completeTheChart: CompleteTheChartSlide,
  fluency1: Fluency1Slide,
  fluency2: Fluency2Slide,
  fluency3: Fluency3Slide,
  warmupOralTransform: WarmupOralTransformSlide,
  listenAndRepeat: ListenAndRepeatSlide,
  photoExerciseWhoIsThis: PhotoExerciseWhoIsThisSlide,
  photoGridBlank: PhotoGridBlankSlide,
  grammarBoxLook: GrammarBoxLookSlide,
  grammarBox2YesNo: GrammarBox2YesNoSlide,
  matchVocabImage: MatchVocabImageSlide,
  modelExampleList: ModelExampleListSlide,
  lessonComplete: LessonCompleteSlide,
  practiceQaBadges: PracticeQaBadgesSlide,
  matchingWithChart: MatchingWithChartSlide,
  matchLetters: MatchLettersSlide,
};
