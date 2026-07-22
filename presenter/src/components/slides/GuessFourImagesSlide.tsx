import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { BlockAnimations, GuessFourImagesData, LayoutOffset, LayoutOverrides, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: GuessFourImagesData;
  onEdit: (patch: Partial<GuessFourImagesData>) => void;
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

const IMAGE_LEFT = [82, 353, 625, 895];

export function GuessFourImagesSlide({
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

  const updateImage = (i: number, url: string) => {
    const next = [...data.imageUrls] as GuessFourImagesData['imageUrls'];
    next[i] = url;
    onEdit({ imageUrls: next });
  };

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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 81, top: 124, width: 587 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        {IMAGE_LEFT.map((left, i) => (
          <SlideStaggerItem key={i} disabled={editMode} style={{ position: 'absolute', left, top: 236, width: 240, height: 200 }} {...dragProps(`image${i}`)}>
            <ImageSlot url={data.imageUrls[i]} onChange={(v) => updateImage(i, v)} editMode={editMode} style={{ width: '100%', height: '100%', borderRadius: 6 }} />
          </SlideStaggerItem>
        ))}

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 454, width: 1120 }} {...dragProps('instruction')}>
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('instruction')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ink)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 80,
            top: 500,
            width: 385,
            height: 77,
            background: 'var(--chrome-bg-subtle)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            boxSizing: 'border-box',
          }}
          {...dragProps('example')}
        >
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 500, fontSize: '8pt', color: 'var(--ccbeu-pink)', marginRight: 8 }}>Ex.</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '14pt', color: 'var(--ink)' }}>
            <Editable value={data.examplePre} onChange={(v) => onEdit({ examplePre: v })} editMode={editMode} tag="span" {...answerProps('examplePre')} />{' '}
            <Editable
              value={data.exampleHl}
              onChange={(v) => onEdit({ exampleHl: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('exampleHl')}
              style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ccbeu-blue)' }}
            />
            .
          </span>
        </SlideStaggerItem>
      </SlideStagger>

      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
    </div>
  );
}
