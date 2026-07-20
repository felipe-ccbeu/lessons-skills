import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { Role } from '@/generated/prisma/client';

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'NONE') redirect('/aguardando');
  return user;
}

export async function requireRole(allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect('/lessons');
  return user;
}

// Route Handlers can't call redirect() the way Server Components can — return a typed error instead.
export async function requireRoleApi(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) return { error: 'unauthorized' as const, status: 401 };
  if (!allowed.includes(session.user.role)) return { error: 'forbidden' as const, status: 403 };
  return { user: session.user };
}
