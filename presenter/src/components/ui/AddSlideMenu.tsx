'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SlideTemplate } from '@/lib/types';
import { ADDABLE_TEMPLATES, createSlideData } from '@/lib/slide-templates';
import { RENDERERS } from '@/components/slides';

const MENU_WIDTH = 340;
const MENU_MAX_HEIGHT = 460;

type Props = {
  x: number;
  y: number;
  onSelect: (template: SlideTemplate) => void;
  onClose: () => void;
};

export function AddSlideMenu({ x, y, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const effectiveHeight = Math.min(MENU_MAX_HEIGHT, window.innerHeight - 16);
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
    <div ref={ref} className="add-slide-menu" style={pos}>
      <div className="text-ctx-label" style={{ padding: '0 4px' }}>
        Escolha um modelo
      </div>
      <div className="add-slide-grid">
        {ADDABLE_TEMPLATES.map((t) => {
          const R = RENDERERS[t.template];
          return (
            <button
              key={t.template}
              type="button"
              className="add-slide-option"
              onClick={() => {
                onSelect(t.template);
                onClose();
              }}
            >
              <div className="add-slide-preview">
                <div className="add-slide-preview-inner">
                  <R data={createSlideData(t.template)} editMode={false} onEdit={() => {}} />
                </div>
              </div>
              <span className="add-slide-option-label">{t.label}</span>
              <span className="add-slide-option-desc">{t.description}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
