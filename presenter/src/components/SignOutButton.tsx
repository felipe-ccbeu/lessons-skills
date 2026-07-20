'use client';

import { signOutAction } from '@/lib/admin-actions';

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button type="submit" className={className ?? 'btn w-full'}>
        Sair
      </button>
    </form>
  );
}
