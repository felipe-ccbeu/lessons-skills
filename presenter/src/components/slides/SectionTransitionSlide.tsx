import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

export function SectionTransitionSlide(props: SlideRenderProps<'sectionTransition'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('sectionTransition', props);

  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
          dotSize={8}
          letterSpacing="0.06em"
        />
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 200 }}
          {...dragProps('tag')}
        >
          <Editable
            value={data.tag}
            onChange={(v) => onEdit({ tag: v })}
            editMode={editMode}
            {...answerProps('tag')}
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '12pt',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ccbeu-pink)',
            }}
          />
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 260, width: 1120 }}
          {...dragProps('title')}
        >
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontWeight: 800,
              fontSize: '54pt',
              lineHeight: 1.1,
              color: 'var(--ccbeu-blue)',
            }}
          />
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 420, width: 900 }}
          {...dragProps('subtitle')}
        >
          <Editable
            value={data.subtitle}
            onChange={(v) => onEdit({ subtitle: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('subtitle')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '18pt',
              lineHeight: 1.4,
              color: 'var(--ink-muted)',
            }}
          />
        </SlideStaggerItem>
      </SlideStagger>
      <SlideFooter />
    </SlideRoot>
  );
}
