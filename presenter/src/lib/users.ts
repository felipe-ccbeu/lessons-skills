import { prisma } from '@/lib/prisma';
import type { Role } from '@/generated/prisma/client';

export async function getUsers() {
  return prisma.user.findMany({ orderBy: { email: 'asc' } });
}

export async function updateUserRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
