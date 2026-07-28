'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireRole, getRealUser, IMPERSONATE_COOKIE } from '@/lib/dal';
import { signOut } from '@/auth';
import {
  createLevel,
  deleteLevel,
  createUnit,
  deleteUnit,
  createLesson,
  deleteLesson,
  createPart,
  deletePart,
} from '@/lib/lessons';
import { updateUserRole, deleteUser, getUserById } from '@/lib/users';
import { setUserAiSpendCap, resetUserAiSpend } from '@/lib/aiUsage';
import type { Role } from '@/generated/prisma/client';

const ADMIN_OR_COORDINATOR: Role[] = ['ADMIN', 'COORDINATOR'];

function refreshPublicTrees() {
  revalidatePath('/lessons', 'layout');
}

function readLevelFields(formData: FormData) {
  return {
    slug: String(formData.get('slug') ?? '').trim(),
    title: String(formData.get('title') ?? '').trim(),
    order: Number(formData.get('order') ?? 0),
  };
}

export async function createLevelAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  await createLevel(readLevelFields(formData));
  refreshPublicTrees();
}

export async function deleteLevelAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  const id = String(formData.get('id'));
  await deleteLevel(id);
  refreshPublicTrees();
}

export async function createUnitAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  const levelId = String(formData.get('levelId'));
  await createUnit(levelId, readLevelFields(formData));
  refreshPublicTrees();
}

export async function deleteUnitAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  const id = String(formData.get('id'));
  await deleteUnit(id);
  refreshPublicTrees();
}

export async function createLessonAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  const unitId = String(formData.get('unitId'));
  await createLesson(unitId, readLevelFields(formData));
  refreshPublicTrees();
}

export async function deleteLessonAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  const id = String(formData.get('id'));
  await deleteLesson(id);
  refreshPublicTrees();
}

export async function createPartAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  const lessonId = String(formData.get('lessonId'));
  await createPart(lessonId, readLevelFields(formData));
  refreshPublicTrees();
}

export async function deletePartAction(formData: FormData) {
  await requireRole(ADMIN_OR_COORDINATOR);
  const id = String(formData.get('id'));
  await deletePart(id);
  refreshPublicTrees();
}

export async function updateUserRoleAction(formData: FormData) {
  await requireRole(['ADMIN']);
  const id = String(formData.get('id'));
  const role = String(formData.get('role')) as Role;
  await updateUserRole(id, role);
  revalidatePath('/admin/users');
}

export async function deleteUserAction(formData: FormData) {
  const currentUser = await requireRole(['ADMIN']);
  const id = String(formData.get('id'));
  if (id === currentUser.id) return;
  await deleteUser(id);
  revalidatePath('/admin/users');
}

export async function setUserAiSpendCapAction(formData: FormData) {
  await requireRole(['ADMIN']);
  const id = String(formData.get('id'));
  const raw = String(formData.get('capUsd') ?? '').trim();
  const capUsd = raw === '' ? null : Number(raw);
  if (capUsd !== null && (!Number.isFinite(capUsd) || capUsd < 0)) return;
  await setUserAiSpendCap(id, capUsd);
  revalidatePath('/admin/ai-usage');
}

export async function resetUserAiSpendAction(formData: FormData) {
  await requireRole(['ADMIN']);
  const id = String(formData.get('id'));
  await resetUserAiSpend(id);
  revalidatePath('/admin/ai-usage');
}

// Start impersonating a user ("Ver como"). Gated on the REAL account being an
// admin — not getCurrentUser, which could itself be impersonated — so an
// impersonation session can't be used to hop into yet another user.
export async function impersonateUserAction(formData: FormData) {
  const real = await getRealUser();
  if (real?.role !== 'ADMIN') return;
  const id = String(formData.get('id'));
  if (!id || id === real.id) return; // no self-impersonation
  const target = await getUserById(id);
  if (!target) return;
  (await cookies()).set(IMPERSONATE_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  redirect('/lessons');
}

// Exit impersonation and return to the admin's own account. Only clears the
// cookie, so it stays safe to call regardless of the effective role.
export async function stopImpersonatingAction() {
  (await cookies()).delete(IMPERSONATE_COOKIE);
  redirect('/admin/users');
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}
