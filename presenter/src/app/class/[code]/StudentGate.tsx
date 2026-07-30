'use client';

import { useEffect, useState, ReactNode } from 'react';
import { StudentLogin } from './StudentLogin';
import { randomAvatarSeed } from '@/lib/avatar';

type Props = { code: string; children: (student: { name: string; onEditName: () => void }) => ReactNode };

// Opaque per-device id, same trick as the poll voterKey — one stable id per
// browser, so a returning phone re-attaches to its existing Student row.
function getDeviceKey(): string {
  const stored = localStorage.getItem('studentDeviceKey');
  if (stored) return stored;
  const fresh = crypto.randomUUID();
  localStorage.setItem('studentDeviceKey', fresh);
  return fresh;
}

// The avatar seed is cached locally the same way the name is, purely so the
// login/edit screen has something to preview instantly; the server's copy
// (Student.avatarSeed) is still the source of truth the lobby overlay reads.
function getCachedAvatarSeed(): string {
  const stored = localStorage.getItem('studentAvatarSeed');
  if (stored) return stored;
  const fresh = randomAvatarSeed();
  localStorage.setItem('studentAvatarSeed', fresh);
  return fresh;
}

/**
 * Gates the class view behind an "enter your name" screen. The name is stored
 * per device (localStorage) — asked once, reused for any future class — but the
 * source of truth is the Student row on the server, so we confirm on mount that
 * this device is still registered before letting the student straight in.
 * Also drives the "edit my name" flow from inside the class.
 */
export function StudentGate({ code, children }: Props) {
  // undefined = still resolving; null = needs to log in; string = logged in.
  const [name, setName] = useState<string | undefined | null>(undefined);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const deviceKey = getDeviceKey();
    let cancelled = false;

    async function resolve() {
      // Trust a locally cached name for an instant render, but still verify it
      // against the server so a device wiped server-side falls back to login.
      const cached = localStorage.getItem('studentName');
      if (cached) setName(cached);

      try {
        const res = await fetch(`/api/class/${code}/join?deviceKey=${encodeURIComponent(deviceKey)}`);
        if (!res.ok) throw new Error('lookup failed');
        const data = (await res.json()) as { student: { name: string; avatarSeed: string | null } | null };
        if (cancelled) return;
        if (data.student) {
          localStorage.setItem('studentName', data.student.name);
          if (data.student.avatarSeed) localStorage.setItem('studentAvatarSeed', data.student.avatarSeed);
          setName(data.student.name);
        } else if (!cached) {
          setName(null);
        }
      } catch {
        // Network hiccup: if we had a cached name, keep the student in; only
        // force the login screen when we have nothing to show.
        if (!cancelled && !cached) setName(null);
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function save(newName: string, avatarSeed: string) {
    const deviceKey = getDeviceKey();
    const res = await fetch(`/api/class/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceKey, name: newName, avatarSeed }),
    });
    if (!res.ok) throw new Error('join failed');
    const data = (await res.json()) as { student: { name: string; avatarSeed: string | null } };
    localStorage.setItem('studentName', data.student.name);
    if (data.student.avatarSeed) localStorage.setItem('studentAvatarSeed', data.student.avatarSeed);
    setName(data.student.name);
    setEditing(false);
  }

  if (name === undefined) {
    return (
      <main style={loadingStyle}>
        <p style={{ color: '#fff', fontSize: 15, opacity: 0.9 }}>Carregando…</p>
      </main>
    );
  }

  if (name === null) {
    return (
      <StudentLogin
        heading="Bem-vindo à aula"
        submitLabel="Entrar"
        initialAvatarSeed={getCachedAvatarSeed()}
        onSubmit={save}
      />
    );
  }

  if (editing) {
    return (
      <StudentLogin
        heading="Editar seu nome"
        submitLabel="Salvar"
        initialName={name}
        initialAvatarSeed={getCachedAvatarSeed()}
        onSubmit={save}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return <>{children({ name, onEditName: () => setEditing(true) })}</>;
}

const loadingStyle = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0448df',
  fontFamily: 'system-ui, sans-serif',
};
