'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

type HeaderUser = { name?: string | null; email?: string | null; image?: string | null; role?: string };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  NONE: 'Sem acesso',
};

export function TopHeader({ user }: { user?: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[var(--chrome-bg)] border-b border-[var(--chrome-border)]">
      <div className="flex justify-between items-center w-full px-6 py-4">
        <span className="font-[family-name:var(--font-title)] text-[17px] font-bold text-[var(--ccbeu-blue)]">
          CCBEU English Center
        </span>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Menu do perfil"
            className="w-8 h-8 rounded-full bg-[var(--ccbeu-blue)]/10 text-[var(--ccbeu-blue)] flex items-center justify-center text-[13px] font-semibold overflow-hidden hover:ring-2 hover:ring-[var(--ccbeu-blue)]/30 transition-shadow"
          >
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.name ?? user?.email ?? 'C').charAt(0).toUpperCase()
            )}
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e4e6eb] bg-white shadow-lg py-1.5 overflow-hidden"
            >
              {user && (
                <div className="px-3.5 py-2.5 border-b border-[#e4e6eb]">
                  <p className="text-[12.5px] font-medium text-[#1c2027] truncate">{user.name ?? user.email}</p>
                  {user.role && (
                    <p className="text-[11px] text-[#9aa1ac]">{ROLE_LABELS[user.role] ?? user.role}</p>
                  )}
                </div>
              )}
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    href="/admin/users"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="block px-3.5 py-2 text-[13px] text-[#1c2027] hover:bg-[#f7f8fa] transition-colors"
                  >
                    Usuários
                  </Link>
                  <Link
                    href="/admin/ai-usage"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="block px-3.5 py-2 text-[13px] text-[#1c2027] hover:bg-[#f7f8fa] transition-colors"
                  >
                    Uso da IA
                  </Link>
                </>
              )}
              <div className="px-1.5 pt-1">
                <SignOutButton className="w-full flex items-center justify-center rounded-lg px-3.5 py-2 text-[13px] text-[#c81e3a] hover:bg-[#fdecef] transition-colors" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
