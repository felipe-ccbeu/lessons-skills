import { Editable } from '@/components/ui/Editable';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, CompleteTheChartData, CompleteTheChartGroup, CompleteTheChartRow, LayoutOffset, LayoutOverrides, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

type Props = {
  data: CompleteTheChartData;
  onEdit: (patch: Partial<CompleteTheChartData>) => void;
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

const ROW_H = 40;

export function CompleteTheChartSlide({
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

  const updateGroup = (groupKey: 'group1' | 'group2', patch: Partial<CompleteTheChartGroup>) => {
    onEdit({ [groupKey]: { ...data[groupKey], ...patch } });
  };
  const updateRow = (groupKey: 'group1' | 'group2', i: number, patch: Partial<CompleteTheChartRow>) => {
    const group = data[groupKey];
    const rows = group.rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    updateGroup(groupKey, { rows });
  };
  const addRow = (groupKey: 'group1' | 'group2') => {
    const group = data[groupKey];
    updateGroup(groupKey, { rows: [...group.rows, { sentence: 'New sentence', answer: 'answer' }] });
  };
  const removeRow = (groupKey: 'group1' | 'group2', i: number) => {
    const group = data[groupKey];
    updateGroup(groupKey, { rows: group.rows.filter((_, idx) => idx !== i) });
  };
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const groupTop = { group1: 210, group2: 380 };

  const renderGroup = (groupKey: 'group1' | 'group2') => {
    const group = data[groupKey];
    const top = groupTop[groupKey];
    return (
      <SlideStaggerItem
        key={groupKey}
        disabled={editMode}
        style={{
          position: 'absolute',
          left: 80,
          top,
          width: 333,
          border: '1px solid var(--border-hair)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
        {...dragProps(groupKey)}
      >
        <div
          style={{
            height: 40,
            background: 'var(--ccbeu-blue)',
            color: '#fff',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: '15pt',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
          }}
        >
          <Editable
            value={group.label}
            onChange={(v) => updateGroup(groupKey, { label: v })}
            editMode={editMode}
            {...answerProps(`${groupKey}.label`)}
            style={{ color: '#fff' }}
          />
        </div>
        {group.rows.map((row, i) => (
          <div
            key={i}
            className="ex-row"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              height: ROW_H,
              padding: '0 16px',
              boxSizing: 'border-box',
              background: i % 2 === 0 ? '#fff' : 'var(--surface-zebra, #f5f7fa)',
              fontFamily: 'var(--font-body)',
              fontSize: '11pt',
              color: 'var(--ink)',
            }}
            onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(groupKey, i)) : undefined}
          >
            <Editable
              value={row.sentence}
              onChange={(v) => updateRow(groupKey, i, { sentence: v })}
              editMode={editMode}
              tag="span"
              {...answerProps(`${groupKey}.rows.${i}.sentence`)}
            />
            <span>&nbsp;(=&nbsp;</span>
            <Editable
              value={row.answer}
              onChange={(v) => updateRow(groupKey, i, { answer: v })}
              editMode={editMode}
              tag="span"
              {...answerProps(`${groupKey}.rows.${i}.answer`)}
              style={{ fontWeight: 700, color: 'var(--ccbeu-pink)' }}
            />
            <span>)</span>
            {editMode && (
              <div className="row-controls">
                <button type="button" className="row-btn remove" title="Remover linha" onClick={() => removeRow(groupKey, i)}>
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
        {editMode && (
          <button type="button" className="add-row-btn" style={{ margin: 10 }} onClick={() => addRow(groupKey)}>
            + Adicionar linha
          </button>
        )}
      </SlideStaggerItem>
    );
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

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124, width: 587 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '24pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        {renderGroup('group1')}
        {renderGroup('group2')}

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 851,
            top: 143,
            width: 333,
            height: 138,
            background: '#f4f6f9',
            border: '1px dashed #C5CCDA',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: '9pt',
            letterSpacing: '0.06em',
            color: '#9AA1AC',
          }}
          {...dragProps('imagePlaceholder1')}
        >
          IMAGE
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 1159, top: 150, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ink)' }}
        >
          1
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 853,
            top: 304,
            width: 333,
            height: 138,
            background: '#f4f6f9',
            border: '1px dashed #C5CCDA',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: '9pt',
            letterSpacing: '0.06em',
            color: '#9AA1AC',
          }}
          {...dragProps('imagePlaceholder2')}
        >
          IMAGE
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 1163, top: 312, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ink)' }}
        >
          2
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 852,
            top: 459,
            width: 333,
            height: 130,
            background: '#f4f6f9',
            border: '1px dashed #C5CCDA',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: '9pt',
            letterSpacing: '0.06em',
            color: '#9AA1AC',
          }}
          {...dragProps('imagePlaceholder3')}
        >
          IMAGE
        </SlideStaggerItem>
        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 1163, top: 468, fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ink)' }}
        >
          3
        </SlideStaggerItem>
      </SlideStagger>
      <div style={{ position: 'absolute', left: 80, top: 636, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-footer)' }}>
        CCBEU English Center
      </div>
      {menuElement}
    </div>
  );
}
