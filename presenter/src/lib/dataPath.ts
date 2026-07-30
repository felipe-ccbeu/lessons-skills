/**
 * Dot-path helpers for reading/writing into a slide's `data` object using the same path format
 * already used by `answerFields` / `styleOverrides` (e.g. `"rows.0.subject"`).
 */

function parsePath(path: string): (string | number)[] {
  return path.split('.').map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

export function getAtPath(obj: unknown, path: string): unknown {
  const segs = parsePath(path);
  let cur: unknown = obj;
  for (const seg of segs) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return cur;
}

/** Returns a new top-level object with the value at `path` replaced — does not mutate `obj`. */
export function setAtPath<T extends object>(obj: T, path: string, value: unknown): T {
  const segs = parsePath(path);
  if (segs.length === 0) return obj;

  function recur(cur: unknown, segs: (string | number)[]): unknown {
    const [seg, ...rest] = segs;
    if (Array.isArray(cur)) {
      const next = [...cur];
      next[seg as number] = rest.length ? recur(next[seg as number], rest) : value;
      return next;
    }
    const curObj = (cur && typeof cur === 'object' ? cur : {}) as Record<string | number, unknown>;
    return { ...curObj, [seg]: rest.length ? recur(curObj[seg], rest) : value };
  }

  return recur(obj, segs) as T;
}

/** Pushes `item` onto the array found at `listPath`. Returns a new top-level object. */
export function pushAtPath<T extends object>(obj: T, listPath: string, item: unknown): T {
  const list = getAtPath(obj, listPath);
  const nextList = Array.isArray(list) ? [...list, item] : [item];
  return setAtPath(obj, listPath, nextList);
}

/** Removes the item at `index` from the array found at `listPath`. Returns a new top-level object. */
export function removeAtPath<T extends object>(obj: T, listPath: string, index: number): T {
  const list = getAtPath(obj, listPath);
  if (!Array.isArray(list)) return obj;
  const nextList = list.filter((_, i) => i !== index);
  return setAtPath(obj, listPath, nextList);
}

/**
 * Checks whether `path` is navigable against `shape` — a template's default `data` (from
 * `TEMPLATE_META[template].createData()`), used as a stand-in for its schema since there's no
 * runtime type info otherwise. Object keys must exist in the shape; array indices are accepted
 * as long as the shape has a non-empty array at that position (arrays are variable-length, so
 * the index itself isn't checked) — this is what lets set_field/add_list_item/etc. target a
 * field that doesn't exist yet be rejected, instead of silently created as an orphan key that no
 * renderer reads (the bug this guards against: the AI reports success but nothing appears).
 */
export function pathExistsInShape(shape: unknown, path: string): boolean {
  const segs = parsePath(path);
  let cur = shape;
  for (const seg of segs) {
    if (cur == null || typeof cur !== 'object') return false;
    if (typeof seg === 'number') {
      if (!Array.isArray(cur) || cur.length === 0) return false;
      cur = cur[0];
      continue;
    }
    if (Array.isArray(cur) || !(seg in cur)) return false;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return true;
}
