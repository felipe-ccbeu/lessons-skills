import { EventEmitter } from 'events';

// In-process fan-out from vote writes to open SSE connections. Works because
// votes and streams live in the same Node process (single `next dev`/`next
// start` instance). If this ever runs across multiple instances, swap this
// for a real pub/sub backend (Postgres LISTEN/NOTIFY, Redis, etc.) behind the
// same emit/subscribe interface — nothing else in the poll code should need
// to change.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export type PollTallies = { tallies: Record<string, number>; total: number };

export function emitPollUpdate(code: string, data: PollTallies) {
  emitter.emit(code, data);
}

export function subscribeToPoll(code: string, listener: (data: PollTallies) => void) {
  emitter.on(code, listener);
  return () => emitter.off(code, listener);
}
