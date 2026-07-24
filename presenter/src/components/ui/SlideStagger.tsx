'use client';

import { createContext, CSSProperties, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, Variants } from 'motion/react';
import { LayoutOffset, SlideTemplate } from '@/lib/types';
import { useSlideBlockClipboard } from '@/components/ui/SlideBlockClipboard';
import { useStageOverlayEl } from '@/components/ui/StageOverlay';
import { Icon } from '@/components/ui/Icon';
import { AnimationPickerMenu } from '@/components/ui/AnimationPickerMenu';
import { SlideBlockContextMenu } from '@/components/ui/SlideBlockContextMenu';
import { resolveRemovableRow } from '@/lib/removableLists';
import { BLOCK_ANIMATIONS, DEFAULT_BLOCK_ANIMATION, BlockAnimationId, getBlockAnimation } from '@/lib/blockEntranceAnimations';

export type BlockAnimationMenuCtx = {
  blockAnimation?: BlockAnimationId;
  onOpenAnimationPicker: () => void;
};

const BlockAnimationMenuContext = createContext<BlockAnimationMenuCtx | null>(null);

/** Lets a text field's own context menu (`TextContextMenu`) offer "change entrance animation"
 *  for the `SlideStaggerItem` it's nested in, instead of the two context menus fighting over
 *  the same right-click. Returns null outside a movable `SlideStaggerItem` (e.g. view mode). */
