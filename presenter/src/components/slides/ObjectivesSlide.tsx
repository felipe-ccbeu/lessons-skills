import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { BlockAnimations, LayoutOffset, LayoutOverrides, ObjectivesData, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: ObjectivesData;
  onEdit: (patch: Partial<ObjectivesData>) => void;
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

const SKILLS = [
  { key: 'listening', label: 'Listening', icon: '👂' },
  { key: 'speaking', label: 'Speaking', icon: '🗣️' },
  { key: 'reading', label: 'Reading', icon: '📖' },
  { key: 'writing', label: 'Writing', icon: '✍️' },
];

export function ObjectivesSlide({
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
    <div style={{ position: 'relative', width: 1280, height: 720, background: 'var(--ccbeu-blue)', overflow: 'hidden' }}>
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
            color: '#fff',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 80, top: 191, width: 88, height: 6, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 217, width: 1085 }} {...dragProps('title')}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '36pt', color: '#fff', lineHeight: 1.15 }}>
            Today you will be able to…
          </h1>
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 80, top: 301, width: 909 }}>
          <SlideStaggerItem disabled={editMode} style={{ fontFamily: 'var(--font-body)', fontSize: '18pt', color: '#fff', marginBottom: 20, lineHeight: 1.3 }} {...dragProps('objective1')}>
            <Editable value={data.obj1Verb} onChange={(v) => onEdit({ obj1Verb: v })} editMode={editMode} tag="span" {...answerProps('obj1Verb')} style={{ fontWeight: 700 }} />{' '}
            <Editable value={data.obj1Pre} onChange={(v) => onEdit({ obj1Pre: v })} editMode={editMode} tag="span" {...answerProps('obj1Pre')} />{' '}
            <Editable value={data.obj1Hl} onChange={(v) => onEdit({ obj1Hl: v })} editMode={editMode} tag="span" {...answerProps('obj1Hl')} style={{ fontStyle: 'italic' }} />{' '}
            <Editable value={data.obj1Post} onChange={(v) => onEdit({ obj1Post: v })} editMode={editMode} tag="span" {...answerProps('obj1Post')} />
          </SlideStaggerItem>
          <SlideStaggerItem disabled={editMode} style={{ fontFamily: 'var(--font-body)', fontSize: '18pt', color: '#fff', marginBottom: 20, lineHeight: 1.3 }} {...dragProps('objective2')}>
            <Editable value={data.obj2Verb} onChange={(v) => onEdit({ obj2Verb: v })} editMode={editMode} tag="span" {...answerProps('obj2Verb')} style={{ fontWeight: 700 }} />{' '}
            <Editable value={data.obj2Text} onChange={(v) => onEdit({ obj2Text: v })} editMode={editMode} tag="span" {...answerProps('obj2Text')} />
          </SlideStaggerItem>
          <SlideStaggerItem disabled={editMode} style={{ fontFamily: 'var(--font-body)', fontSize: '18pt', color: '#fff', marginBottom: 20, lineHeight: 1.3 }} {...dragProps('objective3')}>
            <Editable value={data.obj3Verb} onChange={(v) => onEdit({ obj3Verb: v })} editMode={editMode} tag="span" {...answerProps('obj3Verb')} style={{ fontWeight: 700 }} />{' '}
            <Editable value={data.obj3Text} onChange={(v) => onEdit({ obj3Text: v })} editMode={editMode} tag="span" {...answerProps('obj3Text')} />
          </SlideStaggerItem>
        </div>

        <div style={{ position: 'absolute', left: 80, top: 534, display: 'flex', gap: 40 }}>
          {SKILLS.map((s) => (
            <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <span
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 600,
                  fontSize: '9pt',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#fff',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </SlideStagger>
    </div>
  );
}
