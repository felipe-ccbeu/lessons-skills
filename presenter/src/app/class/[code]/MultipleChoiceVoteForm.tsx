'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/components/ui/Icon';

type Option = { id: string; label: string };
type Props = {
  code: string;
  question: string;
  options: Option[];
  // Index of the correct option within `options`, if the teacher marked one.
  // Undefined means "no correct answer marked" — voting still works, just
  // without right/wrong feedback (only the neutral "voto registrado" state).
  correctIndex?: number;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// How long the check/cross overlay stays up before fading away on its own,
// leaving the (now locked) option list visible underneath — long enough to
// read, short enough not to block moving on to the next question.
const FEEDBACK_DURATION_MS = 1800;

function getVoterKey(): string {
  const stored = localStorage.getItem('voterKey');
  if (stored) return stored;
  const fresh = crypto.randomUUID();
  localStorage.setItem('voterKey', fresh);
  return fresh;
}

export function MultipleChoiceVoteForm({ code, question, options, correctIndex }: Props) {
  const [status, setStatus] = useState<'idle' | 'voting' | 'voted' | 'already_voted' | 'error'>('idle');
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  async function vote(optionId: string, index: number) {
    setStatus('voting');
    setPickedIndex(index);
    try {
      const res = await fetch(`/api/polls/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, voterKey: getVoterKey() }),
      });
      if (res.status === 409) {
        setStatus('already_voted');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        return;
      }
      setStatus('voted');
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), FEEDBACK_DURATION_MS);
    } catch {
      setStatus('error');
    }
  }

  const isGraded = correctIndex !== undefined;
  const isCorrect = isGraded && pickedIndex === correctIndex;
  const locked = status === 'voted' || status === 'already_voted';

  return (
    <main style={styles.main}>
      <h1 style={styles.question}>{question}</h1>
      <div style={{ position: 'relative' }}>
        <div style={styles.options}>
          {options.map((opt, i) => {
            const picked = pickedIndex === i;
            return (
              <button
                key={opt.id}
                style={{
                  ...styles.option,
                  ...(picked ? styles.optionPicked : null),
                  ...(locked && !picked ? styles.optionDisabled : null),
                }}
                disabled={status === 'voting' || locked}
                onClick={() => vote(opt.id, i)}
              >
                <span style={styles.optionLetter}>{LETTERS[i] ?? '?'}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
        {status === 'already_voted' && <p style={styles.confirmation}>Você já respondeu essa pergunta.</p>}
        {status === 'error' && <p style={styles.error}>Algo deu errado, tente de novo.</p>}

        <AnimatePresence>
          {showFeedback && <FeedbackBurst correct={isGraded ? isCorrect : null} />}
        </AnimatePresence>
      </div>
    </main>
  );
}

// `correct === null` means the slide has no marked answer — shows a neutral
// "recorded" confirmation instead of a check/cross, since there's nothing to
// grade the pick against. Overlays the option list rather than replacing it,
// and fades out on its own (see FEEDBACK_DURATION_MS) to reveal the now-locked
// list underneath instead of leaving the student stuck on a result screen.
function FeedbackBurst({ correct }: { correct: boolean | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={styles.feedbackOverlay}
    >
      <motion.div
        initial={{ y: 40, scale: 0.6 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={styles.feedbackWrap}
      >
        {correct === null ? (
          <>
            <Icon name="check" size={64} style={{ color: '#0448df' }} />
            <p style={{ ...styles.confirmation, color: '#0448df' }}>Resposta registrada.</p>
          </>
        ) : correct ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            >
              <Icon name="check_circle" size={88} style={{ color: '#1a9e5c' }} />
            </motion.div>
            <p style={{ ...styles.confirmation, color: '#1a9e5c' }}>Certinho! 🎉</p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.2, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            >
              <Icon name="cancel" size={88} style={{ color: '#d92d20' }} />
            </motion.div>
            <p style={{ ...styles.confirmation, color: '#d92d20' }}>Não foi dessa vez.</p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const styles = {
  main: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
  },
  question: { fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#1c2027' },
  options: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '18px 20px',
    fontSize: 17,
    borderRadius: 12,
    border: '1px solid #e4e6eb',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  optionPicked: {
    borderColor: '#0448df',
    background: '#eef2ff',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLetter: {
    flex: '0 0 30px',
    height: 30,
    borderRadius: 8,
    border: '1px solid #e4e6eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#0448df',
  },
  feedbackOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
  },
  feedbackWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: 8,
  },
  confirmation: { fontSize: 20, fontWeight: 700, textAlign: 'center' as const, margin: 0 },
  error: { color: '#b3261e', marginTop: 16, textAlign: 'center' as const },
};
