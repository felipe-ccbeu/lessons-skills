import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, GrammarBoxLookData, GrammarBoxLookRow, GrammarBoxLookTip, LayoutOffset, LayoutOverrides, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: GrammarBoxLookData;
  onEdit: (patch: Partial<GrammarBoxLookData>) => void;
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
const BASE_ROW_H = 40;
const BASE_ROW_FONT = 15;
const MIN_ROW_FONT = 10;
const MIN_ROW_H = 24;
const ROWS_BAND_H = 4 * BASE_ROW_H;

const BASE_TIPS = 3;
const BASE_TIP_FONT = 15;
const MIN_TIP_FONT = 10;
const BASE_TIP_GAP = 10;
const MIN_TIP_GAP = 4;

export function GrammarBoxLookSlide({
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
  const nRows = rows.length;
  const rowH = nRows <= BASE_ROWS ? BASE_ROW_H : Math.max(MIN_ROW_H, Math.floor(ROWS_BAND_H / nRows));
  const rowFont =
    nRows <= BASE_ROWS
      ? BASE_ROW_FONT
      : Math.max(MIN_ROW_FONT, Math.min(BASE_ROW_FONT, Math.round(BASE_ROW_FONT * (rowH / BASE_ROW_H))));

  const updateRow = (i: number, patch: Partial<GrammarBoxLookRow>) => {
    onEdit({ rows: rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  };
  const addRow = () => onEdit({ rows: [...rows, { subject: 'I', hl: 'am', text: 'a student.' }] });
  const removeRow = (i: number) => onEdit({ rows: rows.filter((_, idx) => idx !== i) });

  const tips = data.tips;
  const nTips = tips.length;
  const tipFont =
    nTips <= BASE_TIPS
      ? BASE_TIP_FONT
      : Math.max(MIN_TIP_FONT, Math.round(BASE_TIP_FONT - (nTips - BASE_TIPS) * 1.5));
  const tipGap =
    nTips <= BASE_TIPS ? BASE_TIP_GAP : Math.max(MIN_TIP_GAP, Math.round(BASE_TIP_GAP - (nTips - BASE_TIPS) * 2));

  const updateTip = (i: number, patch: Partial<GrammarBoxLookTip>) => {
    onEdit({ tips: tips.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });
  };
  const addTip = () => onEdit({ tips: [...tips, { full: 'I am', short: "I'm" }] });
  const removeTip = (i: number) => onEdit({ tips: tips.filter((_, idx) => idx !== i) });
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
            gap: 8,
            fontFamily: 'var(--font-title)',
            fontWeight: 500,
            fontSize: '9pt',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ccbeu-blue)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 687,
            top: 130,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55em',
            background: 'var(--ccbeu-blue)',
            color: '#fff',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: '14pt',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: 999,
            padding: '0.5em 1.05em',
            lineHeight: 1,
          }}
          {...dragProps('grammarBoxLabel')}
        >
          <span>GRAMMAR BOX</span>
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 969, top: 137 }}>
          <Editable
            value={data.topicName}
            onChange={(v) => onEdit({ topicName: v })}
            editMode={editMode}
            {...answerProps('topicName')}
            style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '18pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 162, width: 178, height: 90 }}
          {...dragProps('title')}
        >
          <h1 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '41pt', color: 'var(--ink)' }}>LOOK!</h1>
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 252, width: 64, height: 6, borderRadius: 999, background: 'var(--ccbeu-pink)' }}
        >
          {null}
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 78, top: 320, width: 240 }} {...dragProps('example1')}>
          <ImageSlot
            url={data.imageUrl1}
            onChange={(v) => onEdit({ imageUrl1: v })}
            editMode={editMode}
            style={{ width: 240, height: 180, borderRadius: 6 }}
          />
          <figcaption style={{ marginTop: 12, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ink)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Editable value={data.ex1Pre} onChange={(v) => onEdit({ ex1Pre: v })} editMode={editMode} tag="span" {...answerProps('ex1Pre')} />
            <Editable
              value={data.ex1Hl}
              onChange={(v) => onEdit({ ex1Hl: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('ex1Hl')}
              style={{ color: 'var(--ccbeu-pink)' }}
            />
            <Editable value={data.ex1Post} onChange={(v) => onEdit({ ex1Post: v })} editMode={editMode} tag="span" {...answerProps('ex1Post')} />
          </figcaption>
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 338, top: 320, width: 240 }} {...dragProps('example2')}>
          <ImageSlot
            url={data.imageUrl2}
            onChange={(v) => onEdit({ imageUrl2: v })}
            editMode={editMode}
            style={{ width: 240, height: 180, borderRadius: 6 }}
          />
          <figcaption style={{ marginTop: 12, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ink)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Editable value={data.ex2Pre} onChange={(v) => onEdit({ ex2Pre: v })} editMode={editMode} tag="span" {...answerProps('ex2Pre')} />
            <Editable
              value={data.ex2Hl}
              onChange={(v) => onEdit({ ex2Hl: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('ex2Hl')}
              style={{ color: 'var(--ccbeu-pink)' }}
            />
            <Editable value={data.ex2Post} onChange={(v) => onEdit({ ex2Post: v })} editMode={editMode} tag="span" {...answerProps('ex2Post')} />
          </figcaption>
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 687,
            top: 210,
            width: 500,
            border: '1px solid var(--border-hair)',
            borderRadius: 6,
            overflow: 'hidden',
            fontFamily: 'var(--font-body)',
          }}
          {...dragProps('grammarBox')}
        >
          <div style={{ display: 'flex', background: 'var(--ccbeu-blue)' }}>
            <div style={{ flex: '0 0 21%', padding: '8px 14px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '9pt', letterSpacing: '0.06em', color: '#fff' }}>SUBJECT</div>
            <div style={{ flex: '1 1 auto', padding: '7px 14px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '15pt', letterSpacing: '0.06em', color: '#fff' }}>
              <Editable value={data.tableHeader} onChange={(v) => onEdit({ tableHeader: v })} editMode={editMode} tag="span" {...answerProps('tableHeader')} style={{ color: '#fff' }} />
            </div>
          </div>
          {rows.map((row, i) => (
            <div
              key={i}
              className="ex-row"
              style={{ position: 'relative', display: 'flex', background: i % 2 === 0 ? '#fff' : 'var(--chrome-bg-subtle)' }}
              onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(i)) : undefined}
            >
              <Editable
                value={row.subject}
                onChange={(v) => updateRow(i, { subject: v })}
                editMode={editMode}
                {...answerProps(`rows.${i}.subject`)}
                style={{ flex: '0 0 21%', padding: '7px 14px', fontSize: `${rowFont}pt`, color: 'var(--ink)' }}
              />
              <div style={{ flex: '1 1 auto', padding: '7px 14px', display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: `${rowFont}pt`, color: 'var(--ink)' }}>
                <Editable
                  value={row.hl}
                  onChange={(v) => updateRow(i, { hl: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`rows.${i}.hl`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ccbeu-pink)' }}
                />
                <Editable value={row.text} onChange={(v) => updateRow(i, { text: v })} editMode={editMode} tag="span" {...answerProps(`rows.${i}.text`)} />
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
          <button type="button" className="add-row-btn" style={{ position: 'absolute', left: 687, top: 210 + 40 + nRows * rowH + 10 }} onClick={addRow}>
            + Adicionar linha
          </button>
        )}

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 687,
            top: 470,
            width: 500,
            display: 'flex',
            background: '#FFF4F8',
            borderRadius: 12,
            overflow: 'hidden',
          }}
          {...dragProps('tips')}
        >
          <div style={{ flex: '0 0 52px', background: 'var(--ccbeu-pink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 4px' }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '14pt', color: '#fff', letterSpacing: '0.06em' }}>TIPS!</span>
          </div>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: tipGap, padding: '14px 18px', fontSize: `${tipFont}pt` }}>
            {tips.map((tip, i) => (
              <div
                key={i}
                className="ex-row"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeTip(i)) : undefined}
              >
                <Editable
                  value={tip.full}
                  onChange={(v) => updateTip(i, { full: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`tips.${i}.full`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 500, color: 'var(--ink)', fontSize: `${tipFont}pt` }}
                />
                <span style={{ color: 'var(--ccbeu-blue)', fontWeight: 700 }}>→</span>
                <Editable
                  value={tip.short}
                  onChange={(v) => updateTip(i, { short: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`tips.${i}.short`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ccbeu-pink)', fontSize: `${tipFont}pt` }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover dica" onClick={() => removeTip(i)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
            {editMode && (
              <button type="button" className="add-row-btn" onClick={addTip}>
                + Adicionar dica
              </button>
            )}
          </div>
        </SlideStaggerItem>
      </SlideStagger>
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
