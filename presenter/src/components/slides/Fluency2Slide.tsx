import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { BlockAnimations, Fluency2Data, LayoutOffset, LayoutOverrides, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: Fluency2Data;
  onEdit: (patch: Partial<Fluency2Data>) => void;
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

export function Fluency2Slide({
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
          <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124, width: 584 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 192, width: 547 }} {...dragProps('instruction')}>
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Editable value={data.instructionPre} onChange={(v) => onEdit({ instructionPre: v })} editMode={editMode} tag="span" {...answerProps('instructionPre')} />
            <Editable
              value={data.instructionHl}
              onChange={(v) => onEdit({ instructionHl: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('instructionHl')}
              style={{ fontStyle: 'italic' }}
            />
            <span>.</span>
          </p>
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 257, width: 1114, height: 346 }} {...dragProps('image')}>
          <ImageSlot url={data.imageUrl} onChange={(v) => onEdit({ imageUrl: v })} editMode={editMode} style={{ width: '100%', height: '100%', borderRadius: 6 }} />
        </SlideStaggerItem>
      </SlideStagger>
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
    </div>
  );
}
