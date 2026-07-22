'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, Transition, Variants } from 'motion/react';
import { Icon } from '@/components/ui/Icon';

export type AnimationOption = {
  id: string;
  label: string;
  description: string;
  variants: Variants;
  transition: Transition;
};

type Props = {
  title: string;
  options: AnimationOption[];
  currentId: string;
  /** Variant names to animate between for the live preview — e.g. ['enter', 'center'] or ['hidden', 'show']. */
  previewVariants: [string, string];
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** Generic full-screen modal for picking an animation from a catalog, with a looping live preview per option. */
export function AnimationPickerMenu({ title, options, currentId, previewVariants, onSelect, onClose }: Props) {
  const [loopKey, setLoopKey] = useState(0);
  const [from, to] = previewVariants;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const interval = setInterval(() => setLoopKey((k) => k + 1), 1800);
    return () => clearInterval(interval);
  }, []);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animation-picker" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="animation-grid">
            {options.map((anim) => {
              const isActive = currentId === anim.id;
              return (
                <button
                  key={anim.id}
                  type="button"
                  className={`animation-option ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelect(anim.id);
                    onClose();
                  }}
                >
                  <div className="animation-preview">
                    <motion.div
                      key={`${anim.id}-${loopKey}`}
                      className="animation-preview-card"
                      variants={anim.variants}
                      custom={1}
                      initial={from}
                      animate={to}
                      transition={anim.transition}
                    />
                  </div>
                  <div className="animation-option-text">
                    <span className="animation-option-label">
                      {anim.label}
                      {isActive && (
                        <span className="animation-option-check">
                          <Icon name="check" size={12} />
                          Em uso
                        </span>
                      )}
                    </span>
                    <span className="animation-option-desc">{anim.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
