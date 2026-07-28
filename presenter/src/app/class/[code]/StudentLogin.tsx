'use client';

import { useState, FormEvent } from 'react';

type Props = {
  /** Prefilled name when editing an existing name, empty on first join. */
  initialName?: string;
  /** Title shown on the card — differs for first join vs. editing. */
  heading: string;
  submitLabel: string;
  /** Called with the trimmed name once it's saved on the server. */
  onSubmit: (name: string) => Promise<void>;
  /** Shown only when editing, lets the student back out without changing anything. */
  onCancel?: () => void;
};

// The student's "enter your name" screen — brand-blue full-bleed background,
// a single name field, nothing else. Also reused (with a heading/label swap)
// as the "edit my name" screen from inside the class.
export function StudentLogin({ initialName = '', heading, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setStatus('saving');
    try {
      await onSubmit(trimmed);
    } catch {
      setStatus('error');
    }
  }

  return (
    <main style={styles.main}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.brand}>
          <span style={styles.brandDot} />
          <span style={styles.brandName}>CCBEU Slides</span>
        </div>
        <h1 style={styles.heading}>{heading}</h1>
        <p style={styles.subtitle}>Digite seu nome para participar da aula.</p>

        <input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Seu nome"
          maxLength={60}
          style={styles.input}
          aria-label="Seu nome"
        />

        {status === 'error' && <p style={styles.error}>Algo deu errado, tente de novo.</p>}

        <button type="submit" style={styles.submit} disabled={status === 'saving' || !name.trim()}>
          {status === 'saving' ? 'Entrando…' : submitLabel}
        </button>

        {onCancel && (
          <button type="button" style={styles.cancel} onClick={onCancel}>
            Cancelar
          </button>
        )}
      </form>
    </main>
  );
}

const BRAND_BLUE = '#0448df';
const BRAND_PINK = '#fd3682';

const styles = {
  main: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: BRAND_BLUE,
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#fff',
    borderRadius: 18,
    padding: '32px 26px',
    boxShadow: '0 18px 50px rgba(0,0,0,0.22)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 18,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: BRAND_PINK,
  },
  brandName: { fontWeight: 700, color: '#1c2027', fontSize: 15 },
  heading: { fontSize: 21, fontWeight: 700, color: '#1c2027', margin: '0 0 6px', textAlign: 'center' as const },
  subtitle: { fontSize: 14, color: '#6b7280', margin: '0 0 22px', textAlign: 'center' as const },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    borderRadius: 12,
    border: '1px solid #dde0e6',
    outline: 'none',
    color: '#1c2027',
  },
  submit: {
    marginTop: 16,
    padding: '14px 16px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    border: 'none',
    background: BRAND_BLUE,
    color: '#fff',
    cursor: 'pointer',
  },
  cancel: {
    marginTop: 10,
    padding: '10px',
    fontSize: 14,
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
  },
  error: { color: '#b3261e', fontSize: 13, margin: '12px 0 0', textAlign: 'center' as const },
};
