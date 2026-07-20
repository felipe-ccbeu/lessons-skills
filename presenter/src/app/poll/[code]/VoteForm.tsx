'use client';

import { useState } from 'react';

type Option = { id: string; label: string };
type Props = { code: string; question: string; options: Option[] };

function getVoterKey(): string {
  const stored = localStorage.getItem('voterKey');
  if (stored) return stored;
  const fresh = crypto.randomUUID();
  localStorage.setItem('voterKey', fresh);
  return fresh;
}

export function VoteForm({ code, question, options }: Props) {
  const [status, setStatus] = useState<'idle' | 'voting' | 'voted' | 'already_voted' | 'error'>('idle');

  async function vote(optionId: string) {
    setStatus('voting');
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
    } catch {
      setStatus('error');
    }
  }

  if (status === 'voted') {
    return (
      <main style={styles.main}>
        <p style={styles.confirmation}>✓ Voto registrado.</p>
        <p style={styles.confirmationHint}>Olhe o telão para ver o resultado ao vivo.</p>
      </main>
    );
  }

  if (status === 'already_voted') {
    return (
      <main style={styles.main}>
        <p style={styles.confirmation}>Você já votou nessa rodada.</p>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.question}>{question}</h1>
      <div style={styles.options}>
        {options.map((opt) => (
          <button
            key={opt.id}
            style={styles.option}
            disabled={status === 'voting'}
            onClick={() => vote(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {status === 'error' && <p style={styles.error}>Algo deu errado, tente de novo.</p>}
    </main>
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
    padding: '18px 20px',
    fontSize: 17,
    borderRadius: 12,
    border: '1px solid #e4e6eb',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  confirmation: { fontSize: 20, fontWeight: 700, color: '#0448df', textAlign: 'center' as const },
  confirmationHint: { fontSize: 15, color: '#6b7280', textAlign: 'center' as const, marginTop: 8 },
  error: { color: '#b3261e', marginTop: 16, textAlign: 'center' as const },
};
