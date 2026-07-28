'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PastedBlock, LayoutOffset } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';
import { GuideLine } from '@/lib/alignmentGuides';

type SelectedEntry = { dragKey: string; el: HTMLElement };

type ClipboardEntry = { html: string; width: number; x: number; y: number; pasteCount: number };

type LayoutOffsetEntry = { key: string; offset: LayoutOffset };

type Ctx = {
  /** All blocks currently selected on the active slide, in the order they were added. */
  selection: SelectedEntry[];
  /** Derived Set for O(1) lookup — read on every SlideStaggerItem render. */
  selectedKeys: Set<string>;
  /** Replaces the selection with just this block (plain click). */
  selectOnly: (dragKey: string, el: HTMLElement | null) => void;
  /** Adds/removes this block from the existing selection (shift+click). */
  toggleSelection: (dragKey: string, el: HTMLElement | null) => void;
  /** Clears the whole selection (click outside, slide change). */
  clearSelection: () => void;
  /** Updates the DOM element tracked for an already-selected block, without changing what's selected. */
  updateSelectedEl: (dragKey: string, el: HTMLElement | null) => void;

  /** In-progress group-drag delta (stage px), applied on top of each selected block's own base offset. */
  groupDragDelta: LayoutOffset | null;
  setGroupDragDelta: (d: LayoutOffset | null) => void;
  /** Commits a group drag: applies `delta` on top of every selected block's current base offset, in one history step. */
  commitGroupDrag: (delta: LayoutOffset) => void;
  /** Registers the stage element (unscaled 1280x720 surface) — used by the single group-selection
   *  handle to convert selected blocks' screen rects into stage-space coordinates. */
  registerStageEl: (el: HTMLElement | null) => void;
  stageEl: HTMLElement | null;

  /** Smart-guide lines to draw over the stage right now (empty while nothing is being dragged
   *  near an alignment match) — set by whichever drag handler is currently active. */
  activeGuides: GuideLine[];
  setActiveGuides: (lines: GuideLine[]) => void;

  /** Registered by PresenterApp so the Context can compute/commit group-drag positions without owning slide state. */
  registerLayoutSource: (layoutOverrides: Record<string, LayoutOffset>, onChangeMany: (entries: LayoutOffsetEntry[]) => void) => void;
  registerAnimationApplier: (onChangeMany: (keys: string[], animation: BlockAnimationId) => void) => void;
  /** Applies `animation` to every currently-selected block at once, via the registered applier. */
  applyAnimationToSelection: (animation: BlockAnimationId) => void;
  /** Registered by PresenterApp: removes selected list-row dragKeys for real, resets fixed ones. */
  registerRemover: (onRemove: (keys: string[]) => void) => void;
  /** Removes/resets every currently-selected block at once, via the registered remover, and clears the selection. */
  removeSelection: () => void;

  /** `stageEl` is the unscaled 1280x720 slide surface — used to convert the selected block's
   *  screen position into stage-space coordinates so the pasted copy lands in the same spot.
   *  With a multi-selection, only the most recently selected block is copied (known limitation). */
  copySelected: (stageEl: HTMLElement) => void;
  /** Drops a new floating `PastedBlock` on the active slide from the clipboard, if any. */
  pasteInto: (addPastedBlock: (block: PastedBlock) => void) => void;
  hasClipboard: boolean;
};

const SlideBlockClipboardContext = createContext<Ctx | null>(null);

let idCounter = 0;
const nextId = () => `pasted-${Date.now()}-${idCounter++}`;

const CASCADE_STEP = 24;

