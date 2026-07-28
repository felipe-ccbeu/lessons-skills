// Shared building blocks for slide renderers — the "letterhead" every template
// composes instead of re-hand-coding the same stage wrapper, field-prop
// closures, breadcrumb and footer. A NEW template's renderer can be just its
// unique middle: `SlideRoot` around a `SlideBreadcrumb`, its own content, and a
// `SlideFooter`, using `slideFieldProps` for the drag/answer wiring.
//
// Existing renderers still hand-roll these inline; they migrate to this kit one
// at a time (each migration is behaviour-preserving, verified against the
// pre-change render), so nothing has to change all at once.
import type { ReactNode } from 'react';
import { Editable } from '@/components/ui/Editable';
import { SlideStaggerItem } from '@/components/ui/SlideStagger';
import type {
  SlideTemplate,
  TemplateDataMap,
  StyleOverrides,
  TextStyleOverride,
  LayoutOverrides,
  LayoutOffset,
  BlockAnimations,
} from '@/lib/types';
import type { BlockAnimationId } from '@/lib/blockEntranceAnimations';

/**
 * Common props every slide renderer receives, parameterised by template `K` so
 * `data`/`onEdit` are correctly typed. Replaces the ~14-line Props type each
 * renderer used to declare by hand.
 */
export type SlideRenderProps<K extends SlideTemplate> = {
  data: TemplateDataMap[K];
  onEdit: (patch: Partial<TemplateDataMap[K]>) => void;
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

/**
 * Builds the two per-field prop spreaders every renderer uses:
 * `dragProps(key)` for a draggable/animatable block, `answerProps(key)` for an
 * Editable that can be hidden-until-revealed and style-overridden. This is the
 * exact closure pair that used to sit, copy-pasted, at the top of each renderer.
 *
 * `template` is passed straight through to the block so the right-click menu can
 * resolve it to a removable list row — a no-op for templates that have no
 * removable lists (resolveRemovableRow returns null), which is why some
 * hand-written renderers omitted it without any behavioural difference.
 */
export function slideFieldProps<K extends SlideTemplate>(template: K, p: SlideRenderProps<K>) {
  const {
    editMode,
    answerFields = [],
    revealAnswers = true,
    onToggleAnswerField,
    styleOverrides = {},
    onStyleFieldChange,
    layoutOverrides = {},
    onLayoutOffsetChange,
    stageScale = 1,
    blockAnimations = {},
    onBlockAnimationChange,
  } = p;

  const dragProps = (key: string) => ({
    dragKey: key,
    editMode,
    layoutOffset: layoutOverrides[key],
    onLayoutOffsetChange,
    stageScale,
    blockAnimation: blockAnimations[key],
    onBlockAnimationChange,
    template,
  });

  const answerProps = (key: string) => ({
    answer: answerFields.includes(key),
    revealed: revealAnswers,
    onToggleAnswer: onToggleAnswerField ? () => onToggleAnswerField(key) : undefined,
    styleOverride: styleOverrides[key],
    onStyleChange: onStyleFieldChange ? (patch: TextStyleOverride | null) => onStyleFieldChange(key, patch) : undefined,
  });

  return { dragProps, answerProps };
}

export type SlideFieldProps = ReturnType<typeof slideFieldProps>;
export type AnswerProps = ReturnType<SlideFieldProps['answerProps']>;

/**
 * The 1280×720 stage every slide renders into. Background defaults to white;
 * full-bleed templates (e.g. the blue opener) pass their own.
 */
export function SlideRoot({ background = '#fff', children }: { background?: string; children: ReactNode }) {
  return (
    <div style={{ position: 'relative', width: 1280, height: 720, background, overflow: 'hidden' }}>{children}</div>
  );
}

/**
 * The pink-dot + uppercase breadcrumb at a content slide's top-left. Dot size and
 * letter-spacing vary slightly per template (8/0.06em vs 10/0.08em), hence the
 * params; the dot is always `flex: 0 0 auto` (fixed size — visually identical to
 * the few renderers that omitted it).
 */
export function SlideBreadcrumb({
  value,
  onChange,
  editMode,
  answer,
  dotSize = 10,
  letterSpacing = '0.08em',
  color = 'var(--ccbeu-blue)',
  top = 62,
}: {
  value: string;
  onChange: (v: string) => void;
  editMode: boolean;
  answer: AnswerProps;
  dotSize?: number;
  letterSpacing?: string;
  color?: string;
  top?: number;
}) {
  return (
    <SlideStaggerItem
      disabled={editMode}
      style={{
        position: 'absolute',
        left: 80,
        top,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: 'var(--font-title)',
        fontWeight: 500,
        fontSize: '9pt',
        letterSpacing,
        textTransform: 'uppercase',
        color,
      }}
    >
      <span style={{ width: dotSize, height: dotSize, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
      <Editable value={value} onChange={onChange} editMode={editMode} {...answer} />
    </SlideStaggerItem>
  );
}

/**
 * The "CCBEU English Center" footer mark. Colour defaults to the dark on-white
 * ink; slides on a coloured background pass a light colour.
 */
export function SlideFooter({ color = 'var(--ink-footer)' }: { color?: string }) {
  return (
    <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color }}>
      CCBEU English Center
    </div>
  );
}
