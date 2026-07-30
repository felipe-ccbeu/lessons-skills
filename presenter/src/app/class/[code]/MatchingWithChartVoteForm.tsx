'use client';

import { useRef, useState } from 'react';
import { motion } from 'motion/react';

export type MatchingWithChartVoteData = {
  title: string;
  matchLabel: string;
  matchPrompts: string[];
  matchOptions: string[];
};

type Props = { code: string; data: MatchingWithChartVoteData };

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// Same per-browser id used by every other vote form (poll/multipleChoice/qa/
// matchVocabImage) — reused here purely as a stable per-student key so the
// teacher's screen can tally different students' choices separately.
function getVoterKey(): string {
  const stored = localStorage.getItem('voterKey');
  if (stored) return stored;
  const fresh = crypto.randomUUID();
  localStorage.setItem('voterKey', fresh);
  return fresh;
}

// How close (in px) a dropped chip's center must land to a prompt's drop
// zone center for it to "snap" onto that prompt, magnet-style.
const SNAP_RADIUS_PX = 90;

type FloatingChip = { optionIndex: number; x: number; y: number; snapping: boolean };

export function MatchingWithChartVoteForm({ code, data }: Props) {
  // promptIndex -> optionIndex the student currently has placed there.
  // undefined for a prompt = no option assigned yet.
  const [placements, setPlacements] = useState<Record<number, number>>({});
  const dropRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const voterKey = useRef<string | null>(null);
  const draggingRef = useRef<number | null>(null);
  const [floating, setFloating] = useState<FloatingChip | null>(null);

  function sendChoice(promptIndex: number, optionIndex: number) {
    if (!voterKey.current) voterKey.current = getVoterKey();
    fetch(`/api/class/${code}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterKey: voterKey.current, promptIndex, optionIndex }),
    }).catch(() => {});
  }

  function nearestPrompt(clientX: number, clientY: number): { index: number; x: number; y: number } | null {
    let bestIndex: number | null = null;
    let bestDist = Infinity;
    let bestCenter = { x: 0, y: 0 };
    for (const [key, el] of Object.entries(dropRefs.current)) {
      if (!el) continue;
      const box = el.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const dist = Math.hypot(clientX - cx, clientY - cy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = Number(key);
        bestCenter = { x: cx, y: cy };
      }
    }
    if (bestIndex === null || bestDist > SNAP_RADIUS_PX) return null;
    return { index: bestIndex, x: bestCenter.x, y: bestCenter.y };
  }

  function onPointerDown(optionIndex: number, e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = optionIndex;
    setFloating({ optionIndex, x: e.clientX, y: e.clientY, snapping: false });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (draggingRef.current === null) return;
    setFloating({ optionIndex: draggingRef.current, x: e.clientX, y: e.clientY, snapping: false });
  }

  function onPointerUp(e: React.PointerEvent) {
    const optionIndex = draggingRef.current;
    if (optionIndex === null) return;
    draggingRef.current = null;

    const target = nearestPrompt(e.clientX, e.clientY);
    if (!target) {
      setFloating(null); // missed every drop zone — chip returns to tray
      return;
    }

    // Magnet snap: animate the floating chip to the drop zone's exact center,
    // then commit the placement once the animation settles.
    setFloating({ optionIndex, x: target.x, y: target.y, snapping: true });
    setPlacements((prev) => ({ ...prev, [target.index]: optionIndex }));
    sendChoice(target.index, optionIndex);
    setTimeout(() => setFloating(null), 200);
  }

  const placedOptionIndexes = new Set(Object.values(placements));

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.matchLabel && <p style={styles.instruction}>{data.matchLabel}</p>}

      <div style={styles.dropList}>
        {data.matchPrompts.map((prompt, i) => {
          const optionIndex = placements[i];
          return (
            <div
              key={i}
              ref={(el) => {
                dropRefs.current[i] = el;
              }}
              style={styles.dropZone}
            >
              <span style={styles.dropNumber}>{i + 1}</span>
              <span style={styles.dropPrompt}>{prompt}</span>
              {optionIndex !== undefined && (!floating || floating.optionIndex !== optionIndex || !floating.snapping) && (
                <span style={styles.placedChip}>
                  {LETTERS[optionIndex] ?? '?'}. {data.matchOptions[optionIndex]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p style={styles.trayHint}>Arraste a opção certa para o número correspondente:</p>
      <div style={styles.tray}>
        {data.matchOptions.map((opt, i) =>
          placedOptionIndexes.has(i) && floating?.optionIndex !== i ? null : (
            <div
              key={i}
              style={{ ...styles.chip, touchAction: 'none', visibility: floating?.optionIndex === i ? 'hidden' : 'visible' }}
              onPointerDown={(e) => onPointerDown(i, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {LETTERS[i] ?? '?'}. {opt}
            </div>
          )
        )}
      </div>

      {floating && (
        <motion.div
          style={{ ...styles.chip, ...styles.floatingChip }}
          animate={{ left: floating.x, top: floating.y }}
          transition={floating.snapping ? { type: 'spring', stiffness: 400, damping: 28 } : { type: 'tween', duration: 0 }}
        >
          {LETTERS[floating.optionIndex] ?? '?'}. {data.matchOptions[floating.optionIndex]}
        </motion.div>
      )}
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100dvh',
    padding: 24,
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
  },
  title: { fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#1c2027' },
  instruction: { fontSize: 14, color: '#6b7280', margin: '0 0 16px' },
  dropList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  dropZone: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    padding: '10px 14px',
    borderRadius: 12,
    border: '2px dashed #c7cdd6',
    background: '#f7f8fa',
  },
  dropNumber: {
    flex: '0 0 auto',
    fontWeight: 700,
    fontSize: 16,
    color: '#0448df',
  },
  dropPrompt: {
    flex: '1 1 auto',
    fontSize: 15,
    color: '#1c2027',
  },
  placedChip: {
    flex: '0 0 auto',
    padding: '6px 12px',
    borderRadius: 999,
    background: '#0448df',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  trayHint: { fontSize: 13, color: '#6b7280', margin: '20px 0 8px' },
  tray: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
    minHeight: 44,
  },
  chip: {
    padding: '12px 18px',
    borderRadius: 999,
    background: '#e91e8c',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'grab',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  floatingChip: {
    position: 'fixed' as const,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' as const,
    zIndex: 1000,
  },
};
