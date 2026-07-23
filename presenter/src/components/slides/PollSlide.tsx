'use client';

import { motion } from 'motion/react';
import type { MouseEvent } from 'react';
import { Editable } from '@/components/ui/Editable';
import { Icon } from '@/components/ui/Icon';
import { SlideStagger, SlideStaggerItem } from '@/components/ui/SlideStagger';
import { useRemoveItemMenu } from '@/components/ui/useRemoveItemMenu';
import { BlockAnimations, LayoutOffset, LayoutOverrides, PollData, PollOptionDraft, StyleOverrides, TextStyleOverride } from '@/lib/types';
import { BlockAnimationId } from '@/lib/blockEntranceAnimations';

export type PollLiveResults = {
  code: string;
  joinUrl: string;
  qrDataUrl: string | null;
  tallies: Record<string, number>;
  total: number;
};

type Props = {
  data: PollData;
  onEdit: (patch: Partial<PollData>) => void;
  editMode: boolean;
  // Answer-reveal props are accepted for RENDERERS-shape compatibility but
  // meaningless here — a poll has no "correct answer" to hide/reveal.
  answerFields?: string[];
  onToggleAnswerField?: (key: string) => void;
  revealAnswers?: boolean;
  // Only present when presenting live (never during editing/thumbnails).
  liveResults?: PollLiveResults;
  onStartVoting?: () => void;
  styleOverrides?: StyleOverrides;
  onStyleFieldChange?: (key: string, patch: TextStyleOverride | null) => void;
  layoutOverrides?: LayoutOverrides;
  onLayoutOffsetChange?: (key: string, offset: LayoutOffset) => void;
  stageScale?: number;
  blockAnimations?: BlockAnimations;
  onBlockAnimationChange?: (key: string, animation: BlockAnimationId) => void;
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

export function PollSlide({
  data,
  onEdit,
  editMode,
  liveResults,
  onStartVoting,
  styleOverrides = {},
  onStyleFieldChange,
  layoutOverrides = {},
  onLayoutOffsetChange,
  stageScale = 1,
  blockAnimations = {},
  onBlockAnimationChange,
}: Props) {
  const options = data.options;
  const dragProps = (key: string) => ({
    dragKey: key,
    editMode,
    layoutOffset: layoutOverrides[key],
    onLayoutOffsetChange,
    stageScale,
    blockAnimation: blockAnimations[key],
    onBlockAnimationChange,
    template: 'poll' as const,
  });
  const styleProps = (key: string) => ({
    styleOverride: styleOverrides[key],
    onStyleChange: onStyleFieldChange ? (patch: TextStyleOverride | null) => onStyleFieldChange(key, patch) : undefined,
  });

  const updateOption = (i: number, label: string) => {
    const next = options.map((o, idx) => (idx === i ? { ...o, label } : o));
    onEdit({ options: next });
  };
  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    onEdit({ options: [...options, { id: `opt-${Date.now()}`, label: 'New option' }] });
  };
  const removeOption = (i: number) => {
    if (options.length <= MIN_OPTIONS) return;
    onEdit({ options: options.filter((_, idx) => idx !== i) });
  };
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
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />
          <Editable value={data.breadcrumb} onChange={(v) => onEdit({ breadcrumb: v })} editMode={editMode} {...styleProps('breadcrumb')} />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 124, width: 700 }} {...dragProps('question')}>
          <Editable
            value={data.question}
            onChange={(v) => onEdit({ question: v })}
            editMode={editMode}
            tag="h1"
            {...styleProps('question')}
            style={{
              margin: 0,
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '28pt',
              lineHeight: 1.25,
              color: 'var(--ccbeu-blue)',
            }}
          />
        </SlideStaggerItem>

        <SlideStaggerItem disabled={editMode} style={{ position: 'absolute', left: 80, top: 260, width: 700 }} {...dragProps('options')}>
          {options.map((opt, i) => (
            <SlideStaggerItem key={opt.id} disabled={editMode} style={{ marginBottom: 16 }} {...dragProps(`options.${i}`)}>
              <PollOptionBar
                option={opt}
                editMode={editMode}
                count={liveResults?.tallies[opt.id] ?? 0}
                total={liveResults?.total ?? 0}
                showResults={!!liveResults}
                onChangeLabel={(v) => updateOption(i, v)}
                onRemove={options.length > MIN_OPTIONS ? () => removeOption(i) : undefined}
                onContextMenu={editMode && options.length > MIN_OPTIONS ? (e) => openOnContextMenu(e, () => removeOption(i)) : undefined}
                {...styleProps(`options.${i}.label`)}
              />
            </SlideStaggerItem>
          ))}
        </SlideStaggerItem>

        {editMode && options.length < MAX_OPTIONS && (
          <button
            type="button"
            className="add-row-btn"
            style={{ position: 'absolute', left: 80, top: 260 + options.length * 66 + 8 }}
            onClick={addOption}
          >
            + Adicionar opção
          </button>
        )}
      </SlideStagger>

      {!editMode && liveResults && (
        <div
          style={{
            position: 'absolute',
            right: 70,
            top: 90,
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {!liveResults.qrDataUrl ? (
            onStartVoting && (
              <button type="button" className="btn primary" onClick={onStartVoting}>
                <Icon name="play_arrow" size={15} /> Iniciar votação
              </button>
            )
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={liveResults.qrDataUrl}
                alt="QR code para votar"
                width={220}
                height={220}
                style={{ borderRadius: 12, border: '1px solid var(--border-hair)' }}
              />
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '11pt', color: 'var(--ink-muted)' }}>
                Código: <strong style={{ color: 'var(--ccbeu-blue)' }}>{liveResults.code}</strong>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '10pt', color: 'var(--ink-footer)' }}>
                {liveResults.total} {liveResults.total === 1 ? 'resposta' : 'respostas'}
              </div>
            </>
          )}
        </div>
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

type PollOptionBarProps = {
  option: PollOptionDraft;
  editMode: boolean;
  count: number;
  total: number;
  showResults: boolean;
  onChangeLabel: (v: string) => void;
  onRemove?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  styleOverride?: TextStyleOverride;
  onStyleChange?: (patch: TextStyleOverride | null) => void;
};

function PollOptionBar({
  option,
  editMode,
  count,
  total,
  showResults,
  onChangeLabel,
  onRemove,
  onContextMenu,
  styleOverride,
  onStyleChange,
}: PollOptionBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={{ position: 'relative' }} onContextMenu={onContextMenu}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: 50,
          border: '1px solid var(--border-hair)',
          borderRadius: 10,
          overflow: 'hidden',
          background: '#fafbfc',
        }}
      >
        {showResults && (
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{
              position: 'absolute',
              inset: 0,
              width: 0,
              background: 'linear-gradient(90deg, rgba(4,72,223,0.16), rgba(253,54,130,0.16))',
            }}
          />
        )}
        <Editable
          value={option.label}
          onChange={onChangeLabel}
          editMode={editMode}
          styleOverride={styleOverride}
          onStyleChange={onStyleChange}
          style={{
            position: 'relative',
            padding: '0 16px',
            fontFamily: 'var(--font-body)',
            fontSize: '13pt',
            color: 'var(--ink)',
            lineHeight: '50px',
          }}
        />
        {showResults && (
          <div
            style={{
              marginLeft: 'auto',
              padding: '0 16px',
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: '12pt',
              color: 'var(--ccbeu-blue)',
            }}
          >
            {pct}%
          </div>
        )}
      </div>
      {editMode && onRemove && (
        <div className="row-controls">
          <button type="button" className="row-btn remove" title="Remover opção" onClick={onRemove}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
