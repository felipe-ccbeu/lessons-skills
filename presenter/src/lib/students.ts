import { prisma } from '@/lib/prisma';
import { getClassSessionByCode } from '@/lib/classSessions';

export type JoinResult =
  | { ok: true; student: { id: string; name: string } }
  | { ok: false; reason: 'not_found' | 'invalid_name' };

/**
 * Register (or re-register) a student in a class, keyed by their opaque
 * per-device id. Upsert on `(classSessionId, deviceKey)` means the same phone
 * re-joining the same class updates its existing row instead of creating a
 * duplicate — which is exactly what "edit my name" needs too: it's the same
 * call with a new name.
 */
export async function joinClass(code: string, deviceKey: string, rawName: string): Promise<JoinResult> {
  const name = rawName.trim();
  if (!name || !deviceKey) return { ok: false, reason: 'invalid_name' };

  const session = await getClassSessionByCode(code);
  if (!session) return { ok: false, reason: 'not_found' };

  const student = await prisma.student.upsert({
    where: { classSessionId_deviceKey: { classSessionId: session.id, deviceKey } },
    create: { classSessionId: session.id, deviceKey, name },
    update: { name },
  });

  return { ok: true, student: { id: student.id, name: student.name } };
}

/** Look up a student already registered on this device for a given class. */
export async function getStudentByDevice(code: string, deviceKey: string) {
  const session = await getClassSessionByCode(code);
  if (!session) return null;
  return prisma.student.findUnique({
    where: { classSessionId_deviceKey: { classSessionId: session.id, deviceKey } },
  });
}

/**
 * The roster of students who have joined a class, oldest-first — what the
 * teacher's lobby overlay shows as name bubbles. Ordered by join time so a
 * newly-arrived student always appears at the end (its bubble pops in last).
 */
export async function listClassStudents(code: string): Promise<{ id: string; name: string }[]> {
  const session = await getClassSessionByCode(code);
  if (!session) return [];
  const students = await prisma.student.findMany({
    where: { classSessionId: session.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  return students;
}
