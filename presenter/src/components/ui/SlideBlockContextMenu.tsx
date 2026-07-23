'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/Icon';

const MENU_WIDTH = 200;
const MENU_HEIGHT = 100;

type Props = {
  x: number;
  y: number;
  /** Omitted when nothing in the current selection resolves to a removable list row. */
  deleteLabel?: string;
  onDelete?: () => void;
  onChangeAnimation: () => void;
  onClose: () => void;
};

/** Right-click menu for a selected block (or multi-selection): offers "Deletar" (only when the
 *  selection includes at least one removable list row) and "Mudar animação" (always, opens
 *  AnimationPickerMenu — kept as a separate full-screen modal rather than folded in here, since
 *  it's a gallery of previews, not a quick action). Same shell/behavior as RemoveItemMenu. */
export function SlideBlockContextMenu({ x, y, deleteLabel, onDelete, onChangeAnimation, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const effectiveHeight = Math.min(MENU_HEIGHT, window.innerHeight - 16);
  const pos = {
    left: Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8)),
    top: Math.max(8, Math.min(y, window.innerHeight - effectiveHeight - 8)),
  };

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div ref={ref} className="text-ctx-menu" style={{ ...pos, width: MENU_WIDTH, gap: 0, padding: 6 }} onContextMenu={(e) => e.preventDefault()}>
      {onDelete && (
        <button
          type="button"
          className="remove-item-menu-btn destructive"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="close" size={14} /> {deleteLabel ?? 'Deletar'}
          </span>
        </button>
      )}
      <button
        type="button"
        className="remove-item-menu-btn"
        onClick={() => {
          onChangeAnimation();
          onClose();
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="auto_awesome" size={14} /> Mudar animação
        </span>
      </button>
    </div>,
    document.body
  );
}
