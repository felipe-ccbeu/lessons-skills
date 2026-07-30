'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

// Each question row runs its own independent live-vote round (its own poll
// code), opened all at once when the teacher enters the slide — see
// startQaVoting in PresentationOverlay.tsx. `undefined` here means the
// teacher hasn't opened that row's round yet (or it isn't open anymore).
export type QaRow = {
  question: string;
  yesLabel: string;
  noLabel: string;
  poll?: { pollCode: string; yesOptionId: string; noOptionId: string };
};

type Props = { rows: QaRow[] };

function getVoterKey(): string {
  const stored = localStorage.getItem('voterKey');
  if (stored) return stored;
  const fresh = crypto.randomUUID();
  localStorage.setItem('voterKey', fresh);
  return fresh;
}

type RowStatus = 'idle' | 'voting' | 'voted' | 'already_voted' | 'error';

export function PracticeQaBadgesVoteForm({ rows }: Props) {
  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Ask and answer!</h1>
      <div style={styles.rows}>
        {rows.map((row, i) => (
          <QaRowCard key={i} row={row} />
        ))}
      </div>
    </main>
  );
}

function QaRowCard({ row }: { row: QaRow }) {
  const [status, setStatus] = useState<RowStatus>('idle');
  const [picked, setPicked] = useState<'yes' | 'no' | null>(null);

  async function vote(answer: 'yes' | 'no') {
    if (!row.poll) return;
    setStatus('voting');
    setPicked(answer);
    const optionId = answer === 'yes' ? row.poll.yesOptionId : row.poll.noOptionId;
    try {
      const res = await fetch(`/api/polls/${row.poll.pollCode}/vote`, {
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
    } catch {
      setStatus('error');
    }
  }

  const locked = status === 'voted' || status === 'already_voted';
  const disabled = !row.poll || status === 'voting' || locked;

  return (
    <div style={styles.card}>
      <p style={styles.question}>{row.question}</p>
      <div style={styles.answers}>
        <button
          type="button"
          style={{
            ...styles.answerBtn,
            ...styles.yesBtn,
            ...(picked === 'yes' ? styles.answerPicked : null),
            ...(locked && picked !== 'yes' ? styles.answerDisabled : null),
          }}
          disabled={disabled}
          onClick={() => vote('yes')}
        >
          {picked === 'yes' && <Icon name="check" size={16} />} {row.yesLabel}
        </button>
        <button
          type="button"
          style={{
            ...styles.answerBtn,
            ...styles.noBtn,
            ...(picked === 'no' ? styles.answerPicked : null),
            ...(locked && picked !== 'no' ? styles.answerDisabled : null),
          }}
          disabled={disabled}
          onClick={() => vote('no')}
        >
          {picked === 'no' && <Icon name="check" size={16} />} {row.noLabel}
        </button>
      </div>
      {!row.poll && <p style={styles.hint}>Aguardando o professor abrir esta pergunta…</p>}
      {status === 'already_voted' && <p style={styles.hint}>Você já respondeu essa pergunta.</p>}
      {status === 'error' && <p style={styles.error}>Algo deu errado, tente de novo.</p>}
    </div>
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
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#1c2027' },
  rows: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    border: '1px solid #e4e6eb',
  },
  question: { margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1c2027' },
  answers: { display: 'flex', gap: 10 },
  answerBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '12px 10px',
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 10,
    cursor: 'pointer',
  },
  yesBtn: { color: '#2e7d32', background: '#e8f5e9', border: '1px solid #2e7d32' },
  noBtn: { color: '#c62828', background: '#fdecea', border: '1px solid #c62828' },
  answerPicked: { boxShadow: '0 0 0 2px currentColor inset' },
  answerDisabled: { opacity: 0.4 },
  hint: { margin: '10px 0 0', fontSize: 13, color: '#6b7280' },
  error: { margin: '10px 0 0', fontSize: 13, color: '#b3261e' },
};
