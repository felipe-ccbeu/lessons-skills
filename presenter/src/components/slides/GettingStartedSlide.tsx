import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { GettingStartedData, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: GettingStartedData;
  onEdit: (patch: Partial<GettingStartedData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

export function GettingStartedSlide({
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
      <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', top: 0, left: 574, width: 706, height: 720 }}>
        <ImageSlot url={data.imageUrl} onChange={(v) => onEdit({ imageUrl: v })} editMode={editMode} style={{ width: '100%', height: '100%' }} />
      </SlideStaggerItem>

      <SlideStagger disabled={editMode}>
        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 80,
            top: 62,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-title)',
            fontWeight: 500,
            fontSize: '9pt',
            letterSpacing: '0.08em',
            color: 'var(--ccbeu-blue)',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: 'none' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 80, top: 224, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '45pt', color: 'var(--ccbeu-blue)', lineHeight: 1 }}>
          01
        </div>

        <div style={{ position: 'absolute', left: 80, top: 330, width: 93, height: 6, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 350, width: 430 }}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '32pt', lineHeight: 1.1, color: '#000' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 430, width: 420 }}>
          <Editable
            value={data.subtitle}
            onChange={(v) => onEdit({ subtitle: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('subtitle')}
            style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '17pt', lineHeight: 1.4, color: 'var(--ink-muted)' }}
          />
        </SlideStaggerItem>
      </SlideStagger>

      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
    </div>
  );
}
