'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TextStyleOverride } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';

const MENU_WIDTH = 220;
const MENU_MAX_HEIGHT = 420;

type Props = {
  x: number;
  y: number;
  value: TextStyleOverride;
  onChange: (patch: TextStyleOverride) => void;
  onReset: () => void;
  onClose: () => void;
  /** When provided, shows a "mark as answer" toggle at the top of the menu. */
  answer?: boolean;
  onToggleAnswer?: () => void;
  /** When provided, shows a "change entrance animation" item that opens the block's AnimationPickerMenu. */
  onOpenAnimationPicker?: () => void;
};

const COLORS = [
  { label: 'Padrão', value: undefined },
  { label: 'Azul', value: 'var(--ccbeu-blue)' },
  { label: 'Rosa', value: 'var(--ccbeu-pink)' },
  { label: 'Preto', value: '#1c2027' },
  { label: 'Cinza', value: '#6b7280' },
  { label: 'Vermelho', value: '#c0392b' },
  { label: 'Verde', value: '#1e8449' },
];

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 40, 54, 72];

const ALIGNS: { label: string; value: NonNullable<TextStyleOverride['align']>; icon: string }[] = [
  { label: 'Esquerda', value: 'left', icon: 'format_align_left' },
  { label: 'Centro', value: 'center', icon: 'format_align_center' },
  { label: 'Direita', value: 'right', icon: 'format_align_right' },
];

export function TextContextMenu({ x, y, value, onChange, onReset, onClose, answer, onToggleAnswer, onOpenAnimationPicker }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = {
    left: Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8)),
    top: Math.max(8, Math.min(y, window.innerHeight - MENU_MAX_HEIGHT - 8)),
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
    <div
      ref={ref}
      className="text-ctx-menu"
      style={pos}
      onContextMenu={(e) => e.preventDefault()}
    >
      {onToggleAnswer && (
        <div className="text-ctx-section">
          <button
            type="button"
            className={`text-ctx-answer ${answer ? 'active' : ''}`}
            onClick={onToggleAnswer}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="visibility" size={16} /> Marcar como resposta
            </span>
            <span className={`text-ctx-check ${answer ? 'on' : ''}`} />
          </button>
        </div>
      )}

      <div className="text-ctx-section">
        <div className="text-ctx-label">Cor</div>
        <div className="text-ctx-swatches">
          {COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              title={c.label}
              className={`text-ctx-swatch ${value.color === c.value ? 'active' : ''}`}
              style={{ background: c.value ?? 'linear-gradient(135deg, #fff 45%, #ccc 55%)' }}
              onClick={() => onChange({ color: c.value })}
            />
          ))}
        </div>
      </div>

      <div className="text-ctx-section">
        <div className="text-ctx-label">Tamanho da fonte</div>
        <select
          className="text-ctx-select"
          value={value.fontSize ?? ''}
          onChange={(e) => onChange({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">Padrão</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
      </div>

      <div className="text-ctx-section">
        <div className="text-ctx-label">Estilo</div>
        <div className="text-ctx-row">
          <button
            type="button"
            className={`text-ctx-btn ${value.bold ? 'active' : ''}`}
            title="Negrito"
            onClick={() => onChange({ bold: !value.bold })}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            className={`text-ctx-btn ${value.italic ? 'active' : ''}`}
            title="Itálico"
            onClick={() => onChange({ italic: !value.italic })}
          >
            <i>I</i>
          </button>
        </div>
      </div>

      <div className="text-ctx-section">
        <div className="text-ctx-label">Alinhamento</div>
        <div className="text-ctx-row">
          {ALIGNS.map((a) => (
            <button
              key={a.value}
              type="button"
              className={`text-ctx-btn ${value.align === a.value ? 'active' : ''}`}
              title={a.label}
              onClick={() => onChange({ align: value.align === a.value ? undefined : a.value })}
            >
              <Icon name={a.icon} size={16} />
            </button>
          ))}
        </div>
      </div>

      {onOpenAnimationPicker && (
        <div className="text-ctx-section">
          <button type="button" className="text-ctx-answer" onClick={onOpenAnimationPicker}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="auto_awesome" size={16} /> Mudar animação de entrada
            </span>
          </button>
        </div>
      )}

      <button type="button" className="text-ctx-reset" onClick={onReset}>
        Restaurar padrão
      </button>
    </div>,
    document.body
  );
}
