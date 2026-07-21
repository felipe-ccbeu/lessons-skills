import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { ChangePlacesData, ChangePlacesRow, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: ChangePlacesData;
  onEdit: (patch: Partial<ChangePlacesData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

const CARD_H = 88;
const CARD_GAP = 54;
const FIRST_TOP = 239;

export function ChangePlacesSlide({
  data,
  onEdit,
  editMode,
  answerFields = [],
  onToggleAnswerField,
  revealAnswers = true,
  styleOverrides = {},
  onStyleFieldChange,
}: Props) {
  const answerProps = (key: string) => ({
    answer: answerFields.includes(key),
    revealed: revealAnswers,
    onToggleAnswer: onToggleAnswerField ? () => onToggleAnswerField(key) : undefined,
    styleOverride: styleOverrides[key],
    onStyleChange: onStyleFieldChange ? (patch: TextStyleOverride | null) => onStyleFieldChange(key, patch) : undefined,
  });
  const rows = data.rows;
  const n = rows.length;

  const updateRow = (i: number, patch: Partial<ChangePlacesRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onEdit({ rows: next });
  };
  const addRow = () => onEdit({ rows: [...rows, { label: 'A', sentence: 'New sentence.' }] });
  const removeRow = (i: number) => onEdit({ rows: rows.filter((_, idx) => idx !== i) });
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  return (
    <div style={{ position: 'relative', width: 1280, height: 720, background: '#fff', overflow: 'hidden' }}>
      <SlideStagger disabled={editMode}>
        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 91,
            top: 75,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--font-title)',
            fontWeight: 500,
            fontSize: '9pt',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ccbeu-blue)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 128, top: 124, width: 1120 }}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        {rows.map((row, i) => (
          <SlideStaggerItem
            key={i}
            disabled={editMode}
            style={{
              position: 'absolute',
              left: 91,
              top: FIRST_TOP + i * CARD_GAP,
              width: 1120,
              height: CARD_H,
              background: '#fef1f6',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{ position: 'relative', width: '100%', height: '100%' }}
              onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(i)) : undefined}
            >
              <div style={{ height: 4, background: 'var(--ccbeu-pink)' }} />
              <Editable
                value={row.label}
                onChange={(v) => updateRow(i, { label: v })}
                editMode={editMode}
                {...answerProps(`rows.${i}.label`)}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 17,
                  width: 211,
                  fontFamily: 'var(--font-title)',
                  fontWeight: 800,
                  fontSize: '24pt',
                  color: 'var(--ccbeu-pink)',
                }}
              />
              <Editable
                value={row.sentence}
                onChange={(v) => updateRow(i, { sentence: v })}
                editMode={editMode}
                {...answerProps(`rows.${i}.sentence`)}
                style={{
                  position: 'absolute',
                  left: 306,
                  top: 17,
                  width: 662,
                  fontFamily: 'var(--font-title)',
                  fontWeight: 500,
                  fontSize: '24pt',
                  color: 'var(--ink)',
                }}
              />
              {editMode && (
                <div className="row-controls" style={{ right: -34 }}>
                  <button type="button" className="row-btn remove" title="Remover linha" onClick={() => removeRow(i)}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          </SlideStaggerItem>
        ))}
      </SlideStagger>
      {editMode && (
        <button
          type="button"
          className="add-row-btn"
          style={{ position: 'absolute', left: 91, top: FIRST_TOP + n * CARD_GAP + 14 }}
          onClick={addRow}
        >
          + Adicionar linha
        </button>
      )}
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
