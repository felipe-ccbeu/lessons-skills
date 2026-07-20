import { SectionTransitionSlide } from './SectionTransitionSlide';
import { Exercise1Slide } from './Exercise1Slide';
import { PhotoCaptionSlide } from './PhotoCaptionSlide';
import { PptxImageSlide } from './PptxImageSlide';
import { PollSlide } from './PollSlide';
import { SlideTemplate } from '@/lib/types';

export const RENDERERS: Record<SlideTemplate, React.ComponentType<any>> = {
  sectionTransition: SectionTransitionSlide,
  exercise1: Exercise1Slide,
  photoCaption: PhotoCaptionSlide,
  pptxImage: PptxImageSlide,
  poll: PollSlide,
};
