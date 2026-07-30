// In-process fan-out for `matchingWithChart`'s live term-matching choices —
// same pattern as dragEvents.ts/classSessionEvents.ts (see pollEvents.ts's
// comment for the multi-instance caveat).
//
// Choices are pure ephemeral scratch state (a student's in-progress guess,
// no grading/history to persist), so they live in memory only, keyed by
// `${partId}:${slideId}` — never written to the DB, and naturally reset
// whenever the process restarts or the slide changes to a fresh entry.
const store = new Map<string, SlideMatchState>();

/** promptIndex -> optionIndex chosen by one student. */
export type VoterMatchState = Record<number, number>;

/** voterKey -> that student's choices, for one slide entry. */
export type SlideMatchState = Record<string, VoterMatchState>;

function slideKey(partId: string, slideId: string): string {
  return `${partId}:${slideId}`;
}

export function getMatchState(partId: string, slideId: string): SlideMatchState {
  return store.get(slideKey(partId, slideId)) ?? {};
}

export function setMatchChoice(
  partId: string,
  slideId: string,
  voterKey: string,
  promptIndex: number,
  optionIndex: number
): SlideMatchState {
  const key = slideKey(partId, slideId);
  const slideState = { ...(store.get(key) ?? {}) };
  slideState[voterKey] = { ...(slideState[voterKey] ?? {}), [promptIndex]: optionIndex };
  store.set(key, slideState);
  return slideState;
}
