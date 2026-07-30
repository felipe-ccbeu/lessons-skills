import { EventEmitter } from 'events';
import { SlideAnimationId } from '@/lib/slideAnimations';
import { SlideTemplate } from '@/lib/types';
import { SlideDragState } from '@/lib/dragEvents';
import { SlideMatchState } from '@/lib/matchEvents';

// Same in-process fan-out pattern as pollEvents.ts — see that file's comment
// for the multi-instance caveat, which applies identically here.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export type ClassSessionPollState = {
  pollCode: string;
  pollOpen: boolean;
  question: string;
  options: { id: string; label: string }[];
  tallies: Record<string, number>;
  total: number;
};

export type ClassSessionState = {
  slideIndex: number;
  totalSlides: number;
  slideId: string;
  template: SlideTemplate;
  // Mirrors the slide's own entrance/exit animation choice, so the student's
  // phone transitions the same way the teacher's projected slide does.
  animation?: SlideAnimationId;
  data: unknown; // the slide's full `data` — small JSON, simplest to forward as-is
  // Whether the teacher has revealed this slide's answers. Mirrors the
  // presentation overlay's local `revealed`, so a phone hides answers until
  // the teacher advances/reveals — exactly like the projected slide.
  revealed: boolean;
  poll?: ClassSessionPollState;
  // `practiceQaBadges` runs one live Yes/No round per question row instead of
  // a single slide-wide round — keyed by rowIndex, only rows the teacher has
  // actually opened a round for appear here (see startQaVoting in
  // PresentationOverlay.tsx and getOpenPollSessionsByRow in polls.ts).
  qaPolls?: Record<number, ClassSessionPollState>;
  // `matchVocabImage`'s live drag-and-drop guesses, one entry per student
  // (voterKey) who has placed at least one keyword — see dragEvents.ts. Purely
  // in-memory scratch state, not persisted like poll votes.
  dragPositions?: SlideDragState;
  // `matchingWithChart`'s live term-matching guesses, one entry per student
  // (voterKey) who has placed at least one term — see matchEvents.ts. Purely
  // in-memory scratch state, not persisted like poll votes.
  matchChoices?: SlideMatchState;
};

export function emitClassSessionUpdate(code: string, data: ClassSessionState) {
  emitter.emit(code, data);
}

export function subscribeToClassSession(code: string, listener: (data: ClassSessionState) => void) {
  emitter.on(code, listener);
  return () => emitter.off(code, listener);
}
