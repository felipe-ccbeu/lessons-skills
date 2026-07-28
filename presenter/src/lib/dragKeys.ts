// Every dragProps(...) key each slide template exposes, so chat AI + PresenterApp
// can reference drag targets without opening each component file. Derived from
// TEMPLATE_META (slideMeta.ts) — the single source of truth — rather than
// hand-maintained here.
import { SlideTemplate } from './types';
import { TEMPLATE_META } from './slideMeta';

export const DRAG_KEYS_BY_TEMPLATE: Partial<Record<SlideTemplate, string[]>> = Object.fromEntries(
  (Object.keys(TEMPLATE_META) as SlideTemplate[])
    .map((t) => [t, TEMPLATE_META[t].dragKeys] as const)
    .filter((entry): entry is readonly [SlideTemplate, string[]] => entry[1] != null)
);
