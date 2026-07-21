'use client';

import { useEffect, useRef, useState, CSSProperties, ElementType } from 'react';
import { TextStyleOverride } from '@/lib/types';
import { TextContextMenu } from '@/components/ui/TextContextMenu';

type EditableProps = {
  value: string;
  onChange: (value: string) => void;
  style?: CSSProperties;
  className?: string;
  tag?: ElementType;
  editMode: boolean;
  /** Marks this field as an answer: hidden until `revealed` is true (ignored in edit mode). */
  answer?: boolean;
  /** Whether tagged answers should currently be shown. Only relevant when `answer` is set. */
  revealed?: boolean;
  /** When provided (in edit mode), shows a hover button letting the teacher tag/untag this field as an answer. */
  onToggleAnswer?: () => void;
  /** Persisted style override for this field (color/size/weight/align), applied on top of `style`. */
  styleOverride?: TextStyleOverride;
  /** When provided (in edit mode), right-clicking this field opens a style menu. */
  onStyleChange?: (patch: TextStyleOverride | null) => void;
};

function applyOverride(style: CSSProperties | undefined, o: TextStyleOverride | undefined): CSSProperties | undefined {
  if (!o) return style;
  return {
    ...style,
    ...(o.color !== undefined ? { color: o.color } : {}),
    ...(o.fontSize !== undefined ? { fontSize: `${o.fontSize}px` } : {}),
    ...(o.bold !== undefined ? { fontWeight: o.bold ? 700 : style?.fontWeight } : {}),
    ...(o.italic ? { fontStyle: 'italic' } : {}),
    ...(o.align !== undefined ? { textAlign: o.align } : {}),
  };
}

export function Editable({
  value,
  onChange,
  style,
  className = '',
  tag: Tag = 'div',
  editMode,
  answer = false,
  revealed = true,
  onToggleAnswer,
  styleOverride,
  onStyleChange,
}: EditableProps) {
  const ref = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  const hidden = answer && !editMode && !revealed;
  const resolvedStyle = applyOverride(style, styleOverride);

  const field = (
    <Tag
      ref={ref}
      className={`editable ${answer ? 'editable-answer' : ''} ${hidden ? 'answer-hidden' : ''} ${className}`}
      style={onToggleAnswer ? { ...resolvedStyle, position: 'static' } : resolvedStyle}
      contentEditable={editMode}
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerText)}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' && Tag !== 'div') e.preventDefault();
      }}
      onContextMenu={
        editMode && (onStyleChange || onToggleAnswer)
          ? (e: React.MouseEvent<HTMLElement>) => {
              e.preventDefault();
              setMenu({ x: e.clientX, y: e.clientY });
            }
          : undefined
      }
    />
  );

  const contextMenu =
    menu && (onStyleChange || onToggleAnswer) ? (
      <TextContextMenu
        x={menu.x}
        y={menu.y}
        value={styleOverride ?? {}}
        onChange={(patch) => onStyleChange?.({ ...(styleOverride ?? {}), ...patch })}
        onReset={() => {
          onStyleChange?.(null);
          setMenu(null);
        }}
        onClose={() => setMenu(null)}
        answer={answer}
        onToggleAnswer={onToggleAnswer}
      />
    ) : null;

  if (!editMode || !onToggleAnswer) {
    return (
      <>
        {field}
        {contextMenu}
      </>
    );
  }

  // Wrapper takes over the field's own positioning so the toggle button can
  // sit next to it without duplicating left/top coordinates.
  const wrapperStyle: CSSProperties = {
    position: style?.position ?? 'static',
    left: style?.left,
    top: style?.top,
    right: style?.right,
    bottom: style?.bottom,
    width: style?.width,
    display: 'inline-flex',
    alignItems: 'flex-start',
    gap: 4,
  };

  return (
    <span className={`editable-wrap ${answer ? 'is-answer' : ''}`} style={wrapperStyle}>
      {field}
      <button
        type="button"
        className={`answer-toggle ${answer ? 'active' : ''}`}
        title="Opções do texto"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMenu({ x: rect.left, y: rect.bottom + 4 });
        }}
      >
        👁
      </button>
      {contextMenu}
    </span>
  );
}
