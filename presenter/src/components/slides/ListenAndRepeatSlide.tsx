import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { ListenAndRepeatData, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: ListenAndRepeatData;
  onEdit: (patch: Partial<ListenAndRepeatData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

export function ListenAndRepeatSlide({
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
            gap: 8,
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 210, width: 560 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '29pt', color: 'var(--ccbeu-blue)' }}>
            Listen &amp; Repeat
          </h1>
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 80,
            top: 296,
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: '11pt',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
          }}
        >
          Pair Work
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 80, top: 340, width: 470, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SlideStaggerItem disabled={editMode} style={{ display: 'flex', gap: '0.7em' }}>
            <div style={{ flex: '0 0 auto', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ccbeu-blue)', lineHeight: 1.3, minWidth: '1.4em' }}>
              1
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '14pt', lineHeight: 1.3, color: 'var(--ink)', display: 'flex', alignItems: 'flex-start', gap: '0.5em', flexWrap: 'wrap' }}>
              <Editable value={data.step1} onChange={(v) => onEdit({ step1: v })} editMode={editMode} tag="span" {...answerProps('step1')} />
              <span style={{ display: 'inline-flex', flex: '0 0 auto', height: '1.3em', width: '1.3em', borderRadius: 999, background: '#eef1f8' }} />
            </div>
          </SlideStaggerItem>
          <SlideStaggerItem disabled={editMode} style={{ display: 'flex', gap: '0.7em' }}>
            <div style={{ flex: '0 0 auto', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ccbeu-blue)', lineHeight: 1.3, minWidth: '1.4em' }}>
              2
            </div>
            <Editable
              value={data.step2}
              onChange={(v) => onEdit({ step2: v })}
              editMode={editMode}
              {...answerProps('step2')}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '14pt', lineHeight: 1.3, color: 'var(--ink)' }}
            />
          </SlideStaggerItem>
          <SlideStaggerItem disabled={editMode} style={{ display: 'flex', gap: '0.7em' }}>
            <div style={{ flex: '0 0 auto', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ccbeu-blue)', lineHeight: 1.3, minWidth: '1.4em' }}>
              3
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '14pt', lineHeight: 1.3, color: 'var(--ink)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Editable value={data.step3Pre} onChange={(v) => onEdit({ step3Pre: v })} editMode={editMode} tag="span" {...answerProps('step3Pre')} />
              <Editable
                value={data.step3Hl}
                onChange={(v) => onEdit({ step3Hl: v })}
                editMode={editMode}
                tag="span"
                {...answerProps('step3Hl')}
                style={{ fontStyle: 'italic' }}
              />
            </div>
          </SlideStaggerItem>
        </div>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 124, top: 500, width: 430 }}>
          <Editable
            value={data.tip}
            onChange={(v) => onEdit({ tip: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('tip')}
            style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '14pt', color: 'var(--ink)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 681, top: 177, width: 1.5, height: 361, background: 'var(--ccbeu-blue)' }}
        >
          <span />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 720, top: 195, width: 340, background: '#eaf0ff', borderRadius: 14, padding: '14px 18px', boxSizing: 'border-box' }}
        >
          <Editable
            value={data.dialogueLine1}
            onChange={(v) => onEdit({ dialogueLine1: v })}
            editMode={editMode}
            {...answerProps('dialogueLine1')}
            style={{ fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}
          />
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 729, top: 264, width: 121, height: 152 }}>
          <ImageSlot url={data.avatar1Url} onChange={(v) => onEdit({ avatar1Url: v })} editMode={editMode} style={{ width: 56, height: 56, borderRadius: '50%' }} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 1050, top: 308, width: 131, height: 161 }}>
          <ImageSlot url={data.avatar2Url} onChange={(v) => onEdit({ avatar2Url: v })} editMode={editMode} style={{ width: 56, height: 56, borderRadius: '50%' }} />
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 728, top: 489, width: 340, background: '#feeaf3', borderRadius: 14, padding: '14px 18px', boxSizing: 'border-box' }}
        >
          <Editable
            value={data.dialogueLine2}
            onChange={(v) => onEdit({ dialogueLine2: v })}
            editMode={editMode}
            {...answerProps('dialogueLine2')}
            style={{ fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}
          />
        </SlideStaggerItem>
      </SlideStagger>
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
    </div>
  );
}
