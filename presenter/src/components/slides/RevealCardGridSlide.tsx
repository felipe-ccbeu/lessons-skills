import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { RevealCardGridItem } from '@/lib/types';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

export function RevealCardGridSlide(props: SlideRenderProps<'revealCardGrid'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('revealCardGrid', props);
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const items = data.items;
  const updateItem = (i: number, patch: Partial<RevealCardGridItem>) => onEdit({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const addItem = () => onEdit({ items: [...items, { imageUrl: '', term: 'WORD', answer: 'WORDS' }] });
  const removeItem = (i: number) => onEdit({ items: items.filter((_, idx) => idx !== i) });

  const cols = items.length <= 4 ? 2 : 3;

  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
        />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 112, width: 1120 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '20pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 220, width: 1120, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}
          {...dragProps('items')}
        >
          {items.map((item, i) => (
            <SlideStaggerItem key={i} disabled={editMode} {...dragProps(`items.${i}`)}>
              <div
                className="ex-row"
                style={{
                  position: 'relative',
                  background: 'var(--surface-zebra)',
                  borderRadius: 12,
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeItem(i)) : undefined}
              >
                <ImageSlot
                  url={item.imageUrl}
                  onChange={(v) => updateItem(i, { imageUrl: v })}
                  editMode={editMode}
                  style={{ width: 84, height: 84, borderRadius: 6, flex: '0 0 auto' }}
                />
                <div style={{ minWidth: 0 }}>
                  <Editable
                    value={item.term}
                    onChange={(v) => updateItem(i, { term: v })}
                    editMode={editMode}
                    tag="div"
                    {...answerProps(`items.${i}.term`)}
                    style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '17pt', color: 'var(--ink)' }}
                  />
                  <Editable
                    value={item.answer}
                    onChange={(v) => updateItem(i, { answer: v })}
                    editMode={editMode}
                    tag="div"
                    {...answerProps(`items.${i}.answer`)}
                    style={{ marginTop: 8, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '17pt', color: 'var(--ccbeu-pink)' }}
                  />
                </div>
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover cartão" onClick={() => removeItem(i)}>
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
        <button
          type="button"
          className="add-row-btn"
          style={{ position: 'absolute', left: 80, top: 220 + Math.ceil(items.length / cols) * 140 + 14 }}
          onClick={addItem}
        >
          + Adicionar cartão
        </button>
      )}
      <SlideFooter />
      {menuElement}
    </SlideRoot>
  );
}
