import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, LayoutOffset, LayoutOverrides, StyleOverrides, TextStyleOverride, WarmupOralTransformData, WarmupOralTransformRow } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: WarmupOralTransformData;
  onEdit: (patch: Partial<WarmupOralTransformData>) => void;
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

export function WarmupOralTransformSlide({
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

  const rows = data.rows;
  const updateRow = (i: number, patch: Partial<WarmupOralTransformRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onEdit({ rows: next });
  };
  const addRow = () => onEdit({ rows: [...rows, { pre: '', answer: 'New', post: 'sentence.' }] });
  const removeRow = (i: number) => onEdit({ rows: rows.filter((_, idx) => idx !== i) });
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const showSubtitle = data.ctaSubtitle.trim() !== '';
  const showBadge = data.timeBadge.trim() !== '';

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
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)', flex: 'none' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...answerProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 108, width: 500 }} {...dragProps('title')}>
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 186, width: 500 }} {...dragProps('instruction')}>
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('instruction')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '15pt',
              color: 'var(--ink)',
            }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 270, width: 500 }} {...dragProps('rows')}>
          {rows.map((row, i) => (
            <SlideStaggerItem key={i} disabled={editMode}>
              <div
                style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(i)) : undefined}
              >
                <span
                  style={{
                    flex: '0 0 auto',
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: 'var(--ccbeu-blue)',
                    color: '#fff',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: '11pt',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: '1 1 auto', display: 'flex', flexWrap: 'wrap', gap: 4, fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)' }}>
                  <Editable value={row.pre} onChange={(v) => updateRow(i, { pre: v })} editMode={editMode} tag="span" {...answerProps(`rows.${i}.pre`)} />
                  <Editable
                    value={row.answer}
                    onChange={(v) => updateRow(i, { answer: v })}
                    editMode={editMode}
                    tag="span"
                    {...answerProps(`rows.${i}.answer`)}
                    style={{ fontWeight: 700, color: 'var(--ccbeu-pink)' }}
                  />
                  <Editable value={row.post} onChange={(v) => updateRow(i, { post: v })} editMode={editMode} tag="span" {...answerProps(`rows.${i}.post`)} />
                </div>
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover linha" onClick={() => removeRow(i)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 720,
            top: 0,
            width: 560,
            height: 720,
            background: 'var(--ccbeu-blue)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            boxSizing: 'border-box',
            padding: '0 60px',
            textAlign: 'center',
          }}
          {...dragProps('ctaBox')}
        >
          <Editable
            value={data.ctaTitle}
            onChange={(v) => onEdit({ ctaTitle: v })}
            editMode={editMode}
            tag="h2"
            {...answerProps('ctaTitle')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '22pt',
              color: '#fff',
            }}
          />
          {(showSubtitle || editMode) && (
            <Editable
              value={data.ctaSubtitle}
              onChange={(v) => onEdit({ ctaSubtitle: v })}
              editMode={editMode}
              tag="p"
              {...answerProps('ctaSubtitle')}
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '13pt',
                color: 'rgba(255,255,255,0.88)',
              }}
            />
          )}
          {(showBadge || editMode) && (
            <Editable
              value={data.timeBadge}
              onChange={(v) => onEdit({ timeBadge: v })}
              editMode={editMode}
              tag="span"
              {...answerProps('timeBadge')}
              style={{
                marginTop: 14,
                background: 'var(--ccbeu-pink)',
                color: '#fff',
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: '11pt',
                borderRadius: 999,
                padding: '8px 22px',
              }}
            />
          )}
        </SlideStaggerItem>
      </SlideStagger>
      {editMode && (
        <button
          type="button"
          className="add-row-btn"
          style={{ position: 'absolute', left: 80, top: 270 + rows.length * 56 + 14 }}
          onClick={addRow}
        >
          + Adicionar frase
        </button>
      )}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 636,
          fontFamily: 'var(--font-body)',
          fontWeight: 400,
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
