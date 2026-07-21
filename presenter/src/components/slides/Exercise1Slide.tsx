import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { Exercise1Data, ExerciseRow, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: Exercise1Data;
  onEdit: (patch: Partial<Exercise1Data>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

const BASE_ROWS = 5;
const BASE_ROW_H = 68;
const BASE_FONT = 14;
const MIN_FONT = 10;
const MIN_ROW_H = 36;
const BAND_H = 620 - 258;

export function Exercise1Slide({
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
    n <= BASE_ROWS
      ? BASE_FONT
      : Math.max(MIN_FONT, Math.min(BASE_FONT, Math.round(BASE_FONT * (rowH / BASE_ROW_H))));

  const updateRow = (i: number, patch: Partial<ExerciseRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onEdit({ rows: next });
  };
  const addRow = () => onEdit({ rows: [...rows, { orig: 'New sentence.', hl: 'New', post: 'form.' }] });
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
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124, width: 1120 }}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '24pt',
              color: 'var(--ccbeu-blue)',
            }}
          />
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 207, width: 1120 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '12pt',
              color: 'var(--ink)',
              display: 'flex',
              gap: 4,
            }}
          >
            <Editable value={data.instructionPre} onChange={(v) => onEdit({ instructionPre: v })} editMode={editMode} tag="span" {...answerProps('instructionPre')} />
            <Editable
              value={data.instructionHl}
              onChange={(v) => onEdit({ instructionHl: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('instructionHl')}
              style={{ fontWeight: 700, color: 'var(--ccbeu-pink)' }}
            />
            <Editable value={data.instructionPost} onChange={(v) => onEdit({ instructionPost: v })} editMode={editMode} tag="span" {...answerProps('instructionPost')} />
          </p>
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 80, top: 258, width: 1120 }}>
          {rows.map((row, i) => (
            <SlideStaggerItem key={i} disabled={editMode}>
              <div
                className="ex-row"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  height: rowH,
                  borderBottom: '1px solid var(--border-hair)',
                }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(i)) : undefined}
              >
                <div
                  style={{
                    flex: '0 0 34px',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: '10pt',
                    color: 'var(--ccbeu-blue)',
                  }}
                >
                  {i + 1}
                </div>
                <Editable
                  value={row.orig}
                  onChange={(v) => updateRow(i, { orig: v })}
                  editMode={editMode}
                  {...answerProps(`rows.${i}.orig`)}
                  style={{ flex: '0 0 545px', fontFamily: 'var(--font-body)', fontSize: `${fontPt}pt`, color: 'var(--ink)' }}
                />
                <div style={{ flex: '0 0 48px', textAlign: 'center', fontSize: '11pt', color: 'var(--ink)' }}>→</div>
                <div
                  style={{
                    flex: '1 1 auto',
                    display: 'flex',
                    gap: 4,
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: `${fontPt}pt`,
                    color: 'var(--ink)',
                  }}
                >
                  <Editable
                    value={row.hl}
                    onChange={(v) => updateRow(i, { hl: v })}
                    editMode={editMode}
                    tag="span"
                    {...answerProps(`rows.${i}.hl`)}
                    style={{ color: 'var(--ccbeu-pink)' }}
                  />
                  <Editable value={row.post} onChange={(v) => updateRow(i, { post: v })} editMode={editMode} tag="span" {...answerProps(`rows.${i}.post`)} />
                </div>
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
        <button
          type="button"
          className="add-row-btn"
          style={{ position: 'absolute', left: 80, top: 258 + n * rowH + 14 }}
          onClick={addRow}
        >
          + Adicionar frase
        </button>
      )}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 636,
          fontFamily: 'var(--font-body)',
          fontSize: '9pt',
          color: 'var(--ink-footer)',
        }}
      >
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
