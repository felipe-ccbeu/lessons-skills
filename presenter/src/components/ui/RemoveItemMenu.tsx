'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const MENU_WIDTH = 180;
const MENU_HEIGHT = 60;

type Props = {
  x: number;
  y: number;
  label: string;
  onRemove: () => void;
  onClose: () => void;
};

export function RemoveItemMenu({ x, y, label, onRemove, onClose }: Props) {
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
      <button
        type="button"
        className="remove-item-menu-btn"
        onClick={() => {
          onRemove();
          onClose();
        }}
      >
        ✕ {label}
      </button>
    </div>,
    document.body
  );
}
