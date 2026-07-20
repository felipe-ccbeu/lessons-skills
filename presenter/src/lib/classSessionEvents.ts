import { EventEmitter } from 'events';
import { SlideTemplate } from '@/lib/types';

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
  data: unknown; // the slide's full `data` — small JSON, simplest to forward as-is
  poll?: ClassSessionPollState;
};

export function emitClassSessionUpdate(code: string, data: ClassSessionState) {
  emitter.emit(code, data);
}

export function subscribeToClassSession(code: string, listener: (data: ClassSessionState) => void) {
  emitter.on(code, listener);
  return () => emitter.off(code, listener);
}
