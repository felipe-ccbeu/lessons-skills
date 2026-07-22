'use client';

import { useRef, useState } from 'react';
import { PastedBlock } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';

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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onUpdate) return;
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = { startX: e.clientX, startY: e.clientY };
    const onMove = (ev: PointerEvent) => {
      if (!dragStateRef.current) return;
      const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
      const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dragStateRef.current) {
        const dx = (ev.clientX - dragStateRef.current.startX) / stageScale;
        const dy = (ev.clientY - dragStateRef.current.startY) / stageScale;
        dragStateRef.current = null;
        if (wrapperRef.current) wrapperRef.current.style.transform = '';
        onUpdate(block.id, { x: block.x + dx, y: block.y + dy });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={wrapperRef}
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
