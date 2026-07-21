'use client';

import { useState, MouseEvent } from 'react';
import { RemoveItemMenu } from './RemoveItemMenu';

type MenuState = { x: number; y: number; label: string; onRemove: () => void };

/** Right-click handler + rendered menu for "remove this item" on grid/list cells. */
export function useRemoveItemMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);

  function openOnContextMenu(e: MouseEvent, onRemove: () => void, label = 'Remover item') {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, label, onRemove });
  }

  const menuElement = menu ? (
    <RemoveItemMenu x={menu.x} y={menu.y} label={menu.label} onRemove={menu.onRemove} onClose={() => setMenu(null)} />
  ) : null;

  return { openOnContextMenu, menuElement };
}
