import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { PhotoLabelGridItem } from '@/lib/types';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

export function PhotoLabelGridSlide(props: SlideRenderProps<'photoLabelGrid'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('photoLabelGrid', props);
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const items = data.items;
  const updateItem = (i: number, patch: Partial<PhotoLabelGridItem>) => onEdit({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const addItem = () => onEdit({ items: [...items, { imageUrl: '', caption: 'a word' }] });
  const removeItem = (i: number) => onEdit({ items: items.filter((_, idx) => idx !== i) });

  const cols = Math.min(items.length, 4) || 1;
  const cardWidth = Math.floor((1120 - (cols - 1) * 24) / cols);
  const photoHeight = Math.min(cardWidth, 280);

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
          style={{ position: 'absolute', left: 80, top: 220, width: 1120, display: 'flex', flexWrap: 'wrap', gap: 24 }}
          {...dragProps('items')}
        >
          {items.map((item, i) => (
            <SlideStaggerItem key={i} disabled={editMode} style={{ width: cardWidth }} {...dragProps(`items.${i}`)}>
              <div
                className="ex-row"
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: cardWidth }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeItem(i)) : undefined}
              >
                <ImageSlot url={item.imageUrl} onChange={(v) => updateItem(i, { imageUrl: v })} editMode={editMode} style={{ width: cardWidth, height: photoHeight, borderRadius: 6 }} />
                <Editable
                  value={item.caption}
                  onChange={(v) => updateItem(i, { caption: v })}
                  editMode={editMode}
                  tag="p"
                  {...answerProps(`items.${i}.caption`)}
                  style={{ margin: '12px 0 0', fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)', textAlign: 'center' }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover item" onClick={() => removeItem(i)}>
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
          style={{ position: 'absolute', left: 80, top: 220 + Math.ceil(items.length / cols) * (photoHeight + 46) + 14 }}
          onClick={addItem}
        >
          + Adicionar foto
        </button>
      )}
      <SlideFooter />
      {menuElement}
    </SlideRoot>
  );
}
