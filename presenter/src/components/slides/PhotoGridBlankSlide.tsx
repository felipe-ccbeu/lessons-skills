import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { PhotoGridBlankData, PhotoGridBlankItem, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: PhotoGridBlankData;
  onEdit: (patch: Partial<PhotoGridBlankData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

export function PhotoGridBlankSlide({
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
  const updateItem = (i: number, patch: Partial<PhotoGridBlankItem>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onEdit({ items: next });
  };
  const addItem = () => onEdit({ items: [...items, { answer: 'New', text: 'item.', imageUrl: '' }] });
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
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '22pt',
              color: 'var(--ccbeu-blue)',
            }}
          />
        </SlideStaggerItem>

        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 180,
            width: 1120,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          {items.map((item, i) => (
            <SlideStaggerItem key={i} disabled={editMode} style={{ width: 260 }}>
              <div
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: 260 }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeItem(i)) : undefined}
              >
                <ImageSlot
                  url={item.imageUrl}
                  onChange={(v) => updateItem(i, { imageUrl: v })}
                  editMode={editMode}
                  style={{ width: 260, height: 170, borderRadius: 6 }}
                />
                <p
                  style={{
                    margin: '12px 0 0',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13pt',
                    color: 'var(--ink)',
                    display: 'flex',
                    gap: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <Editable
                    value={item.answer}
                    onChange={(v) => updateItem(i, { answer: v })}
                    editMode={editMode}
                    tag="span"
                    {...answerProps(`items.${i}.answer`)}
                    style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ccbeu-pink)' }}
                  />
                  <Editable value={item.text} onChange={(v) => updateItem(i, { text: v })} editMode={editMode} tag="span" {...answerProps(`items.${i}.text`)} />
                </p>
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover item" onClick={() => removeItem(i)}>
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
          style={{ position: 'absolute', left: 80, top: 180 + Math.ceil(items.length / 4) * 250 + 14 }}
          onClick={addItem}
        >
          + Adicionar item
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
