import { MouseEvent } from 'react';
import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { MultipleChoiceData, MultipleChoiceOptionDraft, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: MultipleChoiceData;
  onEdit: (patch: Partial<MultipleChoiceData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function MultipleChoiceSlide({
  data,
  onEdit,
  editMode,
  answerFields = [],
  onToggleAnswerField,
  revealAnswers = true,
  styleOverrides = {},
  onStyleFieldChange,
}: Props) {
  const options = data.options;
  const answerProps = (key: string) => ({
    answer: answerFields.includes(key),
    revealed: revealAnswers,
    onToggleAnswer: onToggleAnswerField ? () => onToggleAnswerField(key) : undefined,
    styleOverride: styleOverrides[key],
    onStyleChange: onStyleFieldChange ? (patch: TextStyleOverride | null) => onStyleFieldChange(key, patch) : undefined,
  });

  const updateOption = (i: number, text: string) => {
    const next = options.map((o, idx) => (idx === i ? { ...o, text } : o));
    onEdit({ options: next });
  };
  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    onEdit({ options: [...options, { id: `opt-${Date.now()}`, text: 'Nova alternativa' }] });
  };
  const removeOption = (i: number) => {
    if (options.length <= MIN_OPTIONS) return;
    onEdit({ options: options.filter((_, idx) => idx !== i) });
  };
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  return (
    <div style={{ position: 'relative', width: 1280, height: 720, background: '#fff', overflow: 'hidden' }}>
      <SlideStagger disabled={editMode}>
        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 80,
            top: 62,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--font-title)',
            fontWeight: 500,
            fontSize: '9pt',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ccbeu-blue)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124 }}>
          <Editable
            value={data.tag}
            onChange={(v) => onEdit({ tag: v })}
            editMode={editMode}
            {...answerProps('tag')}
            style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: '11pt', color: 'var(--ccbeu-pink)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 160, width: 1120 }}>
          <Editable
            value={data.question}
            onChange={(v) => onEdit({ question: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('question')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '28pt', lineHeight: 1.25, color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 80, top: 290, width: 1000 }}>
          {options.map((opt, i) => (
            <SlideStaggerItem key={opt.id} disabled={editMode} style={{ marginBottom: 14 }}>
              <MultipleChoiceOption
                letter={LETTERS[i] ?? '?'}
                option={opt}
                editMode={editMode}
                onChangeText={(v) => updateOption(i, v)}
                onRemove={options.length > MIN_OPTIONS ? () => removeOption(i) : undefined}
                onContextMenu={editMode && options.length > MIN_OPTIONS ? (e) => openOnContextMenu(e, () => removeOption(i)) : undefined}
                {...answerProps(`options.${i}.text`)}
              />
            </SlideStaggerItem>
          ))}
        </div>

        {editMode && options.length < MAX_OPTIONS && (
          <button
            type="button"
            className="add-row-btn"
            style={{ position: 'absolute', left: 80, top: 290 + options.length * 58 + 8 }}
            onClick={addOption}
          >
            + Adicionar alternativa
          </button>
        )}
      </SlideStagger>

      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}

type OptionProps = {
  letter: string;
  option: MultipleChoiceOptionDraft;
  editMode: boolean;
  onChangeText: (v: string) => void;
  onRemove?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  answer?: boolean;
  revealed?: boolean;
  onToggleAnswer?: () => void;
  styleOverride?: TextStyleOverride;
  onStyleChange?: (patch: TextStyleOverride | null) => void;
};

function MultipleChoiceOption({ letter, option, editMode, onChangeText, onRemove, onContextMenu, ...editableProps }: OptionProps) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }} onContextMenu={onContextMenu}>
      <div
        style={{
          flex: '0 0 34px',
          height: 34,
          borderRadius: 8,
          border: '1px solid var(--border-hair)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-title)',
          fontWeight: 700,
          fontSize: '12pt',
          color: 'var(--ccbeu-blue)',
        }}
      >
        {letter}
      </div>
      <Editable
        value={option.text}
        onChange={onChangeText}
        editMode={editMode}
        {...editableProps}
        style={{ fontFamily: 'var(--font-body)', fontSize: '15pt', color: 'var(--ink)' }}
      />
      {editMode && onRemove && (
        <div className="row-controls" style={{ position: 'static', opacity: 1 }}>
          <button type="button" className="row-btn remove" title="Remover alternativa" onClick={onRemove}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
