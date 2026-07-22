import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, GrammarBox2YesNoData, GrammarBox2YesNoRow, LayoutOffset, LayoutOverrides, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: GrammarBox2YesNoData;
  onEdit: (patch: Partial<GrammarBox2YesNoData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
  layoutOverrides?: LayoutOverrides;
  onLayoutOffsetChange?: (key: string, offset: LayoutOffset) => void;
  stageScale?: number;
  blockAnimations?: BlockAnimations;
  onBlockAnimationChange?: (key: string, animation: BlockAnimationId) => void;
};

const BASE_ROWS = 4;
const BASE_ROW_H = 42;
const BASE_FONT = 12;
const MIN_FONT = 9;
const MIN_ROW_H = 26;
const BAND_H = 620 - 358;

export function GrammarBox2YesNoSlide({
  data,
  onEdit,
  editMode,
  answerFields = [],
  onToggleAnswerField,
  revealAnswers = true,
  styleOverrides = {},
  onStyleFieldChange,
  layoutOverrides = {},
  onLayoutOffsetChange,
  stageScale = 1,
  blockAnimations = {},
  onBlockAnimationChange,
}: Props) {
  const dragProps = (key: string) => ({
    dragKey: key,
    editMode,
    layoutOffset: layoutOverrides[key],
    onLayoutOffsetChange,
    stageScale,
    blockAnimation: blockAnimations[key],
    onBlockAnimationChange,
  });
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
  const fontPt = n <= BASE_ROWS ? BASE_FONT : Math.max(MIN_FONT, Math.min(BASE_FONT, Math.round(BASE_FONT * (rowH / BASE_ROW_H))));

  const updateRow = (i: number, patch: Partial<GrammarBox2YesNoRow>) => {
    onEdit({ rows: rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  };
  const addRow = () =>
    onEdit({
      rows: [...rows, { subject: 'I', qHl: 'Are', qPost: 'you a student?', aPre: 'Yes, I', aYes: 'am', aMid: 'No, I', aNo: "am not" }],
    });
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 156 }} {...dragProps('title')}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '41pt', color: 'var(--ink)' }}>LOOK!</h1>
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 252, width: 64, height: 6, borderRadius: 999, background: 'var(--ccbeu-pink)' }}
        >
          {null}
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 707, top: 74, width: 240 }} {...dragProps('photo1')}>
          <ImageSlot
            url={data.imageUrl1}
            onChange={(v) => onEdit({ imageUrl1: v })}
            editMode={editMode}
            style={{ width: 240, height: 180, borderRadius: 6 }}
          />
          <figcaption style={{ marginTop: 8, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '9pt', color: 'var(--ink)' }}>
            <Editable value={data.photo1Caption} onChange={(v) => onEdit({ photo1Caption: v })} editMode={editMode} tag="span" {...answerProps('photo1Caption')} />
          </figcaption>
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 968, top: 74, width: 240 }} {...dragProps('photo2')}>
          <ImageSlot
            url={data.imageUrl2}
            onChange={(v) => onEdit({ imageUrl2: v })}
            editMode={editMode}
            style={{ width: 240, height: 180, borderRadius: 6 }}
          />
          <figcaption style={{ marginTop: 8, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '9pt', color: 'var(--ink)' }}>
            <Editable value={data.photo2Caption} onChange={(v) => onEdit({ photo2Caption: v })} editMode={editMode} tag="span" {...answerProps('photo2Caption')} />
          </figcaption>
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 80,
            top: 358,
            width: 1119,
            border: '1px solid var(--border-hair)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
          {...dragProps('grammarBox')}
        >
          <div style={{ display: 'flex', background: 'var(--ccbeu-blue)', color: '#fff' }}>
            <div style={{ flex: '0 0 15%', padding: '9px 14px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '9pt', letterSpacing: '0.06em', color: '#fff' }}>SUBJECT</div>
            <div style={{ flex: '1 1 auto', padding: '9px 14px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', letterSpacing: '0.04em', color: '#fff' }}>
              <Editable value={data.col2Header} onChange={(v) => onEdit({ col2Header: v })} editMode={editMode} tag="span" {...answerProps('col2Header')} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: '0 0 40%', padding: '9px 14px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', letterSpacing: '0.04em', color: '#fff' }}>
              <Editable value={data.col3Header} onChange={(v) => onEdit({ col3Header: v })} editMode={editMode} tag="span" {...answerProps('col3Header')} style={{ color: '#fff' }} />
            </div>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              className="ex-row"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', background: i % 2 === 0 ? '#fff' : 'var(--chrome-bg-subtle)' }}
              onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(i)) : undefined}
            >
              <Editable
                value={row.subject}
                onChange={(v) => updateRow(i, { subject: v })}
                editMode={editMode}
                {...answerProps(`rows.${i}.subject`)}
                style={{ flex: '0 0 15%', padding: '7px 14px', fontSize: `${fontPt}pt`, color: 'var(--ink)' }}
              />
              <div style={{ flex: '1 1 auto', padding: '7px 14px', display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: `${fontPt}pt`, color: 'var(--ink)' }}>
                <Editable
                  value={row.qHl}
                  onChange={(v) => updateRow(i, { qHl: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`rows.${i}.qHl`)}
                  style={{ fontWeight: 700, color: 'var(--ccbeu-pink)' }}
                />
                <Editable value={row.qPost} onChange={(v) => updateRow(i, { qPost: v })} editMode={editMode} tag="span" {...answerProps(`rows.${i}.qPost`)} />
              </div>
              <div style={{ flex: '0 0 40%', padding: '7px 14px', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'baseline', fontSize: `${fontPt}pt`, color: 'var(--ink)' }}>
                <Editable value={row.aPre} onChange={(v) => updateRow(i, { aPre: v })} editMode={editMode} tag="span" {...answerProps(`rows.${i}.aPre`)} />
                <Editable
                  value={row.aYes}
                  onChange={(v) => updateRow(i, { aYes: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`rows.${i}.aYes`)}
                  style={{ fontWeight: 700, color: 'var(--ccbeu-pink)' }}
                />
                <span>. /</span>
                <Editable value={row.aMid} onChange={(v) => updateRow(i, { aMid: v })} editMode={editMode} tag="span" {...answerProps(`rows.${i}.aMid`)} />
                <Editable
                  value={row.aNo}
                  onChange={(v) => updateRow(i, { aNo: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`rows.${i}.aNo`)}
                  style={{ fontWeight: 700, color: 'var(--ccbeu-pink)' }}
                />
                <span>.</span>
              </div>
              {editMode && (
                <div className="row-controls">
                  <button type="button" className="row-btn remove" title="Remover linha" onClick={() => removeRow(i)}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </SlideStaggerItem>
        {editMode && (
          <button type="button" className="add-row-btn" style={{ position: 'absolute', left: 80, top: 358 + 40 + n * rowH + 10 }} onClick={addRow}>
            + Adicionar linha
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
