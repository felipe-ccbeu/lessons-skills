// Which list rows each template lets you remove by selection, and how to resolve
// a selected row's dragKey back to the (listPath, index) that removeAtPath needs.
// The per-template config is derived from TEMPLATE_META (slideMeta.ts) — the
// single source of truth; only the resolution logic lives here.
import { SlideTemplate } from './types';
import { TEMPLATE_META, type RemovableList } from './slideMeta';

export type { RemovableList };

export const REMOVABLE_LISTS_BY_TEMPLATE: Partial<Record<SlideTemplate, RemovableList[]>> = Object.fromEntries(
  (Object.keys(TEMPLATE_META) as SlideTemplate[])
    .map((t) => [t, TEMPLATE_META[t].removableLists] as const)
    .filter((entry): entry is readonly [SlideTemplate, RemovableList[]] => entry[1] != null)
);

/** Resolves a selected row dragKey (e.g. "matchColumn.prompts.3") to its list + index, picking
 *  the longest matching prefix so a more specific entry (e.g. "matchColumn.prompts") isn't
 *  shadowed by a shorter one that happens to also be a valid prefix. */
export function resolveRemovableRow(
  template: SlideTemplate,
  dragKey: string
): { listPath: string; index: number; minLength?: number } | null {
  const lists = REMOVABLE_LISTS_BY_TEMPLATE[template];
  if (!lists) return null;
  let best: RemovableList | null = null;
  let bestIndex = -1;
  for (const l of lists) {
    // Most templates key each row as `${prefix}.${i}`, but ChangePlacesSlide's rows predate this
    // config and already persist dragKeys as `row${i}` (no separator) in saved decks — matching
    // both shapes here avoids a data migration to rename dragKeys already saved by teachers.
    const dotMatch = dragKey.startsWith(`${l.rowDragKeyPrefix}.`) ? dragKey.slice(l.rowDragKeyPrefix.length + 1) : null;
    const bareMatch = dragKey.startsWith(l.rowDragKeyPrefix) && !dotMatch ? dragKey.slice(l.rowDragKeyPrefix.length) : null;
    const idxStr = dotMatch ?? bareMatch;
    if (idxStr == null) continue;
    const index = Number(idxStr);
    if (!Number.isInteger(index) || index < 0) continue;
    if (!best || l.rowDragKeyPrefix.length > best.rowDragKeyPrefix.length) {
      best = l;
      bestIndex = index;
    }
  }
  if (!best) return null;
  return { listPath: best.listPath, index: bestIndex, minLength: best.minLength };
}
