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
