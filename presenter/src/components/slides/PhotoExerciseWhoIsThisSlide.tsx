import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { PhotoExerciseWhoIsThisData, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: PhotoExerciseWhoIsThisData;
  onEdit: (patch: Partial<PhotoExerciseWhoIsThisData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

export function PhotoExerciseWhoIsThisSlide({
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
          style={{ position: 'absolute', left: 677, top: 93, width: 533, height: 534 }}
        >
          <ImageSlot
            url={data.imageUrl}
            onChange={(v) => onEdit({ imageUrl: v })}
            editMode={editMode}
            style={{ width: '100%', height: '100%', borderRadius: 6 }}
          />
        </SlideStaggerItem>

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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 115, width: 520 }}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '24pt',
              color: 'var(--ccbeu-blue)',
            }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 81, top: 250, width: 567 }}>
          <Editable
            value={data.personName}
            onChange={(v) => onEdit({ personName: v })}
            editMode={editMode}
            {...answerProps('personName')}
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '20pt',
              color: 'var(--ccbeu-pink)',
            }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 81, top: 296, width: 520 }}>
          <Editable
            value={data.personRole}
            onChange={(v) => onEdit({ personRole: v })}
            editMode={editMode}
            {...answerProps('personRole')}
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '20pt',
              color: 'var(--ccbeu-pink)',
            }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 490, width: 623 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '20pt',
              color: 'var(--ink)',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <Editable value={data.sentencePre} onChange={(v) => onEdit({ sentencePre: v })} editMode={editMode} tag="span" {...answerProps('sentencePre')} />
            <Editable
              value={data.sentenceGap}
              onChange={(v) => onEdit({ sentenceGap: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('sentenceGap')}
              style={{ fontWeight: 700, color: 'var(--ccbeu-pink)' }}
            />
            <span>.</span>
          </p>
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
