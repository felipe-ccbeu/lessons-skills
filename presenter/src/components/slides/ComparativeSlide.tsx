import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { ComparativeData, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: ComparativeData;
  onEdit: (patch: Partial<ComparativeData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

export function ComparativeSlide({
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124, width: 1120 }}>
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
        >
          <div style={{ height: 4, background: 'var(--ccbeu-pink)' }} />
          <p style={{ margin: '30px 35px', fontFamily: 'var(--font-title)', fontWeight: 400, fontSize: '24pt', lineHeight: 1.3, color: 'var(--ink)' }}>
            <Editable value={data.rightHl} onChange={(v) => onEdit({ rightHl: v })} editMode={editMode} tag="span" {...answerProps('rightHl')} style={{ fontWeight: 800, color: 'var(--ccbeu-pink)' }} />{' '}
            <Editable value={data.rightText} onChange={(v) => onEdit({ rightText: v })} editMode={editMode} tag="span" {...answerProps('rightText')} />
          </p>
          <div style={{ margin: '0 35px', width: 173, height: 2, background: 'var(--ccbeu-pink)' }} />
        </SlideStaggerItem>
      </SlideStagger>

      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
    </div>
  );
}
