import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, LayoutOffset, LayoutOverrides, MatchVocabImageData, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

// One student's live guesses for this slide: keywordIndex -> position (0..1
// relative to the image box). Mirrors dragEvents.ts's VoterDragState without
// importing that server module directly (same pattern as PollLiveResults /
// QaLiveResults in the sibling slide components).
export type MatchVocabImageLiveResults = Record<string, Record<number, { x: number; y: number }>>;

type Props = {
  data: MatchVocabImageData;
  onEdit: (patch: Partial<MatchVocabImageData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  // Every joined student's current keyword placements, only present while
  // presenting live (never during editing/thumbnails) — see PresentationOverlay.
  dragResults?: MatchVocabImageLiveResults;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
  layoutOverrides?: LayoutOverrides;
  onLayoutOffsetChange?: (key: string, offset: LayoutOffset) => void;
  stageScale?: number;
  blockAnimations?: BlockAnimations;
  onBlockAnimationChange?: (key: string, animation: BlockAnimationId) => void;
};

export function MatchVocabImageSlide({
  data,
  onEdit,
  editMode,
  answerFields = [],
  onToggleAnswerField,
  revealAnswers = true,
  dragResults,
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
    template: 'matchVocabImage' as const,
  });
  const answerProps = (key: string) => ({
    answer: answerFields.includes(key),
    revealed: revealAnswers,
    onToggleAnswer: onToggleAnswerField ? () => onToggleAnswerField(key) : undefined,
    styleOverride: styleOverrides[key],
    onStyleChange: onStyleFieldChange ? (patch: TextStyleOverride | null) => onStyleFieldChange(key, patch) : undefined,
  });

  const keywords = data.keywords;

  const updateKeyword = (i: number, v: string) => onEdit({ keywords: keywords.map((k, idx) => (idx === i ? v : k)) });
  const addKeyword = () => onEdit({ keywords: [...keywords, 'word'] });
  const removeKeyword = (i: number) => onEdit({ keywords: keywords.filter((_, idx) => idx !== i) });
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

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
          <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 82, top: 183, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ccbeu-blue)' }}>
          1
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 129, top: 181, width: 900 }} {...dragProps('instruction')}>
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('instruction')}
            style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '14pt', color: 'var(--ink)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 230, width: 1120, display: 'flex', gap: 32, flexWrap: 'wrap' }} {...dragProps('keywords')}>
          {keywords.map((kw, i) => (
            <SlideStaggerItem key={i} disabled={editMode} {...dragProps(`keywords.${i}`)}>
              <div
                className="ex-row"
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeKeyword(i)) : undefined}
              >
                <Editable
                  value={kw}
                  onChange={(v) => updateKeyword(i, v)}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`keywords.${i}`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ccbeu-pink)' }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover palavra" onClick={() => removeKeyword(i)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
          {editMode && (
            <button type="button" className="add-row-btn" onClick={addKeyword}>
              + Adicionar palavra
            </button>
          )}
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 76, top: 290, width: 1120, height: 318 }} {...dragProps('image')}>
          <div style={{ position: 'relative', width: 1120, height: 318 }}>
            <ImageSlot
              url={data.imageUrl}
              onChange={(v) => onEdit({ imageUrl: v })}
              editMode={editMode}
              style={{ width: 1120, height: 318, borderRadius: 6 }}
            />
            {/* Live student guesses: every joined phone's current keyword
                placements, drawn low-opacity over the image so the teacher can
                see the class's spread of answers without it reading as "the"
                answer — see MatchVocabImageVoteForm for the phone side. */}
            {!editMode && dragResults && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 6 }}>
                {Object.entries(dragResults).flatMap(([voterKey, placements]) =>
                  Object.entries(placements).map(([keywordIndexStr, pos]) => {
                    const keywordIndex = Number(keywordIndexStr);
                    const label = keywords[keywordIndex];
                    if (!label) return null;
                    return (
                      <span
                        key={`${voterKey}-${keywordIndex}`}
                        style={{
                          position: 'absolute',
                          left: `${pos.x * 100}%`,
                          top: `${pos.y * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          padding: '5px 12px',
                          borderRadius: 999,
                          background: 'rgba(4, 72, 223, 0.55)',
                          color: '#fff',
                          fontFamily: 'var(--font-title)',
                          fontWeight: 700,
                          fontSize: '10pt',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </span>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </SlideStaggerItem>
      </SlideStagger>
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
