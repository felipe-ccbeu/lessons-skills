'use client';

import { useState, MouseEvent } from 'react';
import { ContextActionMenu, ContextMenuAction } from './ContextActionMenu';

type MenuState = { x: number; y: number; actions: ContextMenuAction[] };

/** Right-click handler + rendered menu for a list of actions on some item (e.g. a slide thumbnail). */
export function useContextActionMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);

  function openMenu(e: MouseEvent, actions: ContextMenuAction[]) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, actions });
  }

  const menuElement = menu ? (
    <ContextActionMenu x={menu.x} y={menu.y} actions={menu.actions} onClose={() => setMenu(null)} />
  ) : null;

  return { openMenu, menuElement };
}
