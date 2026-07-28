import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { getUserById } from '@/lib/users';
import type { Role } from '@/generated/prisma/client';

// Cookie holding the id of the user an admin is currently impersonating
// ("Ver como" from /admin/users). httpOnly + admin-gated on write; ignored
// on read for anyone who isn't a real ADMIN, so it can't be forged into a
// privilege escalation.
export const IMPERSONATE_COOKIE = 'impersonate_user_id';

type SessionUser = {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type CurrentUser = SessionUser & {
  // Present only while impersonating: the real admin account behind the view.
  impersonatedBy?: { id: string; name: string | null; email: string | null };
};

// The real, authenticated account — never the impersonation target. The
// impersonation server actions and the "stop" control key off this so an admin
// can always find their way back even while viewing as someone else.
export const getRealUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  return session?.user ?? null;
});

// The *effective* user the whole app renders for. When a real ADMIN has an
// active impersonation cookie, this returns the targeted user carrying THAT
// user's role — so every downstream requireRole/requireUser check enforces the
// impersonated user's permissions exactly, which is the whole point of "Ver
// como". Tagged with `impersonatedBy` so the UI can show the banner.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const real = await getRealUser();
  if (!real) return null;

  const targetId = (await cookies()).get(IMPERSONATE_COOKIE)?.value;
  // Only a real admin may impersonate, and never themselves.
  if (!targetId || real.role !== 'ADMIN' || targetId === real.id) return real;

  const target = await getUserById(targetId);
  if (!target) return real; // stale cookie (user removed) — fall back to the admin

  return {
    id: target.id,
    role: target.role,
    name: target.name,
    email: target.email,
    image: target.image,
    impersonatedBy: { id: real.id, name: real.name ?? null, email: real.email ?? null },
  };
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
