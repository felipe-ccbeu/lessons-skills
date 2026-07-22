'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { PastedBlock } from '@/lib/types';

type SelectedBlock = { dragKey: string; el: HTMLElement };

type ClipboardEntry = { html: string; width: number; x: number; y: number; pasteCount: number };

type Ctx = {
  selected: SelectedBlock | null;
  select: (dragKey: string, el: HTMLElement | null) => void;
  deselect: (dragKey: string) => void;
  /** `stageEl` is the unscaled 1280x720 slide surface — used to convert the selected block's
   *  screen position into stage-space coordinates so the pasted copy lands in the same spot. */
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
  const [selected, setSelected] = useState<SelectedBlock | null>(null);
  const clipboardRef = useRef<ClipboardEntry | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);

  const select = useCallback((dragKey: string, el: HTMLElement | null) => {
    if (!el) return;
    setSelected({ dragKey, el });
  }, []);

  const deselect = useCallback((dragKey: string) => {
    setSelected((cur) => (cur && cur.dragKey === dragKey ? null : cur));
  }, []);

  const copySelected = useCallback(
    (stageEl: HTMLElement) => {
      if (!selected) return;
      const blockRect = selected.el.getBoundingClientRect();
      const stageRect = stageEl.getBoundingClientRect();
      const scale = stageRect.width / stageEl.offsetWidth || 1;
      const x = (blockRect.left - stageRect.left) / scale;
      const y = (blockRect.top - stageRect.top) / scale;
      clipboardRef.current = { html: selected.el.innerHTML, width: blockRect.width / scale, x, y, pasteCount: 0 };
      setHasClipboard(true);
    },
    [selected]
  );

  const pasteInto = useCallback((addPastedBlock: (block: PastedBlock) => void) => {
    const entry = clipboardRef.current;
    if (!entry) return;
    entry.pasteCount += 1;
    const cascade = entry.pasteCount * CASCADE_STEP;
    addPastedBlock({ id: nextId(), html: entry.html, x: entry.x + cascade, y: entry.y + cascade, width: entry.width });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ selected, select, deselect, copySelected, pasteInto, hasClipboard }),
    [selected, select, deselect, copySelected, pasteInto, hasClipboard]
  );

  return <SlideBlockClipboardContext.Provider value={value}>{children}</SlideBlockClipboardContext.Provider>;
}

export function useSlideBlockClipboard() {
  const ctx = useContext(SlideBlockClipboardContext);
  if (!ctx) throw new Error('useSlideBlockClipboard must be used within SlideBlockClipboardProvider');
  return ctx;
}
