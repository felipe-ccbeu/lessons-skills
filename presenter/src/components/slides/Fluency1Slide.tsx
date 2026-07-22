import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, Fluency1Data, Fluency1Question, LayoutOffset, LayoutOverrides, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: Fluency1Data;
  onEdit: (patch: Partial<Fluency1Data>) => void;
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

export function Fluency1Slide({
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

  const questions = data.questions;
  const splitAt = Math.ceil(questions.length / 2);
  const leftQuestions = questions.slice(0, splitAt);
  const rightQuestions = questions.slice(splitAt);

  const updateQuestion = (i: number, value: string) => {
    const next = questions.map((q, idx) => {
      if (idx !== i) return q;
      return typeof q === 'string' ? value : { pre: value };
    });
    onEdit({ questions: next });
  };
  const addQuestion = () => onEdit({ questions: [...questions, 'New question?'] });
  const removeQuestion = (i: number) => onEdit({ questions: questions.filter((_, idx) => idx !== i) });
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const renderColumn = (col: Fluency1Question[], offset: number) =>
    col.map((q, colIdx) => {
      const i = offset + colIdx;
      const isBlank = typeof q !== 'string';
      const value = typeof q === 'string' ? q : q.pre;
      return (
        <SlideStaggerItem key={i} disabled={editMode}>
          <div
            style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}
            onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeQuestion(i)) : undefined}
          >
            <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-blue)', marginTop: 8, flex: '0 0 auto' }} />
            <div style={{ flex: '1 1 auto', display: 'flex', gap: 4, flexWrap: 'wrap', fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}>
              <Editable
                value={value}
                onChange={(v) => updateQuestion(i, v)}
                editMode={editMode}
                tag="span"
                {...answerProps(`questions.${i}`)}
              />
              {isBlank && (
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ borderBottom: '2px solid var(--ccbeu-pink)', width: 90, display: 'inline-block' }} />
                  <span>.</span>
                </span>
              )}
            </div>
            {editMode && (
              <div className="row-controls">
                <button type="button" className="row-btn remove" title="Remover pergunta" onClick={() => removeQuestion(i)}>
                  ✕
                </button>
              </div>
            )}
          </div>
        </SlideStaggerItem>
      );
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
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124, width: 835 }} {...dragProps('title')}>
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
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 210, width: 835 }} {...dragProps('instruction')}>
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('instruction')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '13pt',
              color: 'var(--ink)',
            }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 290, width: 520 }} {...dragProps('leftColumn')}>
          {renderColumn(leftQuestions, 0)}
        </SlideStaggerItem>
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 680, top: 290, width: 520 }} {...dragProps('rightColumn')}>
          {renderColumn(rightQuestions, splitAt)}
        </SlideStaggerItem>
      </SlideStagger>
      {editMode && (
        <button
          type="button"
          className="add-row-btn"
          style={{ position: 'absolute', left: 80, top: 290 + leftQuestions.length * 48 + 14 }}
          onClick={addQuestion}
        >
          + Adicionar pergunta
        </button>
      )}
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
      {menuElement}
    </div>
  );
}
