'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { avatarUrlFor } from '@/lib/avatar';

type Student = { id: string; name: string; avatarSeed: string | null };

// Brand-adjacent palette for the bubbles — a bubble's color is derived
// deterministically from the student's name so the same person keeps the same
// color across polls (and across re-renders), rather than flickering.
const BUBBLE_COLORS = ['#F5225F', '#1B4BF5', '#FFB020', '#21C08A', '#8B5CF6', '#FF6B35', '#00B8D9', '#E11D8F'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function colorFor(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return BUBBLE_COLORS[Math.abs(sum) % BUBBLE_COLORS.length];
}

/**
 * Floating roster of student bubbles down the right edge of the first slide —
 * the projected "who's in the room" lobby board. Polls the students route
 * every couple of seconds (the teacher's machine is the only viewer, so plain
 * polling is enough — no SSE roster channel needed); each newly-joined student
 * pops in as a bubble showing their initials with their name beneath.
 */
export function LobbyBubbles({ code }: { code: string }) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/class/${code}/students`);
        if (!res.ok) return;
        const data = (await res.json()) as { students: Student[] };
        if (!cancelled) setStudents(data.students);
      } catch {
        // Transient fetch failure: keep whatever roster we last had rather
        // than clearing the board mid-class.
      }
    }

    load();
    const timer = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [code]);

  return (
    <div style={styles.column}>
      <style>{bobKeyframes}</style>
      <AnimatePresence>
        {students.map((s, i) => (
          <motion.div
            key={s.id}
            style={styles.student}
            initial={{ opacity: 0, y: 26, scale: 0.4 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          >
            <div
              className="lobby-bubble"
              style={{
                ...styles.bubble,
                background: colorFor(s.name),
                // Stagger the idle bob so the bubbles don't pulse in unison.
                animationDelay: `${(i % 6) * 0.25}s`,
              }}
            >
              <img
                src={avatarUrlFor(s.avatarSeed ?? s.id)}
                alt=""
                style={styles.avatar}
                onError={(e) => {
                  // DiceBear unreachable: fall back to initials instead of a broken image icon.
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span style={styles.initialsFallback}>{initials(s.name)}</span>
            </div>
            <p style={styles.name} title={s.name}>
              {s.name}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const bobKeyframes = `
@keyframes lobbyBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) {
  .lobby-bubble { animation: none !important; }
}
`;

const styles = {
  column: {
    position: 'absolute' as const,
    top: 24,
    right: 24,
    bottom: 24,
    width: 128,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 18,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    zIndex: 1001,
    pointerEvents: 'none' as const,
    fontFamily: 'var(--font-body)',
  },
  student: {
    width: 100,
    flex: '0 0 auto',
    textAlign: 'center' as const,
  },
  bubble: {
    position: 'relative' as const,
    width: 72,
    height: 72,
    borderRadius: '50%',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '3px solid #12141A',
    color: '#fff',
    fontSize: 24,
    fontWeight: 800,
    animation: 'lobbyBob 3.6s ease-in-out infinite',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    position: 'relative' as const,
    zIndex: 1,
  },
  // Sits underneath the <img>; only visible if the avatar fails to load.
  initialsFallback: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#12141A',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
