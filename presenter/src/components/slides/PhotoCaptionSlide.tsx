import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { PhotoCaptionData } from '@/lib/types';

type Props = {
  data: PhotoCaptionData;
  onEdit: (patch: Partial<PhotoCaptionData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
};

export function PhotoCaptionSlide({
  data,
  onEdit,
  editMode,
  answerFields = [],
  onToggleAnswerField,
  revealAnswers = true,
}: Props) {
  const answerProps = (key: string) => ({
    answer: answerFields.includes(key),
    revealed: revealAnswers,
    onToggleAnswer: onToggleAnswerField ? () => onToggleAnswerField(key) : undefined,
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
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 130, width: 560 }}>
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
              fontSize: '30pt',
              color: 'var(--ccbeu-blue)',
            }}
          />
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 300 }}>
          <Editable
            value={data.name}
            onChange={(v) => onEdit({ name: v })}
            editMode={editMode}
            {...answerProps('name')}
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '20pt',
              color: 'var(--ccbeu-pink)',
            }}
          />
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 344 }}>
          <Editable
            value={data.role}
            onChange={(v) => onEdit({ role: v })}
            editMode={editMode}
            {...answerProps('role')}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13pt',
              color: 'var(--ink-muted)',
            }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 430, width: 560 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '15pt',
              color: 'var(--ink)',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <Editable value={data.sentencePre} onChange={(v) => onEdit({ sentencePre: v })} editMode={editMode} tag="span" {...answerProps('sentencePre')} />
            <Editable
              value={data.answer}
              onChange={(v) => onEdit({ answer: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('answer')}
              style={{ fontWeight: 700, color: 'var(--ccbeu-pink)', borderBottom: '2px solid var(--ccbeu-pink)' }}
            />
            <Editable value={data.sentencePost} onChange={(v) => onEdit({ sentencePost: v })} editMode={editMode} tag="span" {...answerProps('sentencePost')} />
          </p>
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 680, top: 0, width: 600, height: 720 }}
        >
          <ImageSlot
            url={data.imageUrl}
            onChange={(v) => onEdit({ imageUrl: v })}
            editMode={editMode}
            style={{ width: '100%', height: '100%' }}
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
