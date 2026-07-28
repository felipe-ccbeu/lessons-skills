import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

export function ComparativeSlide(props: SlideRenderProps<'comparative'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('comparative', props);

  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
        />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124, width: 1120 }} {...dragProps('title')}>
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
          style={{ position: 'absolute', left: 80, top: 303, width: 544, height: 187, background: '#f3f4f7', borderRadius: 8, overflow: 'hidden' }}
          {...dragProps('leftBox')}
        >
          <div style={{ height: 4, background: 'var(--ccbeu-blue)' }} />
          <p style={{ margin: '30px 35px', fontFamily: 'var(--font-title)', fontWeight: 400, fontSize: '24pt', lineHeight: 1.3, color: 'var(--ink)' }}>
            <Editable value={data.leftHl} onChange={(v) => onEdit({ leftHl: v })} editMode={editMode} tag="span" {...answerProps('leftHl')} style={{ fontWeight: 800, color: 'var(--ccbeu-blue)' }} />{' '}
            <Editable value={data.leftText} onChange={(v) => onEdit({ leftText: v })} editMode={editMode} tag="span" {...answerProps('leftText')} />
          </p>
          <div style={{ margin: '0 35px', width: 173, height: 2, background: 'var(--ccbeu-blue)' }} />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 656, top: 303, width: 544, height: 187, background: '#fdecf3', borderRadius: 8, overflow: 'hidden' }}
          {...dragProps('rightBox')}
        >
          <div style={{ height: 4, background: 'var(--ccbeu-pink)' }} />
          <p style={{ margin: '30px 35px', fontFamily: 'var(--font-title)', fontWeight: 400, fontSize: '24pt', lineHeight: 1.3, color: 'var(--ink)' }}>
            <Editable value={data.rightHl} onChange={(v) => onEdit({ rightHl: v })} editMode={editMode} tag="span" {...answerProps('rightHl')} style={{ fontWeight: 800, color: 'var(--ccbeu-pink)' }} />{' '}
            <Editable value={data.rightText} onChange={(v) => onEdit({ rightText: v })} editMode={editMode} tag="span" {...answerProps('rightText')} />
          </p>
          <div style={{ margin: '0 35px', width: 173, height: 2, background: 'var(--ccbeu-pink)' }} />
        </SlideStaggerItem>
      </SlideStagger>

      <SlideFooter />
    </SlideRoot>
  );
}
