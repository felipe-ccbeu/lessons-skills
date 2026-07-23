import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, LayoutOffset, LayoutOverrides, LessonCompleteData, LessonCompleteTerm, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: LessonCompleteData;
  onEdit: (patch: Partial<LessonCompleteData>) => void;
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

const BASE_TERMS = 4;
const BASE_TERM_H = 56;
const BASE_FONT = 13;
const MIN_FONT = 9;
const MIN_TERM_H = 32;
const BAND_H = 620 - 311;
const COL_W = 240;
const COL_GAP = 50;

export function LessonCompleteSlide({
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
    template: 'lessonComplete' as const,
  });
  const answerProps = (key: string) => ({
    answer: answerFields.includes(key),
    revealed: revealAnswers,
    onToggleAnswer: onToggleAnswerField ? () => onToggleAnswerField(key) : undefined,
    styleOverride: styleOverrides[key],
    onStyleChange: onStyleFieldChange ? (patch: TextStyleOverride | null) => onStyleFieldChange(key, patch) : undefined,
  });

  const columns = data.columns;
  const maxTerms = columns.reduce((max, c) => Math.max(max, c.terms.length), 0);
  const termH = maxTerms <= BASE_TERMS ? BASE_TERM_H : Math.max(MIN_TERM_H, Math.floor(BAND_H / maxTerms));
  const fontPt =
    maxTerms <= BASE_TERMS
      ? BASE_FONT
      : Math.max(MIN_FONT, Math.min(BASE_FONT, Math.round(BASE_FONT * (termH / BASE_TERM_H))));

  const updateColumn = (ci: number, patch: Partial<(typeof columns)[number]>) => {
    onEdit({ columns: columns.map((c, idx) => (idx === ci ? { ...c, ...patch } : c)) });
  };
  const updateTerm = (ci: number, ti: number, patch: Partial<LessonCompleteTerm>) => {
    const col = columns[ci];
    const nextTerms = col.terms.map((t, idx) => (idx === ti ? { ...t, ...patch } : t));
    updateColumn(ci, { terms: nextTerms });
  };
  const addTerm = (ci: number) => {
    const col = columns[ci];
    updateColumn(ci, { terms: [...col.terms, { t: 'New', d: 'gloss.' }] });
  };
  const removeTerm = (ci: number, ti: number) => {
    const col = columns[ci];
    updateColumn(ci, { terms: col.terms.filter((_, idx) => idx !== ti) });
  };
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

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
          <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 217, width: 1085 }} {...dragProps('title')}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '32pt',
              color: '#fff',
            }}
          >
            Lesson Complete!
          </h1>
        </SlideStaggerItem>

        {columns.map((col, ci) => (
          <SlideStaggerItem
            key={ci}
            disabled={editMode}
            style={{ position: 'absolute', left: 80 + ci * (COL_W + COL_GAP), top: 311, width: COL_W }}
            {...dragProps(`column${ci}`)}
          >
            <SlideStaggerItem disabled={editMode}>
              <Editable
                value={col.header}
                onChange={(v) => updateColumn(ci, { header: v })}
                editMode={editMode}
                {...answerProps(`columns.${ci}.header`)}
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: '10pt',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ccbeu-pink)',
                  marginBottom: 12,
                }}
              />
            </SlideStaggerItem>
            {col.terms.map((term, ti) => (
              <SlideStaggerItem key={ti} disabled={editMode} {...dragProps(`column${ci}.terms.${ti}`)}>
                <div
                  className="ex-row"
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: termH }}
                  onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeTerm(ci, ti)) : undefined}
                >
                  <Editable
                    value={term.t}
                    onChange={(v) => updateTerm(ci, ti, { t: v })}
                    editMode={editMode}
                    tag="span"
                    {...answerProps(`columns.${ci}.terms.${ti}.t`)}
                    style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: `${fontPt}pt`, color: '#fff', marginRight: 6 }}
                  />
                  <Editable
                    value={term.d}
                    onChange={(v) => updateTerm(ci, ti, { d: v })}
                    editMode={editMode}
                    tag="span"
                    {...answerProps(`columns.${ci}.terms.${ti}.d`)}
                    style={{ fontFamily: 'var(--font-body)', fontSize: `${fontPt}pt`, color: 'rgba(255,255,255,0.85)' }}
                  />
                  {editMode && (
                    <div className="row-controls">
                      <button type="button" className="row-btn remove" title="Remover termo" onClick={() => removeTerm(ci, ti)}>
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </SlideStaggerItem>
            ))}
            {editMode && (
              <button type="button" className="add-row-btn" onClick={() => addTerm(ci)}>
                + Adicionar termo
              </button>
            )}
          </SlideStaggerItem>
        ))}
      </SlideStagger>

      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'rgba(255,255,255,0.72)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
