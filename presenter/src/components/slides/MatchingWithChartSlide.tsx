import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, LayoutOffset, LayoutOverrides, MatchingWithChartData, MatchingWithChartRow, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: MatchingWithChartData;
  onEdit: (patch: Partial<MatchingWithChartData>) => void;
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

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export function MatchingWithChartSlide({
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

  const prompts = data.matchPrompts;
  const options = data.matchOptions;
  const chartRows = data.chartRows;

  const updatePrompt = (i: number, v: string) => onEdit({ matchPrompts: prompts.map((p, idx) => (idx === i ? v : p)) });
  const addPrompt = () => onEdit({ matchPrompts: [...prompts, 'New prompt'] });
  const removePrompt = (i: number) => onEdit({ matchPrompts: prompts.filter((_, idx) => idx !== i) });

  const updateOption = (i: number, v: string) => onEdit({ matchOptions: options.map((o, idx) => (idx === i ? v : o)) });
  const addOption = () => onEdit({ matchOptions: [...options, 'New option'] });
  const removeOption = (i: number) => onEdit({ matchOptions: options.filter((_, idx) => idx !== i) });

  const updateChartRow = (i: number, patch: Partial<MatchingWithChartRow>) =>
    onEdit({ chartRows: chartRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  const addChartRow = () => onEdit({ chartRows: [...chartRows, { label: 'he is', answer: "he's" }] });
  const removeChartRow = (i: number) => onEdit({ chartRows: chartRows.filter((_, idx) => idx !== i) });
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
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: '0 0 auto' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 108, width: 1120 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '22pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <div style={{ position: 'absolute', left: 640, top: 190, width: 1.5, height: 400, background: 'var(--border-hair)' }} />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 190, width: 520 }} {...dragProps('matchColumn')}>
          <SlideStaggerItem disabled={editMode}>
            <Editable
              value={data.matchLabel}
              onChange={(v) => onEdit({ matchLabel: v })}
              editMode={editMode}
              {...answerProps('matchLabel')}
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: '11pt',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ccbeu-pink)',
                marginBottom: 14,
              }}
            />
          </SlideStaggerItem>

          {prompts.map((p, i) => (
            <SlideStaggerItem key={i} disabled={editMode}>
              <div
                className="ex-row"
                style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removePrompt(i)) : undefined}
              >
                <div style={{ flex: '0 0 20px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '13pt', color: 'var(--ccbeu-blue)' }}>
                  {i + 1}
                </div>
                <Editable
                  value={p}
                  onChange={(v) => updatePrompt(i, v)}
                  editMode={editMode}
                  {...answerProps(`matchPrompts.${i}`)}
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover" onClick={() => removePrompt(i)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
          {editMode && (
            <button type="button" className="add-row-btn" onClick={addPrompt}>
              + Adicionar prompt
            </button>
          )}

          <div style={{ height: 14 }} />

          {options.map((o, i) => (
            <SlideStaggerItem key={i} disabled={editMode}>
              <div
                className="ex-row"
                style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeOption(i)) : undefined}
              >
                <div style={{ flex: '0 0 20px', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '13pt', color: 'var(--ccbeu-pink)' }}>
                  {LETTERS[i] ?? '?'}
                </div>
                <Editable
                  value={o}
                  onChange={(v) => updateOption(i, v)}
                  editMode={editMode}
                  {...answerProps(`matchOptions.${i}`)}
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover" onClick={() => removeOption(i)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
          {editMode && (
            <button type="button" className="add-row-btn" onClick={addOption}>
              + Adicionar opção
            </button>
          )}

          {(data.matchAnswerKey || editMode) && (
            <SlideStaggerItem disabled={editMode}>
              <Editable
                value={data.matchAnswerKey}
                onChange={(v) => onEdit({ matchAnswerKey: v })}
                editMode={editMode}
                tag="p"
                {...answerProps('matchAnswerKey')}
                style={{ margin: '14px 0 0', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '11pt', color: 'var(--ccbeu-blue)' }}
              />
            </SlideStaggerItem>
          )}
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 680, top: 190, width: 520 }} {...dragProps('chartColumn')}>
          <SlideStaggerItem disabled={editMode}>
            <Editable
              value={data.chartLabel}
              onChange={(v) => onEdit({ chartLabel: v })}
              editMode={editMode}
              {...answerProps('chartLabel')}
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: '11pt',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ccbeu-pink)',
                marginBottom: 14,
              }}
            />
          </SlideStaggerItem>

          {chartRows.map((row, i) => (
            <SlideStaggerItem key={i} disabled={editMode}>
              <div
                className="ex-row"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 44, borderBottom: '1px solid var(--border-hair)' }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeChartRow(i)) : undefined}
              >
                <Editable
                  value={row.label}
                  onChange={(v) => updateChartRow(i, { label: v })}
                  editMode={editMode}
                  {...answerProps(`chartRows.${i}.label`)}
                  style={{ flex: '0 0 45%', fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}
                />
                <Editable
                  value={row.answer}
                  onChange={(v) => updateChartRow(i, { answer: v })}
                  editMode={editMode}
                  {...answerProps(`chartRows.${i}.answer`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '13pt', color: 'var(--ccbeu-pink)' }}
                />
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover" onClick={() => removeChartRow(i)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
          {editMode && (
            <button type="button" className="add-row-btn" onClick={addChartRow}>
              + Adicionar linha
            </button>
          )}
        </SlideStaggerItem>
      </SlideStagger>

      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
