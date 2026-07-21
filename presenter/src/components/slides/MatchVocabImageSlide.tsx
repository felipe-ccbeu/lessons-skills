import { Editable } from '@/components/ui/Editable';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { MatchVocabImageData, StyleOverrides, TextStyleOverride } from '@/lib/types';

type Props = {
  data: MatchVocabImageData;
  onEdit: (patch: Partial<MatchVocabImageData>) => void;
  editMode: boolean;
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
};

export function MatchVocabImageSlide({
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

  const keywords = data.keywords;
  const answers = data.answers;

  const updateKeyword = (i: number, v: string) => onEdit({ keywords: keywords.map((k, idx) => (idx === i ? v : k)) });
  const addKeyword = () => onEdit({ keywords: [...keywords, 'word'] });
  const removeKeyword = (i: number) => onEdit({ keywords: keywords.filter((_, idx) => idx !== i) });

  const updateAnswer = (i: number, v: string) => onEdit({ answers: answers.map((a, idx) => (idx === i ? v : a)) });
  const addAnswer = () => onEdit({ answers: [...answers, 'answer'] });
  const removeAnswer = (i: number) => onEdit({ answers: answers.filter((_, idx) => idx !== i) });
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 81, top: 124, width: 587 }}>
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
        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 129, top: 181, width: 900 }}>
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('instruction')}
            style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '14pt', color: 'var(--ink)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 230, width: 1120, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {keywords.map((kw, i) => (
            <div
              key={i}
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
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
          {editMode && (
            <button type="button" className="add-row-btn" onClick={addKeyword}>
              + Adicionar palavra
            </button>
          )}
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 76, top: 290, width: 847, height: 318 }}>
          <ImageSlot
            url={data.imageUrl}
            onChange={(v) => onEdit({ imageUrl: v })}
            editMode={editMode}
            style={{ width: 847, height: 318, borderRadius: 6 }}
          />
        </SlideStaggerItem>

        {answers.length > 0 && (
          <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 960, top: 320, width: 240, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {answers.map((ans, i) => (
              <div
                key={i}
                className="ex-row"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeAnswer(i)) : undefined}
              >
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ccbeu-blue)' }}>{i + 1}</span>
                <Editable
                  value={ans}
                  onChange={(v) => updateAnswer(i, v)}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`answers.${i}`)}
                  style={{
                    background: '#F2F5FF',
                    borderRadius: 999,
                    padding: '7px 18px',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: '11pt',
                    color: 'var(--ccbeu-pink)',
                  }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover resposta" onClick={() => removeAnswer(i)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
            {editMode && (
              <button type="button" className="add-row-btn" onClick={addAnswer}>
                + Adicionar resposta
              </button>
            )}
          </SlideStaggerItem>
        )}
        {editMode && answers.length === 0 && (
          <button type="button" className="add-row-btn" style={{ position: 'absolute', left: 960, top: 320 }} onClick={addAnswer}>
            + Adicionar resposta
          </button>
        )}
      </SlideStagger>
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
