import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

export function RollCallSlide(props: SlideRenderProps<'rollCall'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('rollCall', props);
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const phrases = data.phrases;
  const updatePhrase = (i: number, v: string) => onEdit({ phrases: phrases.map((p, idx) => (idx === i ? v : p)) });
  const addPhrase = () => onEdit({ phrases: [...phrases, 'New phrase.'] });
  const removePhrase = (i: number) => onEdit({ phrases: phrases.filter((_, idx) => idx !== i) });

  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
        />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 112, width: 700 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 190, width: 500, display: 'flex', flexDirection: 'column', gap: 7 }}
          {...dragProps('phrases')}
        >
          {phrases.map((phrase, i) => (
            <SlideStaggerItem key={i} disabled={editMode} {...dragProps(`phrases.${i}`)}>
              <div
                className="ex-row"
                style={{
                  position: 'relative',
                  background: i % 2 === 0 ? 'var(--tint-blue-bubble)' : 'var(--tint-pink-bubble)',
                  borderRadius: 8,
                  padding: '6px 16px',
                  boxShadow: 'var(--shadow-card)',
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: '11pt',
                  color: 'var(--ink)',
                }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removePhrase(i)) : undefined}
              >
                <Editable value={phrase} onChange={(v) => updatePhrase(i, v)} editMode={editMode} tag="span" {...answerProps(`phrases.${i}`)} />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover frase" onClick={() => removePhrase(i)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 621, top: 100, width: 1.5, height: 500, background: 'var(--border-hair)' }} />

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 700, top: 190, width: 460, height: 353, borderRadius: 22, boxShadow: 'var(--shadow-bubble)', overflow: 'hidden' }}
          {...dragProps('photo')}
        >
          <ImageSlot url={data.imageUrl} onChange={(v) => onEdit({ imageUrl: v })} editMode={editMode} style={{ width: '100%', height: '100%' }} />
        </SlideStaggerItem>
      </SlideStagger>
      {editMode && (
        <button
          type="button"
          className="add-row-btn"
          style={{ position: 'absolute', left: 80, top: 190 + phrases.length * 41 + 14 }}
          onClick={addPhrase}
        >
          + Adicionar frase
        </button>
      )}
      <SlideFooter />
      {menuElement}
    </SlideRoot>
  );
}
