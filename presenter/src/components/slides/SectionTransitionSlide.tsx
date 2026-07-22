import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { BlockAnimations, LayoutOffset, LayoutOverrides, SectionTransitionData, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: SectionTransitionData;
  onEdit: (patch: Partial<SectionTransitionData>) => void;
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

export function SectionTransitionSlide({
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
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ccbeu-blue)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>
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
    </div>
  );
}
