export type GuideRect = { left: number; top: number; width: number; height: number };

export type GuideLine = {
  orientation: 'vertical' | 'horizontal';
  /** Position along the perpendicular axis, in stage-space px (x for vertical, y for horizontal). */
  at: number;
  /** Extent of the line, in stage-space px — spans from the smaller to the larger of the two matched edges. */
  from: number;
  to: number;
};

const SNAP_THRESHOLD = 6;

/** The edges/center of a rect worth aligning to, per axis. */
function xEdges(r: GuideRect) {
  return { left: r.left, center: r.left + r.width / 2, right: r.left + r.width };
}
function yEdges(r: GuideRect) {
  return { top: r.top, center: r.top + r.height / 2, bottom: r.top + r.height };
}

/**
 * Compares the dragged block's rect against every other block's rect (plus the slide's own
 * center, when `stageSize` is given), and returns both the guide lines to draw and a snap
 * correction to nudge the dragged rect into place. Mirrors Figma/PowerPoint "smart guides":
 * matches are edge-to-edge or center-to-center, never edge-to-center.
 */
export function computeAlignmentGuides(
  dragging: GuideRect,
  others: GuideRect[],
  stageSize?: { width: number; height: number }
): { lines: GuideLine[]; snapDx: number; snapDy: number } {
  const targets = stageSize
    ? [...others, { left: 0, top: 0, width: stageSize.width, height: stageSize.height }]
    : others;

  const dx = xEdges(dragging);
  const dy = yEdges(dragging);

  let bestX: { delta: number; at: number; from: number; to: number } | null = null;
  let bestY: { delta: number; at: number; from: number; to: number } | null = null;

  for (const target of targets) {
    const tx = xEdges(target);
    const ty = yEdges(target);

    for (const dEdge of [dx.left, dx.center, dx.right]) {
      for (const tEdge of [tx.left, tx.center, tx.right]) {
        const delta = tEdge - dEdge;
        if (Math.abs(delta) > SNAP_THRESHOLD) continue;
        if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) {
          bestX = {
            delta,
            at: tEdge,
            from: Math.min(dragging.top, target.top),
            to: Math.max(dragging.top + dragging.height, target.top + target.height),
          };
        }
      }
    }

    for (const dEdge of [dy.top, dy.center, dy.bottom]) {
      for (const tEdge of [ty.top, ty.center, ty.bottom]) {
        const delta = tEdge - dEdge;
        if (Math.abs(delta) > SNAP_THRESHOLD) continue;
        if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) {
          bestY = {
            delta,
            at: tEdge,
            from: Math.min(dragging.left, target.left),
            to: Math.max(dragging.left + dragging.width, target.left + target.width),
          };
        }
      }
    }
  }

  const lines: GuideLine[] = [];
  if (bestX) lines.push({ orientation: 'vertical', at: bestX.at, from: bestX.from, to: bestX.to });
  if (bestY) lines.push({ orientation: 'horizontal', at: bestY.at, from: bestY.from, to: bestY.to });

  return { lines, snapDx: bestX?.delta ?? 0, snapDy: bestY?.delta ?? 0 };
}

/**
 * Reads every other draggable block's current on-screen rect and converts it to stage-space (the
 * unscaled 1280x720 coordinate system). Mirrors the measurement approach `GroupSelectionHandle`
 * already uses for its bounding box — DOM `getBoundingClientRect()`, since block position/size
 * isn't tracked anywhere in state (templates hard-code `left/top` in JSX; only the drag *offset*
 * is stored). `roots` covers both `.stage` (template blocks, `[data-drag-key]`) and the sibling
 * `.stage-overlay` (pasted blocks, `[data-pasted-block]`) — pass whichever are available.
 */
export function measureOtherBlockRects(
  stageEl: HTMLElement,
  excludeDragKeys: string[],
  roots: HTMLElement[] = [stageEl],
  excludePastedIds: string[] = []
): GuideRect[] {
  const stageRect = stageEl.getBoundingClientRect();
  const scale = stageRect.width / stageEl.offsetWidth || 1;
  const rects: GuideRect[] = [];

  const toStageRect = (r: DOMRect): GuideRect => ({
    left: (r.left - stageRect.left) / scale,
    top: (r.top - stageRect.top) / scale,
    width: r.width / scale,
    height: r.height / scale,
  });

  for (const root of roots) {
    for (const el of root.querySelectorAll<HTMLElement>('[data-drag-key]')) {
      const key = el.dataset.dragKey;
      if (!key || excludeDragKeys.includes(key)) continue;
      rects.push(toStageRect(el.getBoundingClientRect()));
    }
    for (const el of root.querySelectorAll<HTMLElement>('[data-pasted-block]')) {
      const id = el.dataset.pastedBlock;
      if (!id || excludePastedIds.includes(id)) continue;
      rects.push(toStageRect(el.getBoundingClientRect()));
    }
  }

  return rects;
}
