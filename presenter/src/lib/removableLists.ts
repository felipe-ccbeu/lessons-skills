// Maps a selected row's own dragKey (e.g. "matchColumn.prompts.3") to the (listPath, index) that
// removeAtPath/getAtPath (dataPath.ts) need to remove it for real from `data` — used by
// PresenterApp's removeSelectedListItems. Only templates with removable list rows are listed
// here; a template/dragKey combo with no match falls back to reset-to-default behavior.
import { SlideTemplate } from './types';

type RemovableList = {
  /** Prefix used by each row's own dragKey (row i => `${rowDragKeyPrefix}.${i}`). */
  rowDragKeyPrefix: string;
  /** Dot-path into `data` that getAtPath/removeAtPath operate on. */
  listPath: string;
  /** Mirrors a MIN_* constant already local to the template component (e.g. MIN_OPTIONS in
   *  PollSlide.tsx) — duplicated here deliberately so removal-by-selection respects the same
   *  floor the template's own UI already enforces. Keep in sync manually if that constant changes. */
  minLength?: number;
};

export const REMOVABLE_LISTS_BY_TEMPLATE: Partial<Record<SlideTemplate, RemovableList[]>> = {
  exercise1: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
  practiceQaBadges: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
  matchLetters: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
  warmupOralTransform: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
  photoGridBlank: [{ rowDragKeyPrefix: 'items', listPath: 'items' }],
  grammarBoxLook: [
    { rowDragKeyPrefix: 'rows', listPath: 'rows' },
    { rowDragKeyPrefix: 'tips', listPath: 'tips' },
  ],
  changePlaces: [{ rowDragKeyPrefix: 'row', listPath: 'rows' }],
  modelExampleList: [{ rowDragKeyPrefix: 'list', listPath: 'items' }],
  matchVocabImage: [
    { rowDragKeyPrefix: 'keywords', listPath: 'keywords' },
    { rowDragKeyPrefix: 'answers', listPath: 'answers' },
  ],
  completeTheChart: [
    { rowDragKeyPrefix: 'group1.rows', listPath: 'group1.rows' },
    { rowDragKeyPrefix: 'group2.rows', listPath: 'group2.rows' },
  ],
  grammarBox2YesNo: [{ rowDragKeyPrefix: 'grammarBox.rows', listPath: 'rows' }],
  matchingWithChart: [
    { rowDragKeyPrefix: 'matchColumn.prompts', listPath: 'matchPrompts' },
    { rowDragKeyPrefix: 'matchColumn.options', listPath: 'matchOptions' },
    { rowDragKeyPrefix: 'chartColumn.rows', listPath: 'chartRows' },
  ],
  // LessonCompleteSlide's column count is data-driven (`data.columns`), not fixed — this static
  // list covers up to 4 columns, more than the template's layout math realistically fits. A 5th
  // column would silently fall back to "not removable" (reset-only) rather than crash.
  lessonComplete: [0, 1, 2, 3].map((ci) => ({
    rowDragKeyPrefix: `column${ci}.terms`,
    listPath: `columns.${ci}.terms`,
  })),
  fluency1: [{ rowDragKeyPrefix: 'questions', listPath: 'questions' }],
  poll: [{ rowDragKeyPrefix: 'options', listPath: 'options', minLength: 2 /* mirrors MIN_OPTIONS in PollSlide.tsx */ }],
  multipleChoice: [
    { rowDragKeyPrefix: 'options', listPath: 'options', minLength: 2 /* mirrors MIN_OPTIONS in MultipleChoiceSlide.tsx */ },
  ],
};

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
