'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AiSlideAction, LayoutOffset, PastedBlock, Slide, SlideTemplate, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';
import { SlideBlockClipboardProvider, useSlideBlockClipboard } from '@/components/ui/SlideBlockClipboard';
import { GroupSelectionHandle } from '@/components/ui/SlideStagger';
import { PastedBlocksLayer } from '@/components/ui/PastedBlocksLayer';
import { StageOverlayProvider } from '@/components/ui/StageOverlay';
import { ChatSidebar } from '@/components/ui/ChatSidebar';
import { useContextActionMenu } from '@/components/ui/useContextActionMenu';
import { Icon } from '@/components/ui/Icon';
import { AnimationPickerMenu } from '@/components/ui/AnimationPickerMenu';
import { SLIDE_ANIMATIONS, DEFAULT_SLIDE_ANIMATION, SlideAnimationId } from '@/lib/slideAnimations';
import { DRAG_KEYS_BY_TEMPLATE } from '@/lib/dragKeys';
import { getAtPath, pushAtPath, removeAtPath, setAtPath } from '@/lib/dataPath';
import { resolveRemovableRow } from '@/lib/removableLists';
import { sampleSlides } from '@/lib/sample-slides';
import { createSlide } from '@/lib/slide-templates';
import { RENDERERS } from '@/components/slides';
import { PresentationOverlay } from '@/components/PresentationOverlay';
import { AddSlideMenu } from '@/components/ui/AddSlideMenu';
import { TopbarMenu } from '@/components/ui/TopbarMenu';
import { exportSlidesToPptx } from '@/lib/deckExport';
import { importHtmlFile, importZipFile, importPptxFile } from '@/lib/deckImport';

type Props = {
  /** When provided, the app loads/saves this part's slides via the API instead of the in-memory sample deck. */
  partApiUrl?: string;
  /** DB id of this Part — required to start a live poll session from the presentation overlay. */
  partId?: string;
  initialSlides?: Slide[];
  partTitle?: string;
  breadcrumbHref?: { label: string; href: string }[];
};

const MAX_HISTORY = 20;

export function PresenterApp(props: Props) {
  return (
    <SlideBlockClipboardProvider>
      <PresenterAppInner {...props} />
    </SlideBlockClipboardProvider>
  );
}

