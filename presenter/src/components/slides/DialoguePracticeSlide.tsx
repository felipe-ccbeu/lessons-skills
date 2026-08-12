import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { DialoguePracticeLine } from '@/lib/types';
import { SlideRenderProps, slideFieldProps, SlideRoot, SlideBreadcrumb, SlideFooter } from './slideKit';

/** A dialogue line's text is a plain string with `**hl**` marking the highlighted (pink) words. */
function partsToText(parts: DialoguePracticeLine['textParts']): string {
  return parts.map((p) => (typeof p === 'string' ? p : `**${p.hl}**`)).join('');
}
function textToParts(text: string): DialoguePracticeLine['textParts'] {
  const parts: DialoguePracticeLine['textParts'] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ hl: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function DialoguePracticeSlide(props: SlideRenderProps<'dialoguePractice'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('dialoguePractice', props);
  const { openOnContextMenu, menuElement } = useRemoveItemMenu();

  const wordBank = data.wordBank;
  const updateWord = (i: number, v: string) => onEdit({ wordBank: wordBank.map((w, idx) => (idx === i ? v : w)) });
  const addWord = () => onEdit({ wordBank: [...wordBank, 'word'] });
  const removeWord = (i: number) => onEdit({ wordBank: wordBank.filter((_, idx) => idx !== i) });

  const lines = data.lines;
  const updateLine = (i: number, patch: Partial<DialoguePracticeLine>) => onEdit({ lines: lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const addLine = () => onEdit({ lines: [...lines, { speaker: 'A', textParts: ['New line.'] }] });
  const removeLine = (i: number) => onEdit({ lines: lines.filter((_, idx) => idx !== i) });

  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
        />

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 108, width: 1120, display: 'flex', alignItems: 'center', gap: 12 }}
          {...dragProps('title')}
        >
          <Icon name="record_voice_over" size={28} style={{ color: 'var(--ccbeu-blue)' }} />
          <Editable
            value={data.title}
            onChange={(v) => onEdit({ title: v })}
            editMode={editMode}
            tag="h1"
            {...answerProps('title')}
            style={{ margin: 0, fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '20pt', color: 'var(--ccbeu-blue)', lineHeight: 1.25 }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 172, width: 1060, display: 'flex', alignItems: 'center', gap: 10 }}
          {...dragProps('instruction')}
        >
          <Icon name="headphones" size={18} style={{ color: 'var(--ink-strong)' }} />
          <Editable
            value={data.instruction}
            onChange={(v) => onEdit({ instruction: v })}
            editMode={editMode}
            tag="span"
            {...answerProps('instruction')}
            style={{ fontFamily: 'var(--font-body)', fontSize: '11pt', color: 'var(--ink-strong)' }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{
            position: 'absolute',
            left: 80,
            top: 212,
            width: 565,
            minHeight: 50,
            background: 'var(--tint-blue-bubble)',
            borderRadius: 10,
            padding: '12px 20px',
            boxSizing: 'border-box',
            display: 'flex',
            gap: 26,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
          {...dragProps('wordBank')}
        >
          {wordBank.map((word, i) => (
            <span key={i} style={{ position: 'relative' }} onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeWord(i)) : undefined}>
              <Editable
                value={word}
                onChange={(v) => updateWord(i, v)}
                editMode={editMode}
                tag="span"
                {...answerProps(`wordBank.${i}`)}
                style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '13pt', color: 'var(--ccbeu-blue)' }}
              />
              {editMode && (
                <button type="button" className="row-btn remove" title="Remover palavra" onClick={() => removeWord(i)} style={{ marginLeft: 4 }}>
                  <Icon name="close" size={12} />
                </button>
              )}
            </span>
          ))}
          {editMode && (
            <button type="button" className="row-btn" title="Adicionar palavra" onClick={addWord}>
              <Icon name="add" size={14} />
            </button>
          )}
        </SlideStaggerItem>

        <SlideStaggerItem
          disabled={editMode}
          style={{ position: 'absolute', left: 80, top: 280, width: 1060, display: 'flex', flexDirection: 'column', gap: 9 }}
          {...dragProps('lines')}
        >
          {lines.map((line, i) => (
            <SlideStaggerItem key={i} disabled={editMode} {...dragProps(`lines.${i}`)}>
              <div
                className="ex-row"
                style={{ position: 'relative', display: 'flex', gap: 0, fontFamily: 'var(--font-body)', fontSize: '13pt', color: 'var(--ink)', lineHeight: 1.35 }}
                onContextMenu={editMode ? (e) => openOnContextMenu(e, () => removeLine(i)) : undefined}
              >
                <Editable
                  value={line.speaker}
                  onChange={(v) => updateLine(i, { speaker: v })}
                  editMode={editMode}
                  tag="span"
                  {...answerProps(`lines.${i}.speaker`)}
                  style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ink-strong)', minWidth: 64 }}
                />
                {editMode ? (
                  <Editable
                    value={partsToText(line.textParts)}
                    onChange={(v) => updateLine(i, { textParts: textToParts(v) })}
                    editMode={editMode}
                    tag="span"
                    {...answerProps(`lines.${i}.textParts`)}
                  />
                ) : (
                  <span>
                    {line.textParts.map((part, pi) =>
                      typeof part === 'string' ? (
                        <span key={pi}>{part}</span>
                      ) : (
                        <b key={pi} style={{ fontFamily: 'var(--font-title)', fontWeight: 700, color: 'var(--ccbeu-pink)' }}>
                          {part.hl}
                        </b>
                      )
                    )}
                  </span>
                )}
                {editMode && (
                  <div className="row-controls">
                    <button type="button" className="row-btn remove" title="Remover fala" onClick={() => removeLine(i)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                )}
              </div>
            </SlideStaggerItem>
          ))}
        </SlideStaggerItem>
      </SlideStagger>
      {editMode && (
        <button
          type="button"
          className="add-row-btn"
          style={{ position: 'absolute', left: 80, top: 280 + lines.length * 28 + 14 }}
          onClick={addLine}
        >
          + Adicionar fala
        </button>
      )}
      <SlideFooter />
      {menuElement}
    </SlideRoot>
  );
}