export function SlideBlockClipboardProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<SelectedEntry[]>([]);
  const [groupDragDelta, setGroupDragDelta] = useState<LayoutOffset | null>(null);
  const clipboardRef = useRef<ClipboardEntry | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null);
  const registerStageEl = useCallback((el: HTMLElement | null) => setStageEl(el), []);
  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);
  const layoutSourceRef = useRef<{ layoutOverrides: Record<string, LayoutOffset>; onChangeMany: (entries: LayoutOffsetEntry[]) => void } | null>(null);
  const animationApplierRef = useRef<((keys: string[], animation: BlockAnimationId) => void) | null>(null);
  const removerRef = useRef<((keys: string[]) => void) | null>(null);

  const selectedKeys = useMemo(() => new Set(selection.map((s) => s.dragKey)), [selection]);

  const selectOnly = useCallback((dragKey: string, el: HTMLElement | null) => {
    if (!el) return;
    setSelection([{ dragKey, el }]);
  }, []);

  const toggleSelection = useCallback((dragKey: string, el: HTMLElement | null) => {
    if (!el) return;
    setSelection((cur) => {
      if (cur.some((s) => s.dragKey === dragKey)) return cur.filter((s) => s.dragKey !== dragKey);
      return [...cur, { dragKey, el }];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection((cur) => (cur.length ? [] : cur));
  }, []);

  const updateSelectedEl = useCallback((dragKey: string, el: HTMLElement | null) => {
    if (!el) return;
    setSelection((cur) => cur.map((s) => (s.dragKey === dragKey ? { ...s, el } : s)));
  }, []);

  // Click-outside-deselects-all: a single document-level listener (not one per item), active
  // whenever there's a selection — closes if the pointerdown target is outside every selected el.
  useEffect(() => {
    if (!selection.length) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const stillInside = selection.some((s) => s.el.contains(target));
      if (!stillInside) setSelection([]);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [selection]);

  const registerLayoutSource = useCallback(
    (layoutOverrides: Record<string, LayoutOffset>, onChangeMany: (entries: LayoutOffsetEntry[]) => void) => {
      layoutSourceRef.current = { layoutOverrides, onChangeMany };
    },
    []
  );

  const registerAnimationApplier = useCallback((onChangeMany: (keys: string[], animation: BlockAnimationId) => void) => {
    animationApplierRef.current = onChangeMany;
  }, []);

  const commitGroupDrag = useCallback(
    (delta: LayoutOffset) => {
      setGroupDragDelta(null);
      const source = layoutSourceRef.current;
      if (!source || !selection.length) return;
      const entries: LayoutOffsetEntry[] = selection.map(({ dragKey }) => {
        const base = source.layoutOverrides[dragKey] ?? { dx: 0, dy: 0 };
        return { key: dragKey, offset: { dx: base.dx + delta.dx, dy: base.dy + delta.dy } };
      });
      source.onChangeMany(entries);
    },
    [selection]
  );

  const applyAnimationToSelection = useCallback(
    (animation: BlockAnimationId) => {
      const applier = animationApplierRef.current;
      if (!applier || !selection.length) return;
      applier(selection.map((s) => s.dragKey), animation);
    },
    [selection]
  );

  const registerRemover = useCallback((onRemove: (keys: string[]) => void) => {
    removerRef.current = onRemove;
  }, []);

  const removeSelection = useCallback(() => {
    const remover = removerRef.current;
    if (!remover || !selection.length) return;
    remover(selection.map((s) => s.dragKey));
    setSelection([]);
  }, [selection]);

  const copySelected = useCallback(
    (stageEl: HTMLElement) => {
      // Multi-selection: only the most recently selected block is copied. Extending copy/paste to
      // multiple blocks at once is out of scope for now — see plan notes on multi-select.
      const last = selection[selection.length - 1];
      if (!last) return;
      const blockRect = last.el.getBoundingClientRect();
      const stageRect = stageEl.getBoundingClientRect();
      const scale = stageRect.width / stageEl.offsetWidth || 1;
      const x = (blockRect.left - stageRect.left) / scale;
      const y = (blockRect.top - stageRect.top) / scale;
      clipboardRef.current = { html: last.el.innerHTML, width: blockRect.width / scale, x, y, pasteCount: 0 };
      setHasClipboard(true);
    },
    [selection]
  );

  const pasteInto = useCallback((addPastedBlock: (block: PastedBlock) => void) => {
    const entry = clipboardRef.current;
    if (!entry) return;
    entry.pasteCount += 1;
    const cascade = entry.pasteCount * CASCADE_STEP;
    addPastedBlock({ id: nextId(), html: entry.html, x: entry.x + cascade, y: entry.y + cascade, width: entry.width });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      selection,
      selectedKeys,
      selectOnly,
      toggleSelection,
      clearSelection,
      updateSelectedEl,
      groupDragDelta,
      setGroupDragDelta,
      commitGroupDrag,
      registerStageEl,
      stageEl,
      activeGuides,
      setActiveGuides,
      registerLayoutSource,
      registerAnimationApplier,
      applyAnimationToSelection,
      registerRemover,
      removeSelection,
      copySelected,
      pasteInto,
      hasClipboard,
    }),
    [
      selection,
      selectedKeys,
      selectOnly,
      toggleSelection,
      clearSelection,
      updateSelectedEl,
      groupDragDelta,
      commitGroupDrag,
      registerStageEl,
      stageEl,
      activeGuides,
      registerLayoutSource,
      registerAnimationApplier,
      applyAnimationToSelection,
      registerRemover,
      removeSelection,
      copySelected,
      pasteInto,
      hasClipboard,
    ]
  );

  return <SlideBlockClipboardContext.Provider value={value}>{children}</SlideBlockClipboardContext.Provider>;
}

export function useSlideBlockClipboard() {
  const ctx = useContext(SlideBlockClipboardContext);
  if (!ctx) throw new Error('useSlideBlockClipboard must be used within SlideBlockClipboardProvider');
  return ctx;
}