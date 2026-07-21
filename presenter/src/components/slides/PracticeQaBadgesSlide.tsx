import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { PracticeQaBadgesData, PracticeQaBadgesRow, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: PracticeQaBadgesData;
  onEdit: (patch: Partial<PracticeQaBadgesData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

const BASE_ROWS = 4;
const BASE_ROW_H = 80;
const BASE_FONT = 13;
const MIN_FONT = 9;
const MIN_ROW_H = 44;
const BAND_H = 620 - 280;

export function PracticeQaBadgesSlide({
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
  const rowH = n <= BASE_ROWS ? BASE_ROW_H : Math.max(MIN_ROW_H, Math.floor(BAND_H / n));
  const fontPt =
    n <= BASE_ROWS ? BASE_FONT : Math.max(MIN_FONT, Math.min(BASE_FONT, Math.round(BASE_FONT * (rowH / BASE_ROW_H))));

  const updateRow = (i: number, patch: Partial<PracticeQaBadgesRow>) => {
    onEdit({ rows: rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  };
  const addRow = () => onEdit({ rows: [...rows, { question: 'New question?', yes: 'Yes, ...', no: 'No, ...' }] });
  const removeRow = (i: number) => onEdit({ rows: rows.filter((_, idx) => idx !== i) });
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
          <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 201, width: 1120 }}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-pink)' }}
          />
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 80, top: 280, width: 1120 }}>
          {rows.map((row, i) => (
            <SlideStaggerItem key={i} disabled={editMode}>
              <div
                className="ex-row"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  height: rowH,
                  borderBottom: '1px solid var(--border-hair)',
                }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(i)) : undefined}
              >
                <div style={{ flex: '0 0 34px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '10pt', color: 'var(--ccbeu-blue)' }}>
                  {i + 1}
                </div>
                <Editable
                  value={row.question}
                  onChange={(v) => updateRow(i, { question: v })}
                  editMode={editMode}
                  {...answerProps(`rows.${i}.question`)}
                  style={{ flex: '0 0 400px', fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: `${fontPt}pt`, color: 'var(--ink)' }}
                />
                <Editable
                  value={row.yes}
                  onChange={(v) => updateRow(i, { yes: v })}
                  editMode={editMode}
                  {...answerProps(`rows.${i}.yes`)}
                  style={{
                    flex: '0 0 300px',
                    fontFamily: 'var(--font-body)',
                    fontSize: `${fontPt}pt`,
                    color: '#2e7d32',
                    background: '#e8f5e9',
                    border: '1px solid #2e7d32',
                    borderRadius: 6,
                    padding: '6px 12px',
                  }}
                />
                <Editable
                  value={row.no}
                  onChange={(v) => updateRow(i, { no: v })}
                  editMode={editMode}
                  {...answerProps(`rows.${i}.no`)}
                  style={{
                    flex: '1 1 auto',
                    fontFamily: 'var(--font-body)',
                    fontSize: `${fontPt}pt`,
                    color: '#c62828',
                    background: '#fdecea',
                    border: '1px solid #c62828',
                    borderRadius: 6,
                    padding: '6px 12px',
                  }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover linha" onClick={() => removeRow(i)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
        </div>
      </SlideStagger>
      {editMode && (
        <button type="button" className="add-row-btn" style={{ position: 'absolute', left: 80, top: 280 + n * rowH + 14 }} onClick={addRow}>
          + Adicionar pergunta
        </button>
      )}
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