export function useBlockAnimationMenu() {
  return useContext(BlockAnimationMenuContext);
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

type ContainerProps = {
  children: ReactNode;
  /** Skip staggering entirely (e.g. in edit mode, where content should just appear). */
  disabled?: boolean;
};

/** Wraps a slide's content; drives a staggered reveal of its `SlideStaggerItem` children on mount. */
export function SlideStagger({ children, disabled = false }: ContainerProps) {
  if (disabled) return <>{children}</>;
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

type ItemProps = {
  children: ReactNode;
  style?: CSSProperties;
  disabled?: boolean;
  /** Stable id for this block within the template — enables click-to-select + drag-handle repositioning when set together with `editMode`. */
  dragKey?: string;
  /** Whether the deck is in edit mode (selection/drag handle only renders when true and `dragKey` is set). */
  editMode?: boolean;
  /** Persisted pixel offset for this block, keyed by `dragKey`. */
  layoutOffset?: LayoutOffset;
  /** Called with the new offset once a drag gesture ends. */
  onLayoutOffsetChange?: (key: string, offset: LayoutOffset) => void;
  /** Scale factor of the stage the block is rendered inside (e.g. 0.6) — converts pointer deltas to stage-space pixels. */
  stageScale?: number;
  /** Persisted entrance animation for this block, keyed by `dragKey` — defaults to fade+up when unset. */
  blockAnimation?: BlockAnimationId;
  /** Called with the new animation id once the teacher picks one from this block's context menu. */
  onBlockAnimationChange?: (key: string, animation: BlockAnimationId) => void;
  /** Active slide's template — lets the right-click menu decide whether `dragKey` resolves to a
   *  removable list row (via REMOVABLE_LISTS_BY_TEMPLATE) and should offer "Deletar". */
  template?: SlideTemplate;
};

/** One staggered element within a `SlideStagger` — pass the same absolute-position `style` you'd put on the plain wrapper. */
export function SlideStaggerItem({
  children,
  style,
  disabled = false,
  dragKey,
  editMode = false,
  layoutOffset,
  onLayoutOffsetChange,
  stageScale = 1,
  blockAnimation,
  onBlockAnimationChange,
  template,
}: ItemProps) {
  const movable = editMode && !!dragKey && !!onLayoutOffsetChange;
  const base = layoutOffset ?? { dx: 0, dy: 0 };

  const clipboard = useSlideBlockClipboard();
  const selected = movable && !!dragKey && clipboard.selectedKeys.has(dragKey);
  const groupDrag = selected && clipboard.selectedKeys.size > 1;
  const selectionHasRemovable =
    !!template && clipboard.selection.some((s) => resolveRemovableRow(template, s.dragKey) != null);

  const [dragOffset, setDragOffset] = useState<LayoutOffset | null>(null);
  const [showAnimationPicker, setShowAnimationPicker] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState<{ x: number; y: number } | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageOverlayEl = useStageOverlayEl();

  // The drag-handle portal needs the block's real (content-driven) height to anchor
  // "bottom: -Npx" correctly — `style` only carries left/top/width, not height.
  useEffect(() => {
    if (!movable || !selected || !wrapperRef.current) return;
    const el = wrapperRef.current;
    setMeasuredHeight(el.offsetHeight);
    const observer = new ResizeObserver(() => setMeasuredHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [movable, selected]);

  // Keep the Context's tracked DOM element for this block fresh (e.g. after re-renders that
  // replace the wrapper's content) — needed for click-outside detection and copy.
  useEffect(() => {
    if (!movable || !dragKey || !selected || !wrapperRef.current) return;
    clipboard.updateSelectedEl(dragKey, wrapperRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movable, dragKey, selected]);

  // While a group drag is in progress (driven by the single GroupSelectionHandle, not this item),
  // every selected block tracks the shared delta on top of its OWN base offset — preserves
  // relative distances between blocks as the group moves together.
  const liveGroupDelta = groupDrag ? clipboard.groupDragDelta : null;
  const offset = dragOffset ?? (liveGroupDelta ? { dx: base.dx + liveGroupDelta.dx, dy: base.dy + liveGroupDelta.dy } : base);
  const offsetStyle: CSSProperties = { transform: `translate(${offset.dx}px, ${offset.dy}px)` };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = { startX: e.clientX, startY: e.clientY };
    const onMove = (ev: PointerEvent) => {
      if (!dragStateRef.current) return;
      const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
      const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
      setDragOffset({ dx: base.dx + dx, dy: base.dy + dy });
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dragStateRef.current) {
        const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
        const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
        dragStateRef.current = null;
        onLayoutOffsetChange!(dragKey!, { dx: base.dx + dx, dy: base.dy + dy });
      }
      setDragOffset(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  if (movable) {
    const canPickAnimation = !!dragKey && !!onBlockAnimationChange;
    return (
      <div
        ref={wrapperRef}
        style={{
          ...style,
          ...offsetStyle,
          outline: selected ? '2px solid var(--ccbeu-blue)' : '2px solid transparent',
          outlineOffset: 4,
          borderRadius: 4,
          zIndex: selected ? 999 : style?.zIndex,
        }}
        className="draggable-block"
        onPointerDownCapture={(e) => {
          if (!dragKey) return;
          if (e.shiftKey) {
            // Shift+pointerdown is also the browser's native "extend text selection" gesture —
            // without preventDefault, shift-clicking a block selects surrounding page text instead
            // of (or in addition to) toggling it into the multi-selection.
            e.preventDefault();
            clipboard.toggleSelection(dragKey, wrapperRef.current);
          } else if (!(clipboard.selectedKeys.size === 1 && clipboard.selectedKeys.has(dragKey))) {
            clipboard.selectOnly(dragKey, wrapperRef.current);
          }
        }}
        onContextMenu={
          canPickAnimation
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!selected) clipboard.selectOnly(dragKey!, wrapperRef.current);
                setShowBlockMenu({ x: e.clientX, y: e.clientY });
              }
            : undefined
        }
      >
        {canPickAnimation ? (
          <BlockAnimationMenuContext.Provider
            value={{ blockAnimation, onOpenAnimationPicker: () => setShowAnimationPicker(true) }}
          >
            {children}
          </BlockAnimationMenuContext.Provider>
        ) : (
          children
        )}
        {selected &&
          !groupDrag &&
          (stageOverlayEl && measuredHeight != null ? (
            createPortal(
              <div
                className="selection-portal-anchor"
                style={{ ...style, ...offsetStyle, position: 'absolute', height: measuredHeight }}
              >
                <div className="drag-handle" title="Arraste para reposicionar" onPointerDown={handlePointerDown}>
                  <Icon name="open_with" size={15} />
                </div>
              </div>,
              stageOverlayEl
            )
          ) : (
            <div className="drag-handle" title="Arraste para reposicionar" onPointerDown={handlePointerDown}>
              <Icon name="open_with" size={15} />
            </div>
          ))}
        {showBlockMenu && (
          <SlideBlockContextMenu
            x={showBlockMenu.x}
            y={showBlockMenu.y}
            deleteLabel={groupDrag ? `Deletar (${clipboard.selectedKeys.size})` : 'Deletar'}
            onDelete={selectionHasRemovable ? () => clipboard.removeSelection() : undefined}
            onChangeAnimation={() => setShowAnimationPicker(true)}
            onClose={() => setShowBlockMenu(null)}
          />
        )}
        {showAnimationPicker && canPickAnimation && (
          <AnimationPickerMenu
            title={groupDrag ? `Animação de entrada (${clipboard.selectedKeys.size} blocos)` : 'Animação de entrada do bloco'}
            options={BLOCK_ANIMATIONS}
            currentId={blockAnimation ?? DEFAULT_BLOCK_ANIMATION}
            previewVariants={['hidden', 'show']}
            onSelect={(id) => {
              if (groupDrag) {
                clipboard.applyAnimationToSelection(id as BlockAnimationId);
              } else {
                onBlockAnimationChange!(dragKey!, id as BlockAnimationId);
              }
            }}
            onClose={() => setShowAnimationPicker(false)}
          />
        )}
      </div>
    );
  }

  if (disabled) return <div style={style}>{children}</div>;

  const { variants, transition } = getBlockAnimation(blockAnimation);
  return (
    <motion.div variants={variants} transition={transition} style={style}>
      {children}
    </motion.div>
  );
}

type Rect = { left: number; top: number; width: number; height: number };

/** Renders a single drag handle over the bounding box of every currently-selected block, instead
 *  of each `SlideStaggerItem` drawing its own — otherwise a multi-selection shows one gizmo per
 *  block, which is confusing and makes it unclear which one to grab. Mount once, inside the same
 *  `.stage-overlay` portal target `SlideStaggerItem` uses for its own (single-selection) handle. */
export function GroupSelectionHandle({ stageScale = 1 }: { stageScale?: number }) {
  const clipboard = useSlideBlockClipboard();
  const stageOverlayEl = useStageOverlayEl();
  const [rect, setRect] = useState<Rect | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number } | null>(null);

  const active = clipboard.selectedKeys.size > 1;
  const els = useMemo(() => clipboard.selection.map((s) => s.el), [clipboard.selection]);

  useEffect(() => {
    // When inactive, deliberately leave `rect` as-is rather than resetting it here — the render
    // below already ignores `rect` whenever `!active`, and resetting state synchronously inside
    // an effect body is an anti-pattern (triggers an extra render for no visible difference).
    if (!active || !clipboard.stageEl) return;
    const stageEl = clipboard.stageEl;

    function measure() {
      const stageRect = stageEl.getBoundingClientRect();
      const scale = stageRect.width / stageEl.offsetWidth || 1;
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        left = Math.min(left, (r.left - stageRect.left) / scale);
        top = Math.min(top, (r.top - stageRect.top) / scale);
        right = Math.max(right, (r.right - stageRect.left) / scale);
        bottom = Math.max(bottom, (r.bottom - stageRect.top) / scale);
      }
      if (left === Infinity) {
        setRect(null);
        return;
      }
      setRect({ left, top, width: right - left, height: bottom - top });
    }

    measure();
    const observer = new ResizeObserver(measure);
    for (const el of els) observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [active, els, clipboard.stageEl]);

  if (!active || !rect || !stageOverlayEl) return null;

  const delta = clipboard.groupDragDelta ?? { dx: 0, dy: 0 };
  const box: CSSProperties = {
    position: 'absolute',
    left: rect.left + delta.dx,
    top: rect.top + delta.dy,
    width: rect.width,
    height: rect.height,
    pointerEvents: 'none',
    outline: '2px dashed var(--ccbeu-blue)',
    outlineOffset: 4,
    borderRadius: 4,
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = { startX: e.clientX, startY: e.clientY };
    const onMove = (ev: PointerEvent) => {
      if (!dragStateRef.current) return;
      const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
      const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
      clipboard.setGroupDragDelta({ dx, dy });
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dragStateRef.current) {
        const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
        const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
        dragStateRef.current = null;
        clipboard.commitGroupDrag({ dx, dy });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return createPortal(
    <div style={box} className="selection-portal-anchor">
      <div className="drag-handle" title="Arraste para mover o grupo" style={{ pointerEvents: 'auto' }} onPointerDown={handlePointerDown}>
        <Icon name="open_with" size={15} />
      </div>
    </div>,
    stageOverlayEl
  );
}
