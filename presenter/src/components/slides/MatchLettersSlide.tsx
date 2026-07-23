import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, LayoutOffset, LayoutOverrides, MatchLettersData, MatchLettersRow, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: MatchLettersData;
  onEdit: (patch: Partial<MatchLettersData>) => void;
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

const BASE_ROWS = 8;
const BASE_ROW_H = 52;
const BASE_FONT = 18;
const MIN_FONT = 11;
const MIN_ROW_H = 30;
const BAND_H = 616 - 172;

export function MatchLettersSlide({
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
    template: 'matchLetters' as const,
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
  const fontPt =
    n <= BASE_ROWS ? BASE_FONT : Math.max(MIN_FONT, Math.min(BASE_FONT, Math.round(BASE_FONT * (rowH / BASE_ROW_H))));
  const badgeFontPt = Math.max(MIN_FONT, Math.min(22, Math.round(22 * (rowH / BASE_ROW_H))));

  const updateRow = (i: number, patch: Partial<MatchLettersRow>) => onEdit({ rows: rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  const addRow = () => onEdit({ rows: [...rows, { term: 'New term', letter: 'A' }] });
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
            top: 40,
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 66, width: 1120 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 700, top: 118, width: 500 }} {...dragProps('instruction')}>
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('instruction')}
            style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 140 }} {...dragProps('gridImage')}>
          <ImageSlot
            url={data.gridImageUrl}
            onChange={(v) => onEdit({ gridImageUrl: v })}
            editMode={editMode}
            style={{ width: 500, height: 484, borderRadius: 6 }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 700, top: 172, width: 500 }} {...dragProps('rows')}>
          {rows.map((row, i) => (
            <SlideStaggerItem key={i} disabled={editMode} {...dragProps(`rows.${i}`)}>
              <div
                className="ex-row"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: rowH }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(i)) : undefined}
              >
                <Editable
                  value={row.term}
                  onChange={(v) => updateRow(i, { term: v })}
                  editMode={editMode}
                  {...answerProps(`rows.${i}.term`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 500, fontSize: `${fontPt}pt`, color: 'var(--ink)' }}
                />
                <Editable
                  value={row.letter}
                  onChange={(v) => updateRow(i, { letter: v })}
                  editMode={editMode}
                  {...answerProps(`rows.${i}.letter`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: `${badgeFontPt}pt`, color: 'var(--ccbeu-pink)' }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover linha" onClick={() => removeRow(i)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
        </SlideStaggerItem>
      </SlideStagger>
      {editMode && (
        <button type="button" className="add-row-btn" style={{ position: 'absolute', left: 700, top: 172 + n * rowH + 14 }} onClick={addRow}>
          + Adicionar par
        </button>
      )}
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
