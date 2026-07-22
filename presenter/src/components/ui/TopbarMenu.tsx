'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

type MenuItem = {
  key: string;
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
};

const MENU_WIDTH = 260;

export function TopbarMenu({
  label,
  items,
  disabled,
}: {
  label: ReactNode;
  items: MenuItem[];
  disabled?: boolean;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setPos(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPos(null);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="btn"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setPos(null);
            return;
          }
          const rect = buttonRef.current!.getBoundingClientRect();
          setPos({
            x: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
            y: rect.bottom + 6,
          });
        }}
      >
        {label}
      </button>
      {pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="topbar-menu-dropdown"
            style={{ position: 'fixed', left: pos.x, top: pos.y, width: MENU_WIDTH }}
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className="topbar-menu-item"
                disabled={item.disabled}
                title={item.title}
                onClick={() => {
                  item.onClick();
                  setPos(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
