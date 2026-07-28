'use client';

import { useRef, useState } from 'react';
import { PastedBlock } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';
import { useSlideBlockClipboard } from '@/components/ui/SlideBlockClipboard';
import { computeAlignmentGuides, measureOtherBlockRects } from '@/lib/alignmentGuides';

type Props = {
  blocks: PastedBlock[];
  editMode: boolean;
  stageScale: number;
  onUpdate?: (id: string, patch: Partial<PastedBlock>) => void;
  onRemove?: (id: string) => void;
};

/** Renders free-floating blocks pasted from another (possibly different) template's component — see `PastedBlock`. */
export function PastedBlocksLayer({ blocks, editMode, stageScale, onUpdate, onRemove }: Props) {
  if (!blocks.length) return null;
  return (
    <>
      {blocks.map((block) => (
        <PastedBlockItem
          key={block.id}
          block={block}
          editMode={editMode}
          stageScale={stageScale}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
    </>
  );
}

function PastedBlockItem({
  block,
  editMode,
  stageScale,
  onUpdate,
  onRemove,
}: {
  block: PastedBlock;
  editMode: boolean;
  stageScale: number;
  onUpdate?: (id: string, patch: Partial<PastedBlock>) => void;
  onRemove?: (id: string) => void;
}) {
  const [selected, setSelected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ startX: number; startY: number } | null>(null);
  const clipboard = useSlideBlockClipboard();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onUpdate) return;
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = { startX: e.clientX, startY: e.clientY };

    // The pasted-blocks layer (`.stage-overlay`) is itself one of the two measurement roots, so
    // pass it alongside `.stage` to catch both template blocks and other pasted blocks as targets.
    const stageEl = clipboard.stageEl;
    const overlayEl = wrapperRef.current?.parentElement ?? null;
    const roots = [stageEl, overlayEl].filter((el): el is HTMLElement => !!el);
    const height = wrapperRef.current?.offsetHeight ?? 0;
    const others = stageEl ? measureOtherBlockRects(stageEl, [], roots, [block.id]) : [];

    const onMove = (ev: PointerEvent) => {
      if (!dragStateRef.current) return;
      const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
      const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
      const draggedRect = { left: block.x + dx, top: block.y + dy, width: block.width ?? 0, height };
      const { lines, snapDx, snapDy } = computeAlignmentGuides(draggedRect, others, { width: 1280, height: 720 });
      clipboard.setActiveGuides(lines);
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate(${dx + snapDx}px, ${dy + snapDy}px)`;
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      clipboard.setActiveGuides([]);
      if (dragStateRef.current) {
        const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
        const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
        dragStateRef.current = null;
        if (wrapperRef.current) wrapperRef.current.style.transform = '';
        const draggedRect = { left: block.x + dx, top: block.y + dy, width: block.width ?? 0, height };
        const { snapDx, snapDy } = computeAlignmentGuides(draggedRect, others, { width: 1280, height: 720 });
        onUpdate(block.id, { x: block.x + dx + snapDx, y: block.y + dy + snapDy });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={wrapperRef}
      data-pasted-block={block.id}
      className="draggable-block pasted-block"
      style={{
        position: 'absolute',
        left: block.x,
        top: block.y,
        width: block.width,
        outline: selected ? '2px solid var(--ccbeu-blue)' : '2px solid transparent',
        outlineOffset: 4,
        borderRadius: 4,
        zIndex: selected ? 999 : undefined,
      }}
      onPointerDownCapture={() => editMode && setSelected(true)}
      onBlurCapture={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) setSelected(false);
      }}
    >
      <div
        contentEditable={editMode}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: block.html }}
        onBlur={(e) => onUpdate?.(block.id, { html: e.currentTarget.innerHTML })}
      />
      {editMode && selected && onUpdate && onRemove && (
        <>
          <div className="drag-handle" title="Arraste para reposicionar" onPointerDown={handlePointerDown}>
            <Icon name="open_with" size={15} />
          </div>
          <button
            type="button"
            className="pasted-block-remove"
            title="Remover"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onRemove(block.id)}
          >
            <Icon name="close" size={13} />
          </button>
        </>
      )}
    </div>
  );
}
