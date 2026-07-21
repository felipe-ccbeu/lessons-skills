import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { ModelExampleListData, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: ModelExampleListData;
  onEdit: (patch: Partial<ModelExampleListData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

const BASE_ITEMS = 3;
const BASE_ITEM_H = 48;
const BASE_FONT = 15;
const MIN_FONT = 10;
const MIN_ITEM_H = 30;
const BAND_H = 620 - 190 - 84;

export function ModelExampleListSlide({
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

  const items = data.items;
  const n = items.length;
  const itemH = n <= BASE_ITEMS ? BASE_ITEM_H : Math.max(MIN_ITEM_H, Math.floor(BAND_H / n));
  const fontPt = n <= BASE_ITEMS ? BASE_FONT : Math.max(MIN_FONT, Math.min(BASE_FONT, Math.round(BASE_FONT * (itemH / BASE_ITEM_H))));

  const updateItem = (i: number, v: string) => onEdit({ items: items.map((it, idx) => (idx === i ? v : it)) });
  const addItem = () => onEdit({ items: [...items, 'New sentence.'] });
  const removeItem = (i: number) => onEdit({ items: items.filter((_, idx) => idx !== i) });
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
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 108, width: 1120 }}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 190, width: 1120 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              padding: '16px 20px',
              background: '#FFF4F8',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <div style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ccbeu-pink)', flex: '0 0 auto' }}>
              Example
            </div>
            <Editable
              value={data.example}
              onChange={(v) => onEdit({ example: v })}
              editMode={editMode}
              tag="div"
              {...answerProps('example')}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15pt', color: 'var(--ink)' }}
            />
          </div>

          {items.map((item, i) => (
            <div
              key={i}
              className="ex-row"
              style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 14, height: itemH }}
              onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeItem(i)) : undefined}
            >
              <div style={{ flex: '0 0 32px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '13pt', color: 'var(--ccbeu-blue)' }}>{i + 1}</div>
              <Editable
                value={item}
                onChange={(v) => updateItem(i, v)}
                editMode={editMode}
                {...answerProps(`items.${i}`)}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: `${fontPt}pt`, color: 'var(--ink)' }}
              />
              {editMode && (
                <div className="row-controls">
                  <button type="button" className="row-btn remove" title="Remover item" onClick={() => removeItem(i)}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </SlideStaggerItem>
      </SlideStagger>
      {editMode && (
        <button type="button" className="add-row-btn" style={{ position: 'absolute', left: 80, top: 190 + 84 + n * itemH + 14 }} onClick={addItem}>
          + Adicionar item
        </button>
      )}
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