function PresenterAppInner({ partApiUrl, partId, initialSlides, partTitle, breadcrumbHref }: Props) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides ?? sampleSlides);
  const [activeId, setActiveId] = useState((initialSlides ?? sampleSlides)[0].id);

  // Undo history: a stack of past (slides, activeId) snapshots, capped at MAX_HISTORY.
  // `pushHistory` must be called with the state *before* a mutation, right before applying it.
  const historyRef = useRef<{ slides: Slide[]; activeId: string }[]>([]);
  const slidesRef = useRef(slides);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    slidesRef.current = slides;
    activeIdRef.current = activeId;
  }, [slides, activeId]);

  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current, { slides: slidesRef.current, activeId: activeIdRef.current }].slice(
      -MAX_HISTORY
    );
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setSlides(prev.slides);
    setActiveId(prev.activeId);
  }, []);

  useEffect(() => {
    function onUndoKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onUndoKey);
    return () => window.removeEventListener('keydown', onUndoKey);
  }, [undo]);

  const addPastedBlock = useCallback(
    (block: PastedBlock) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, pastedBlocks: [...(s.pastedBlocks ?? []), block] } : s))
      );
    },
    [activeId, pushHistory]
  );

  const updatePastedBlock = useCallback(
    (id: string, patch: Partial<PastedBlock>) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          return { ...s, pastedBlocks: (s.pastedBlocks ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)) };
        })
      );
    },
    [activeId, pushHistory]
  );

  const removePastedBlock = useCallback(
    (id: string) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, pastedBlocks: (s.pastedBlocks ?? []).filter((b) => b.id !== id) } : s))
      );
    },
    [activeId, pushHistory]
  );

  const applyAiActions = useCallback(
    (actions: AiSlideAction[]) => {
      if (!actions.length) return;
      pushHistory();

      let next = [...slidesRef.current];
      let targetId = activeIdRef.current;

      function patchTarget(slideIndex: number | undefined, fn: (s: Slide) => Slide) {
        const id = slideIndex != null ? next[slideIndex]?.id : undefined;
        if (slideIndex != null && id == null) return; // stale/out-of-range index; ignore
        const applyToId = id ?? targetId;
        next = next.map((s) => (s.id === applyToId ? fn(s) : s));
      }

      for (const action of actions) {
        if (action.kind === 'addSlide') {
          const newSlide = createSlide(action.template);
          next = [...next, newSlide];
          targetId = newSlide.id;
        } else if (action.kind === 'reorderSlide') {
          const { fromIndex, toIndex } = action;
          if (fromIndex >= 0 && fromIndex < next.length && toIndex >= 0 && toIndex < next.length) {
            const reordered = [...next];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);
            next = reordered;
          }
        } else if (action.kind === 'setField') {
          patchTarget(action.slideIndex, (s) => ({ ...s, data: setAtPath(s.data as object, action.path, action.value) } as Slide));
        } else if (action.kind === 'addListItem') {
          patchTarget(action.slideIndex, (s) => ({ ...s, data: pushAtPath(s.data as object, action.listPath, action.item) } as Slide));
        } else if (action.kind === 'removeListItem') {
          patchTarget(action.slideIndex, (s) => ({ ...s, data: removeAtPath(s.data as object, action.listPath, action.index) } as Slide));
        } else if (action.kind === 'moveBlock') {
          patchTarget(action.slideIndex, (s) => {
            const current = { ...(s.layoutOverrides ?? {}) };
            const base = current[action.dragKey] ?? { dx: 0, dy: 0 };
            current[action.dragKey] = { dx: base.dx + action.dx, dy: base.dy + action.dy };
            return { ...s, layoutOverrides: current };
          });
        }
      }

      setSlides(next);
      if (targetId !== activeIdRef.current) setActiveId(targetId);
    },
    [pushHistory]
  );

  const clipboard = useSlideBlockClipboard();

  function isInsideEditableField(target: EventTarget | null) {
    return target instanceof HTMLElement && !!target.closest('[contenteditable="true"]');
  }

  /** Same as updateLayoutOffset, but applies a distinct offset to several keys at once —
   *  used by group-drag so a multi-selection moves as a rigid body in one history step. */
  const updateLayoutOffsetMany = useCallback(
    (entries: { key: string; offset: LayoutOffset }[]) => {
      if (!entries.length) return;
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const current = { ...(s.layoutOverrides ?? {}) };
          for (const { key, offset } of entries) current[key] = offset;
          return { ...s, layoutOverrides: current };
        })
      );
    },
    [activeId, pushHistory]
  );

  /** Same as updateBlockAnimation, but applies the same animation to several keys at once. */
  const updateBlockAnimationMany = useCallback(
    (keys: string[], animation: BlockAnimationId) => {
      if (!keys.length) return;
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const current = { ...(s.blockAnimations ?? {}) };
          for (const key of keys) current[key] = animation;
          return { ...s, blockAnimations: current };
        })
      );
    },
    [activeId, pushHistory]
  );

  /** Delete/Backspace (or the "Deletar" context menu action) on a multi-selection: dragKeys that
   *  resolve to a removable list row (via REMOVABLE_LISTS_BY_TEMPLATE) are removed from the
   *  slide's `data` for real; dragKeys that don't resolve (fixed blocks like "title") fall back to
   *  resetting their layout/animation/style overrides to template defaults — a dragKey doesn't
   *  map to removable content in general (it can be a whole section like "title"), so there's no
   *  safe generic way to delete those blocks' content without touching every slide template.
   *  Single pushHistory() for the whole operation, so one Ctrl+Z undoes it all at once regardless
   *  of the mix. */
  const removeSelectedListItems = useCallback(
    (keys: string[]) => {
      if (!keys.length) return;
      const activeSlide = slidesRef.current.find((s) => s.id === activeIdRef.current);
      if (!activeSlide) return;

      const byList = new Map<string, { index: number; minLength?: number }[]>();
      const fixedKeys: string[] = [];
      for (const key of keys) {
        const resolved = resolveRemovableRow(activeSlide.template, key);
        if (resolved) {
          const list = byList.get(resolved.listPath) ?? [];
          list.push({ index: resolved.index, minLength: resolved.minLength });
          byList.set(resolved.listPath, list);
        } else {
          fixedKeys.push(key);
        }
      }
      if (!byList.size && !fixedKeys.length) return;

      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeIdRef.current) return s;
          let data: object = s.data as object;

          // Remove highest-index-first per list so removing one row doesn't shift the index of
          // another row still pending removal in the same operation.
          for (const [listPath, entries] of byList) {
            const minLength = entries.find((e) => e.minLength != null)?.minLength;
            const sortedIndices = [...new Set(entries.map((e) => e.index))].sort((a, b) => b - a);
            for (const index of sortedIndices) {
              const current = getAtPath(data, listPath);
              if (!Array.isArray(current)) continue;
              if (minLength != null && current.length <= minLength) break;
              data = removeAtPath(data, listPath, index);
            }
          }

          const layoutOverrides = { ...(s.layoutOverrides ?? {}) };
          const blockAnimations = { ...(s.blockAnimations ?? {}) };
          const styleOverrides = { ...(s.styleOverrides ?? {}) };
          // Fixed (non-removable) selected blocks fall back to reset-to-default — see this
          // function's doc comment for why reset, not delete, is the safe default here.
          for (const key of fixedKeys) {
            delete layoutOverrides[key];
            delete blockAnimations[key];
            for (const path of Object.keys(styleOverrides)) {
              if (path === key || path.startsWith(`${key}.`)) delete styleOverrides[path];
            }
          }
          // Removed row dragKeys no longer refer to a valid row after removal — clear their
          // layout/animation overrides too. Note: styleOverrides/answerFields of rows AFTER the
          // removed one can end up pointing at the wrong index post-removal — this is a
          // pre-existing issue (removeRow in each template already shifts indices the same way
          // without adjusting overrides), not introduced by this function.
          for (const key of keys) {
            delete layoutOverrides[key];
            delete blockAnimations[key];
          }

          return { ...s, data: data as Slide['data'], layoutOverrides, blockAnimations, styleOverrides };
        })
      );
    },
    [pushHistory]
  );

  useEffect(() => {
    function onCopyPasteKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'c') {
        if (!clipboard.selection.length || isInsideEditableField(e.target) || !stageRef.current) return;
        e.preventDefault();
        clipboard.copySelected(stageRef.current);
      } else if (key === 'v') {
        if (!clipboard.hasClipboard || isInsideEditableField(e.target)) return;
        e.preventDefault();
        clipboard.pasteInto(addPastedBlock);
      }
    }
    window.addEventListener('keydown', onCopyPasteKey);
    return () => window.removeEventListener('keydown', onCopyPasteKey);
  }, [clipboard, addPastedBlock]);

  // Delete/Backspace on a multi-selection of blocks removes selected list rows for real and
  // resets any other selected (fixed) blocks to template defaults — guarded the same way as
  // copy/paste so it never fires while the teacher is actually editing/deleting text inside a
  // contentEditable field.
  useEffect(() => {
    function onDeleteKey(e: KeyboardEvent) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (isInsideEditableField(e.target) || clipboard.selectedKeys.size === 0) return;
      e.preventDefault();
      clipboard.removeSelection();
    }
    window.addEventListener('keydown', onDeleteKey);
    return () => window.removeEventListener('keydown', onDeleteKey);
  }, [clipboard]);

  const [scale, setScale] = useState(0.6);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [shareLinkStatus, setShareLinkStatus] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');
  const [addSlideMenu, setAddSlideMenu] = useState<{ x: number; y: number } | null>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageOverlayEl, setStageOverlayEl] = useState<HTMLDivElement | null>(null);
  const pptxInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const active = slides.find((s) => s.id === activeId)!;
  const idx = slides.findIndex((s) => s.id === activeId);

  // Feeds the Context the data/functions it needs to compute and commit a group drag or a
  // mass animation change, without the Context itself owning slide state — same "registration
  // via effect" pattern as StageOverlayProvider/useStageOverlayEl elsewhere in this file.
  useEffect(() => {
    clipboard.registerLayoutSource(active.layoutOverrides ?? {}, updateLayoutOffsetMany);
  }, [clipboard, active.layoutOverrides, updateLayoutOffsetMany]);

  useEffect(() => {
    clipboard.registerAnimationApplier(updateBlockAnimationMany);
  }, [clipboard, updateBlockAnimationMany]);

  useEffect(() => {
    clipboard.registerRemover(removeSelectedListItems);
  }, [clipboard, removeSelectedListItems]);

  useEffect(() => {
    clipboard.registerStageEl(stageRef.current);
  });

  // Selection is stored above the stage (doesn't remount on slide change), so it needs to be
  // cleared explicitly when switching slides — otherwise a block selected on the previous slide
  // would appear "selected" on the new one despite no matching dragKey being rendered there.
  useEffect(() => {
    clipboard.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const updateActiveData = useCallback(
    (patch: Record<string, unknown>) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => (s.id === activeId ? ({ ...s, data: { ...s.data, ...patch } } as Slide) : s))
      );
    },
    [activeId, pushHistory]
  );

  const toggleAnswerField = useCallback(
    (key: string) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const current = s.answerFields ?? [];
          const answerFields = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
          return { ...s, answerFields };
        })
      );
    },
    [activeId, pushHistory]
  );

  /** `patch === null` clears the override entirely, restoring the template's default styling. */
  const updateFieldStyle = useCallback(
    (key: string, patch: TextStyleOverride | null) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const current = { ...(s.styleOverrides ?? {}) };
          if (patch === null) {
            delete current[key];
          } else {
            current[key] = patch;
          }
          return { ...s, styleOverrides: current };
        })
      );
    },
    [activeId, pushHistory]
  );

  const updateLayoutOffset = useCallback(
    (key: string, offset: LayoutOffset) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const current = { ...(s.layoutOverrides ?? {}) };
          current[key] = offset;
          return { ...s, layoutOverrides: current };
        })
      );
    },
    [activeId, pushHistory]
  );

  const updateBlockAnimation = useCallback(
    (key: string, animation: BlockAnimationId) => {
      pushHistory();
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const current = { ...(s.blockAnimations ?? {}) };
          current[key] = animation;
          return { ...s, blockAnimations: current };
        })
      );
    },
    [activeId, pushHistory]
  );

  const skipDirtyRef = useRef(true);
  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    setDirty(true);
  }, [slides]);

  const savingRef = useRef(false);
  const handleSave = useCallback(async () => {
    if (!partApiUrl || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(partApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao salvar');
      setDirty(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [partApiUrl, slides]);

  useEffect(() => {
    if (!dirty || !partApiUrl) return;
    const t = setTimeout(() => handleSave(), 1500);
    return () => clearTimeout(t);
  }, [dirty, partApiUrl, handleSave]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  useEffect(() => {
    function computeScale() {
      const el = stageWrapRef.current;
      if (!el) return;
      const availW = el.clientWidth - 48;
      const availH = el.clientHeight - 48;
      setScale(Math.min(availW / 1280, availH / 720, 1));
    }
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  useEffect(() => {
    if (presenting) return;
    function onKey(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl?.isContentEditable) return;
      const i = slides.findIndex((s) => s.id === activeId);
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (i < slides.length - 1) setActiveId(slides[i + 1].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (i > 0) setActiveId(slides[i - 1].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides, activeId, presenting]);

  const runImport = useCallback(
    async (file: File, importer: (file: File) => Promise<Slide[]>, errorLabel: string) => {
      setImporting(true);
      setImportError(null);
      try {
        const newSlides = await importer(file);
        if (newSlides.length === 0) throw new Error('Nenhum slide encontrado no arquivo');
        pushHistory();
        setSlides((prev) => [...prev, ...newSlides]);
        setActiveId(newSlides[0].id);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : errorLabel);
      } finally {
        setImporting(false);
      }
    },
    [pushHistory]
  );

  const handlePptxSelected = useCallback(
    (file: File) => runImport(file, importPptxFile, 'Falha ao importar o .pptx'),
    [runImport]
  );
  const handleHtmlSelected = useCallback(
    (file: File) => runImport(file, importHtmlFile, 'Falha ao importar o .html'),
    [runImport]
  );
  const handleZipSelected = useCallback(
    (file: File) => runImport(file, importZipFile, 'Falha ao importar o .zip'),
    [runImport]
  );

  const [exportingPptx, setExportingPptx] = useState(false);
  const handleExportPptx = useCallback(async () => {
    setExportingPptx(true);
    setImportError(null);
    try {
      await exportSlidesToPptx(slides, `${(partTitle ?? 'aula').replace(/[^a-z0-9]+/gi, '-')}.pptx`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Falha ao exportar .pptx');
    } finally {
      setExportingPptx(false);
    }
  }, [slides, partTitle]);

  const handleCopyShareLink = useCallback(async () => {
    if (!partId) return;
    setShareLinkStatus('loading');
    try {
      const res = await fetch('/api/class/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId }),
      });
      if (!res.ok) throw new Error('Falha ao gerar o link');
      const session = await res.json();
      const joinUrl = `${window.location.origin}/class/${session.code}`;
      await navigator.clipboard.writeText(joinUrl);
      setShareLinkStatus('copied');
    } catch {
      setShareLinkStatus('error');
    } finally {
      setTimeout(() => setShareLinkStatus('idle'), 2500);
    }
  }, [partId]);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(slides, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lesson-slides.json';
    a.click();
  }, [slides]);

  const reorderSlide = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      pushHistory();
      setSlides((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [pushHistory]
  );

  const addSlide = useCallback(
    (template: SlideTemplate) => {
      pushHistory();
      const newSlide = createSlide(template);
      setSlides((prev) => [...prev, newSlide]);
      setActiveId(newSlide.id);
    },
    [pushHistory]
  );

  const duplicateSlideIdCounter = useRef(0);
  const duplicateSlide = useCallback(
    (id: string) => {
      const current = slidesRef.current;
      const idx = current.findIndex((s) => s.id === id);
      if (idx === -1) return;
      pushHistory();
      const source = current[idx];
      duplicateSlideIdCounter.current += 1;
      const copy: Slide = {
        ...source,
        id: `${source.template}-${Date.now()}-${duplicateSlideIdCounter.current}`,
        data: JSON.parse(JSON.stringify(source.data)),
      };
      const next = [...current];
      next.splice(idx + 1, 0, copy);
      setSlides(next);
      setActiveId(copy.id);
    },
    [pushHistory]
  );

  const removeSlide = useCallback(
    (id: string) => {
      const current = slidesRef.current;
      if (current.length <= 1) return;
      const idx = current.findIndex((s) => s.id === id);
      if (idx === -1) return;
      pushHistory();
      const next = current.filter((s) => s.id !== id);
      setSlides(next);
      if (activeIdRef.current === id) {
        const fallback = next[Math.min(idx, next.length - 1)];
        setActiveId(fallback.id);
      }
    },
    [pushHistory]
  );

  const setSlideAnimation = useCallback(
    (id: string, animation: SlideAnimationId) => {
      pushHistory();
      setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, animation } : s)));
    },
    [pushHistory]
  );

  const [animationPickerSlideId, setAnimationPickerSlideId] = useState<string | null>(null);

  const Renderer = RENDERERS[active.template];
  const { openMenu: openSlideMenu, menuElement: slideMenuElement } = useContextActionMenu();

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="dot" /> {partTitle ? partTitle : 'CCBEU Slides — protótipo'}
        </div>
        <div className="slide-counter">
          Slide {idx + 1} / {slides.length}
        </div>
        <div className="actions">
          {partApiUrl && (
            <span className="save-status">
              {saving ? (
                'Salvando…'
              ) : dirty ? (
                'Alterações não salvas'
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={14} /> Salvo
                </span>
              )}
            </span>
          )}
          <button className="btn primary" onClick={() => setPresenting(true)}>
            <Icon name="play_arrow" size={16} /> Apresentar
          </button>

          <input
            ref={pptxInputRef}
            type="file"
            accept=".pptx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePptxSelected(file);
              e.target.value = '';
            }}
          />
          <input
            ref={htmlInputRef}
            type="file"
            accept=".html,.htm"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleHtmlSelected(file);
              e.target.value = '';
            }}
          />
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleZipSelected(file);
              e.target.value = '';
            }}
          />

          <TopbarMenu
            label={importing ? 'Importando…' : '⬇ Importar'}
            disabled={importing}
            items={[
              { key: 'html', label: 'Importar HTML', onClick: () => htmlInputRef.current?.click() },
              { key: 'zip', label: 'Importar ZIP', onClick: () => zipInputRef.current?.click() },
              { key: 'pptx', label: 'Importar PPTX', onClick: () => pptxInputRef.current?.click() },
            ]}
          />

          <TopbarMenu
            label={exportingPptx ? 'Exportando…' : '⬆ Compartilhar'}
            disabled={exportingPptx}
            items={[
              {
                key: 'link',
                label:
                  shareLinkStatus === 'copied'
                    ? 'Link copiado!'
                    : shareLinkStatus === 'loading'
                      ? 'Gerando link…'
                      : shareLinkStatus === 'error'
                        ? 'Falha ao gerar link'
                        : 'Link para compartilhar a apresentação',
                onClick: handleCopyShareLink,
                disabled: !partId || shareLinkStatus === 'loading',
                title: !partId ? 'Salve a aula para gerar um link de compartilhamento' : undefined,
              },
              { key: 'json', label: 'Exportar JSON', onClick: handleExportJson },
              { key: 'pptx', label: 'Exportar PPTX', onClick: handleExportPptx, disabled: exportingPptx },
            ]}
          />
        </div>
      </div>

      {breadcrumbHref && (
        <div style={{ background: 'var(--chrome-bg-subtle)', borderBottom: '1px solid var(--chrome-border)', padding: '8px 18px', fontSize: 12.5 }}>
          {breadcrumbHref.map((item, i) => (
            <span key={i}>
              <a href={item.href} style={{ color: 'var(--chrome-text-muted)' }}>
                {item.label}
              </a>
              {i < breadcrumbHref.length - 1 && <span style={{ color: 'var(--chrome-text-faint)', margin: '0 6px' }}>/</span>}
            </span>
          ))}
        </div>
      )}

      {saveError && (
        <div style={{ background: '#fdecec', color: '#b3261e', padding: '8px 18px', fontSize: 12.5 }}>
          Erro ao salvar: {saveError}
        </div>
      )}

      {importError && (
        <div style={{ background: '#fdecec', color: '#b3261e', padding: '8px 18px', fontSize: 12.5 }}>
          Erro ao importar: {importError}
        </div>
      )}

      <div className="body-row edit-mode">
        <div className="rail">
          {slides.map((s, i) => {
            const R = RENDERERS[s.template];
            return (
              <div
                key={s.id}
                className={`thumb ${s.id === activeId ? 'active' : ''} ${dragIndex === i ? 'dragging' : ''} ${dragOverIndex === i && dragIndex !== null && dragIndex !== i ? 'drag-over' : ''}`}
                onClick={() => setActiveId(s.id)}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverIndex(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) reorderSlide(dragIndex, i);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onContextMenu={(e) =>
                  openSlideMenu(e, [
                    { label: 'Duplicar slide', icon: 'content_copy', onSelect: () => duplicateSlide(s.id) },
                    { label: 'Mudar animação', icon: 'auto_awesome', onSelect: () => setAnimationPickerSlideId(s.id) },
                    {
                      label: 'Apagar slide',
                      icon: 'delete',
                      destructive: true,
                      onSelect: () => removeSlide(s.id),
                    },
                  ])
                }
              >
                <div className="thumb-inner">
                  <R data={s.data} editMode={false} onEdit={() => {}} />
                </div>
                <div className="thumb-label">{i + 1}</div>
              </div>
            );
          })}
          {slideMenuElement}
          {animationPickerSlideId && (
            <AnimationPickerMenu
              title="Animação do slide"
              options={SLIDE_ANIMATIONS}
              currentId={slides.find((s) => s.id === animationPickerSlideId)?.animation ?? DEFAULT_SLIDE_ANIMATION}
              previewVariants={['enter', 'center']}
              onSelect={(id) => setSlideAnimation(animationPickerSlideId, id as SlideAnimationId)}
              onClose={() => setAnimationPickerSlideId(null)}
            />
          )}
          <button
            className="thumb thumb-add"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAddSlideMenu({ x: rect.right + 8, y: rect.top });
            }}
            aria-label="Adicionar slide"
          >
            +
          </button>
          {addSlideMenu && (
            <AddSlideMenu
              x={addSlideMenu.x}
              y={addSlideMenu.y}
              onSelect={addSlide}
              onClose={() => setAddSlideMenu(null)}
            />
          )}
        </div>

        <div className="stage-wrap" ref={stageWrapRef}>
          <div className="stage-scaler" style={{ transform: `scale(${scale})` }}>
            <StageOverlayProvider value={stageOverlayEl}>
              <div className="stage" ref={stageRef} style={{ position: 'relative' }}>
                <Renderer
                  data={active.data}
                  editMode
                  onEdit={updateActiveData}
                  answerFields={active.answerFields ?? []}
                  onToggleAnswerField={toggleAnswerField}
                  styleOverrides={active.styleOverrides ?? {}}
                  onStyleFieldChange={updateFieldStyle}
                  layoutOverrides={active.layoutOverrides ?? {}}
                  onLayoutOffsetChange={updateLayoutOffset}
                  blockAnimations={active.blockAnimations ?? {}}
                  onBlockAnimationChange={updateBlockAnimation}
                  stageScale={scale}
                  revealAnswers
                />
              </div>
              <GroupSelectionHandle stageScale={scale} />
            </StageOverlayProvider>
            <div className="stage-overlay" ref={setStageOverlayEl}>
              <PastedBlocksLayer
                blocks={active.pastedBlocks ?? []}
                editMode
                stageScale={scale}
                onUpdate={updatePastedBlock}
                onRemove={removePastedBlock}
              />
            </div>
          </div>
        </div>

        <ChatSidebar
          slideData={active.data}
          template={active.template}
          dragKeys={DRAG_KEYS_BY_TEMPLATE[active.template] ?? []}
          deckOverview={slides.map((s) => ({ template: s.template, data: s.data }))}
          activeIndex={idx}
          onApplyActions={applyAiActions}
        />
      </div>

      <button
        type="button"
        className="help-fab help-fab-floating"
        onClick={() => setShowHelp(true)}
        aria-label="Como testar"
        title="Como testar"
      >
        ?
      </button>

      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Como testar</h3>
              <button className="modal-close" onClick={() => setShowHelp(false)} aria-label="Fechar">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="hint">
                <b>Edição</b>: clique em qualquer texto azul-realçado para editar. Passe o mouse numa linha da lista
                para ver o botão de remover; use &quot;+ Adicionar frase&quot; para incluir uma nova. Passe o mouse
                numa área de foto para colar uma imagem (<span className="kbd">Ctrl+V</span>) ou colar um link.
                <span className="kbd">Ctrl+Z</span> desfaz as últimas alterações.
              </div>
              <div className="hint">
                <b>Marcar resposta</b>: passe o mouse em qualquer texto editável e clique no ícone{' '}
                <Icon name="visibility" size={13} style={{ verticalAlign: 'middle' }} /> ao lado para
                marcar (ou desmarcar) aquele campo como resposta. Na apresentação, respostas marcadas ficam
                escondidas até o professor avançar.
              </div>
              <div className="hint">
                <b>Modo apresentação</b>: nada é editável, usa <span className="kbd">←</span>/
                <span className="kbd">→</span> para navegar entre slides — é o que o professor veria em sala. Se o
                slide tiver uma resposta marcada, o primeiro <span className="kbd">→</span> revela a resposta; o
                próximo avança pro slide seguinte.
              </div>
              <div className="hint">
                &quot;Exportar JSON&quot; baixa o estado atual dos 3 slides — esse é o formato que, no sistema real,
                ficaria salvo no banco por aula (mesma estrutura que os <code>*.render.js</code> do pipeline já
                usam para <code>rows</code>/tokens).
              </div>
            </div>
          </div>
        </div>
      )}

      {presenting && (
        <PresentationOverlay slides={slides} startIndex={idx} onExit={() => setPresenting(false)} partId={partId} />
      )}
    </div>
  );
}
