import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { LookLightExample } from '@/lib/types';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

export function LookLightSlide(props: SlideRenderProps<'lookLight'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('lookLight', props);
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const examples = data.examples;
  const updateExample = (i: number, patch: Partial<LookLightExample>) => onEdit({ examples: examples.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const addExample = () => onEdit({ examples: [...examples, { pre: "It's", hl: 'a', post: 'banana.' }] });
  const removeExample = (i: number) => onEdit({ examples: examples.filter((_, idx) => idx !== i) });

  const imageUrls = data.imageUrls;
  const updateImage = (i: number, url: string) => onEdit({ imageUrls: imageUrls.map((u, idx) => (idx === i ? url : u)) });
  const addImage = () => onEdit({ imageUrls: [...imageUrls, ''] });
  const removeImage = (i: number) => onEdit({ imageUrls: imageUrls.filter((_, idx) => idx !== i) });

  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
        />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 112 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '41pt', color: 'var(--ccbeu-blue)', lineHeight: 1 }}>LOOK!</h1>
        </SlideStaggerItem>
        <div style={{ position: 'absolute', left: 80, top: 196, width: 88, height: 6, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 250, width: 520, display: 'flex', flexDirection: 'column', gap: 22 }}
          {...dragProps('examples')}
        >
          {examples.map((ex, i) => (
            <SlideStaggerItem key={i} disabled={editMode} {...dragProps(`examples.${i}`)}>
              <div
                className="ex-row"
                style={{
                  position: 'relative',
                  background: i % 2 === 0 ? 'var(--tint-blue-bubble)' : 'var(--tint-pink-bubble)',
                  borderRadius: 12,
                  padding: '26px 28px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: '19pt',
                  color: 'var(--ink)',
                }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeExample(i)) : undefined}
              >
                <Editable value={ex.pre} onChange={(v) => updateExample(i, { pre: v })} editMode={editMode} tag="span" {...answerProps(`examples.${i}.pre`)} />
                <Editable
                  value={ex.hl}
                  onChange={(v) => updateExample(i, { hl: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`examples.${i}.hl`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ccbeu-pink)' }}
                />
                <Editable value={ex.post} onChange={(v) => updateExample(i, { post: v })} editMode={editMode} tag="span" {...answerProps(`examples.${i}.post`)} />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover exemplo" onClick={() => removeExample(i)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
          {editMode && (
            <button type="button" className="add-row-btn" style={{ position: 'static' }} onClick={addExample}>
              + Adicionar exemplo
            </button>
          )}

          <Editable
            value={data.tip}
            onChange={(v) => onEdit({ tip: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('tip')}
            style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '13pt', lineHeight: 1.5, color: 'var(--ink-muted)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 660, top: 250, display: 'flex', gap: 20 }}
          {...dragProps('images')}
        >
          {imageUrls.map((url, i) => (
            <SlideStaggerItem key={i} disabled={editMode} {...dragProps(`images.${i}`)}>
              <div
                className="ex-row"
                style={{ position: 'relative', width: 240, height: 240, borderRadius: 6, border: '1px solid var(--border-hair)', overflow: 'hidden' }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeImage(i)) : undefined}
              >
                <ImageSlot url={url} onChange={(v) => updateImage(i, v)} editMode={editMode} style={{ width: '100%', height: '100%' }} />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover foto" onClick={() => removeImage(i)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
          {editMode && (
            <button type="button" className="add-row-btn" style={{ position: 'static' }} onClick={addImage}>
              + Adicionar foto
            </button>
          )}
        </SlideStaggerItem>
      </SlideStagger>
      <SlideFooter />
      {menuElement}
    </SlideRoot>
  );
}
