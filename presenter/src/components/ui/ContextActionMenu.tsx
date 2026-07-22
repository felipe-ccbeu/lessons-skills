'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/Icon';

const MENU_WIDTH = 200;

export type ContextMenuAction = {
  label: string;
  /** Material Symbols glyph name (e.g. "content_copy"), not an emoji. */
  icon?: string;
  onSelect: () => void;
  /** Styles the action as destructive (red text/icon). */
  destructive?: boolean;
};

type Props = {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
};

/** Generic right-click-style action menu — same visual shell as `.text-ctx-menu`, reusable anywhere a small "pick one action" popover is needed. */
export function ContextActionMenu({ x, y, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const estimatedHeight = actions.length * 36 + 12;
  const pos = {
    left: Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8)),
    top: Math.max(8, Math.min(y, window.innerHeight - estimatedHeight - 8)),
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
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className={`remove-item-menu-btn ${a.destructive ? 'destructive' : ''}`}
          onClick={() => {
            a.onSelect();
            onClose();
          }}
        >
          {a.icon && <Icon name={a.icon} size={16} />}
          {a.label}
        </button>
      ))}
    </div>,
    document.body
  );
}
