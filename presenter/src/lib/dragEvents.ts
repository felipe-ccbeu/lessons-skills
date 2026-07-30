import { EventEmitter } from 'events';

// In-process fan-out for `matchVocabImage`'s live drag positions — same
// pattern as pollEvents.ts/classSessionEvents.ts (see pollEvents.ts's
// comment for the multi-instance caveat).
//
// Positions are pure ephemeral scratch state (a student's in-progress guess,
// no right/wrong answer to persist or grade), so they live in memory only,
// keyed by `${partId}:${slideId}` — never written to the DB, and naturally
// reset whenever the process restarts or the slide changes to a fresh entry.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

/** Relative position within the slide's image, 0..1 on both axes. */
export type DragPoint = { x: number; y: number };

/** keywordIndex -> position, for one student. */
export type VoterDragState = Record<number, DragPoint>;

/** voterKey -> that student's placements, for one slide entry. */
export type SlideDragState = Record<string, VoterDragState>;

const store = new Map<string, SlideDragState>();

function slideKey(partId: string, slideId: string): string {
  return `${partId}:${slideId}`;
}

export function getDragState(partId: string, slideId: string): SlideDragState {
  return store.get(slideKey(partId, slideId)) ?? {};
}

export function setDragPosition(partId: string, slideId: string, voterKey: string, keywordIndex: number, point: DragPoint): SlideDragState {
  const key = slideKey(partId, slideId);
  const slideState = { ...(store.get(key) ?? {}) };
  slideState[voterKey] = { ...(slideState[voterKey] ?? {}), [keywordIndex]: point };
  store.set(key, slideState);
  return slideState;
}

export function emitDragUpdate(code: string, data: SlideDragState) {
  emitter.emit(code, data);
}

export function subscribeToDrag(code: string, listener: (data: SlideDragState) => void) {
  emitter.on(code, listener);
  return () => emitter.off(code, listener);
}
