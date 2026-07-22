'use client';

import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { motion, Variants } from 'motion/react';
import { LayoutOffset } from '@/lib/types';
import { useSlideBlockClipboard } from '@/components/ui/SlideBlockClipboard';
import { Icon } from '@/components/ui/Icon';
import { AnimationPickerMenu } from '@/components/ui/AnimationPickerMenu';
import { BLOCK_ANIMATIONS, DEFAULT_BLOCK_ANIMATION, BlockAnimationId, getBlockAnimation } from '@/lib/blockEntranceAnimations';

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
}: ItemProps) {
  const movable = editMode && !!dragKey && !!onLayoutOffsetChange;
  const base = layoutOffset ?? { dx: 0, dy: 0 };

  const [selected, setSelected] = useState(false);
  const [dragOffset, setDragOffset] = useState<LayoutOffset | null>(null);
  const [showAnimationPicker, setShowAnimationPicker] = useState(false);
  const dragStateRef = useRef<{ startX: number; startY: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const clipboard = useSlideBlockClipboard();

  useEffect(() => {
    if (!movable || !selected) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const el = wrapperRef.current;
      if (el && !el.contains(e.target as Node)) setSelected(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [movable, selected]);

  useEffect(() => {
    if (!movable || !dragKey) return;
    if (selected) {
      clipboard.select(dragKey, wrapperRef.current);
    } else {
      clipboard.deselect(dragKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movable, dragKey, selected]);

  const offset = dragOffset ?? base;
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
        onPointerDownCapture={() => setSelected(true)}
        onContextMenu={
          canPickAnimation
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelected(true);
                setShowAnimationPicker(true);
              }
            : undefined
        }
      >
        {children}
        {selected && (
          <div className="drag-handle" title="Arraste para reposicionar" onPointerDown={handlePointerDown}>
            <Icon name="open_with" size={15} />
          </div>
        )}
        {showAnimationPicker && canPickAnimation && (
          <AnimationPickerMenu
            title="Animação de entrada do bloco"
            options={BLOCK_ANIMATIONS}
            currentId={blockAnimation ?? DEFAULT_BLOCK_ANIMATION}
            previewVariants={['hidden', 'show']}
            onSelect={(id) => onBlockAnimationChange!(dragKey!, id as BlockAnimationId)}
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
