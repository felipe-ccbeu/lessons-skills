'use server';

import { revalidatePath } from 'next/cache';
import { requireRole, requireUser } from '@/lib/dal';
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
import { updateUserRole, deleteUser } from '@/lib/users';
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

export async function signOutAction() {
  await requireUser();
  await signOut({ redirectTo: '/login' });
}
