import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { GroupedFlagChartColumn, GroupedFlagChartGroup, GroupedFlagChartRow } from '@/lib/types';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

const COL_LEFT = [80, 660];

export function GroupedFlagChartSlide(props: SlideRenderProps<'groupedFlagChart'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('groupedFlagChart', props);
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const updateColumn = (ci: number, next: GroupedFlagChartColumn) => {
    const columns = [...data.columns] as typeof data.columns;
    columns[ci] = next;
    onEdit({ columns });
  };

  const updateGroup = (ci: number, gi: number, patch: Partial<GroupedFlagChartGroup>) => {
    const col = data.columns[ci];
    const groups = col.groups.map((g, idx) => (idx === gi ? { ...g, ...patch } : g));
    updateColumn(ci, { groups });
  };

  const updateRow = (ci: number, gi: number, ri: number, patch: Partial<GroupedFlagChartRow>) => {
    const col = data.columns[ci];
    const groups = col.groups.map((g, idx) => (idx === gi ? { ...g, rows: g.rows.map((r, ridx) => (ridx === ri ? { ...r, ...patch } : r)) } : g));
    updateColumn(ci, { groups });
  };

  const removeRow = (ci: number, gi: number, ri: number) => {
    const col = data.columns[ci];
    const groups = col.groups.map((g, idx) => (idx === gi ? { ...g, rows: g.rows.filter((_, ridx) => ridx !== ri) } : g));
    updateColumn(ci, { groups });
  };

  const addRow = (ci: number, gi: number) => {
    const col = data.columns[ci];
    const groups = col.groups.map((g, idx) => (idx === gi ? { ...g, rows: [...g.rows, { imageUrl: '', term: 'Country', answer: 'Nationality' }] } : g));
    updateColumn(ci, { groups });
  };

  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
        />

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 112, width: 1120 }} {...dragProps('title')}>
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '20pt', color: 'var(--ccbeu-blue)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 168, width: 1120 }} {...dragProps('instruction')}>
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="p"
            {...answerProps('instruction')}
            style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '9pt', color: 'var(--ink-strong)' }}
          />
        </SlideStaggerItem>

        {data.columns.map((col, ci) => (
          <SlideStaggerItem
            key={ci}
            disabled={editMode}
            style={{
              position: 'absolute',
              left: COL_LEFT[ci],
              top: 200,
              width: 480,
              border: '1px solid var(--border-hair)',
              borderRadius: 6,
              overflow: 'hidden',
              fontFamily: 'var(--font-body)',
              fontSize: '8pt',
            }}
            {...dragProps(`column${ci}`)}
          >
            <div style={{ display: 'flex', background: 'var(--ccbeu-blue)', color: '#fff', fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '8pt' }}>
              <div style={{ flex: 1, padding: '8px 10px' }}>
                <Editable
                  value={ci === 0 ? data.columnHeader1 : data.columnHeader2}
                  onChange={(v) => onEdit(ci === 0 ? { columnHeader1: v } : { columnHeader2: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(ci === 0 ? 'columnHeader1' : 'columnHeader2')}
                />
              </div>
              <div style={{ flex: 1, padding: '8px 10px', borderLeft: '1px solid rgba(255,255,255,0.25)' }}>Nationality</div>
            </div>

            {col.groups.map((group, gi) => (
              <div key={gi}>
                <div
                  className="ex-row"
                  style={{ position: 'relative', background: 'var(--tint-blue-bubble)', padding: '5px 10px', borderTop: gi === 0 ? undefined : '1px solid var(--border-hair)' }}
                  onContextMenu={editMode ? (e) => openOnContextMenu(e, () => {}) : undefined}
                >
                  <Editable
                    value={group.label}
                    onChange={(v) => updateGroup(ci, gi, { label: v })}
                    editMode={editMode}
                    tag="span"
                    {...answerProps(`columns.${ci}.groups.${gi}.label`)}
                    style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontStyle: 'italic', color: 'var(--ccbeu-blue)' }}
                  />
                </div>
                {group.rows.map((row, ri) => (
                  <div
                    key={ri}
                    className="ex-row"
                    style={{ position: 'relative', display: 'flex', borderTop: '1px solid var(--border-hair)', background: ri % 2 === 1 ? 'var(--surface-zebra)' : undefined }}
                    onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeRow(ci, gi, ri)) : undefined}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', minWidth: 0 }}>
                      <ImageSlot
                        url={row.imageUrl}
                        onChange={(v) => updateRow(ci, gi, ri, { imageUrl: v })}
                        editMode={editMode}
                        style={{ width: 30, height: 20, borderRadius: 2, flex: '0 0 auto' }}
                      />
                      <Editable
                        value={row.term}
                        onChange={(v) => updateRow(ci, gi, ri, { term: v })}
                        editMode={editMode}
                        tag="span"
                        {...answerProps(`columns.${ci}.groups.${gi}.rows.${ri}.term`)}
                        style={{ color: 'var(--ink)' }}
                      />
                    </div>
                    <div style={{ flex: 1, padding: '5px 10px', borderLeft: '1px solid var(--border-hair)' }}>
                      <Editable
                        value={row.answer}
                        onChange={(v) => updateRow(ci, gi, ri, { answer: v })}
                        editMode={editMode}
                        tag="span"
                        {...answerProps(`columns.${ci}.groups.${gi}.rows.${ri}.answer`)}
                        style={{ color: 'var(--ink-strong)' }}
                      />
                    </div>
                    {editMode && (
                      <div className="row-controls">
                        <button type="button" className="row-btn remove" title="Remover linha" onClick={() => removeRow(ci, gi, ri)}>
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {editMode && (
                  <button type="button" className="add-row-btn" style={{ position: 'static', margin: '6px 10px' }} onClick={() => addRow(ci, gi)}>
                    + Adicionar país
                  </button>
                )}
              </div>
            ))}
          </SlideStaggerItem>
        ))}
      </SlideStagger>
      <SlideFooter />
      {menuElement}
    </SlideRoot>
  );
}
