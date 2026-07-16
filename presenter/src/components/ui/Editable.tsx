'use client';

import { useEffect, useRef, CSSProperties, ElementType } from 'react';

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
};

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
}: EditableProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  const hidden = answer && !editMode && !revealed;

  const field = (
    <Tag
      ref={ref}
      className={`editable ${answer ? 'editable-answer' : ''} ${hidden ? 'answer-hidden' : ''} ${className}`}
      style={onToggleAnswer ? { ...style, position: 'static' } : style}
      contentEditable={editMode}
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerText)}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' && Tag !== 'div') e.preventDefault();
      }}
    />
  );

  if (!editMode || !onToggleAnswer) return field;

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
        title={answer ? 'Remover marcação de resposta' : 'Marcar como resposta'}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggleAnswer}
      >
        👁
      </button>
    </span>
  );
}
