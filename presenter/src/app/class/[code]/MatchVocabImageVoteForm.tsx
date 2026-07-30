'use client';

import { useRef, useState } from 'react';

export type MatchVocabImageVoteData = {
  title: string;
  instruction: string;
  keywords: string[];
  imageUrl: string;
};

type Props = { code: string; data: MatchVocabImageVoteData };

// Same per-browser id used by every other vote form (poll/multipleChoice/qa) —
// reused here purely as a stable per-student key so the teacher's screen can
// tell different students' guesses apart, not for any dedupe/grading logic
// (there's no right/wrong answer to grade against, see MatchVocabImageSlide).
function getVoterKey(): string {
  const stored = localStorage.getItem('voterKey');
  if (stored) return stored;
  const fresh = crypto.randomUUID();
  localStorage.setItem('voterKey', fresh);
  return fresh;
}

// Throttles position updates sent to the server while a keyword is actively
// being dragged — pointermove fires far more often than the network (or the
// teacher's screen) needs.
const DRAG_SEND_INTERVAL_MS = 120;

export function MatchVocabImageVoteForm({ code, data }: Props) {
  const imageRef = useRef<HTMLDivElement>(null);
  // Where each keyword currently sits, 0..1 relative to the image box.
  // undefined = not yet placed, still in the word tray below the image.
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const draggingIndex = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const voterKey = useRef<string | null>(null);

  function sendPosition(keywordIndex: number, x: number, y: number) {
    if (!voterKey.current) voterKey.current = getVoterKey();
    fetch(`/api/class/${code}/drag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterKey: voterKey.current, keywordIndex, x, y }),
    }).catch(() => {});
  }

  function clampToImage(clientX: number, clientY: number): { x: number; y: number } {
    const box = imageRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 0.5, y: 0.5 };
    const x = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (clientY - box.top) / box.height));
    return { x, y };
  }

  function onPointerDown(index: number, e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingIndex.current = index;
    const point = clampToImage(e.clientX, e.clientY);
    setPositions((prev) => ({ ...prev, [index]: point }));
  }

  function onPointerMove(e: React.PointerEvent) {
    const index = draggingIndex.current;
    if (index === null) return;
    const point = clampToImage(e.clientX, e.clientY);
    setPositions((prev) => ({ ...prev, [index]: point }));

    const now = Date.now();
    if (now - lastSentAt.current < DRAG_SEND_INTERVAL_MS) return;
    lastSentAt.current = now;
    sendPosition(index, point.x, point.y);
  }

  function onPointerUp(e: React.PointerEvent) {
    const index = draggingIndex.current;
    if (index === null) return;
    draggingIndex.current = null;
    const point = clampToImage(e.clientX, e.clientY);
    setPositions((prev) => ({ ...prev, [index]: point }));
    sendPosition(index, point.x, point.y);
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.instruction && <p style={styles.instruction}>{data.instruction}</p>}

      <div ref={imageRef} style={{ ...styles.imageBox, backgroundImage: data.imageUrl ? `url(${data.imageUrl})` : undefined }}>
        {!data.imageUrl && <span style={styles.noImage}>sem imagem</span>}
        {data.keywords.map((kw, i) => {
          const pos = positions[i];
          if (!pos) return null;
          return (
            <div
              key={i}
              style={{
                ...styles.chip,
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                touchAction: 'none',
              }}
              onPointerDown={(e) => onPointerDown(i, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {kw}
            </div>
          );
        })}
      </div>

      <p style={styles.trayHint}>Arraste as palavras abaixo para a imagem:</p>
      <div style={styles.tray}>
        {data.keywords.map((kw, i) =>
          positions[i] ? null : (
            <div
              key={i}
              style={{ ...styles.chip, ...styles.trayChip, touchAction: 'none' }}
              onPointerDown={(e) => onPointerDown(i, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {kw}
            </div>
          )
        )}
      </div>
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
  imageBox: {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: 12,
    background: '#eef0f4 center / cover no-repeat',
    overflow: 'hidden',
  },
  noImage: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9aa1ac',
    fontSize: 14,
  },
  trayHint: { fontSize: 13, color: '#6b7280', margin: '16px 0 8px' },
  tray: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
    minHeight: 44,
  },
  chip: {
    position: 'absolute' as const,
    transform: 'translate(-50%, -50%)',
    padding: '8px 14px',
    borderRadius: 999,
    background: '#0448df',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'grab',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  trayChip: {
    position: 'static' as const,
    transform: 'none',
  },
};
