import { prisma } from '@/lib/prisma';
import { Slide } from '@/lib/types';

export async function getLevels() {
  return prisma.level.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { units: true } } },
  });
}

export async function getLevelBySlug(levelSlug: string) {
  return prisma.level.findUnique({ where: { slug: levelSlug } });
}

export async function getUnits(levelSlug: string) {
  const level = await getLevelBySlug(levelSlug);
  if (!level) return null;
  const units = await prisma.unit.findMany({
    where: { levelId: level.id },
    orderBy: { order: 'asc' },
    include: { _count: { select: { lessons: true } } },
  });
  return { level, units };
}

export async function getUnitBySlug(levelSlug: string, unitSlug: string) {
  const level = await getLevelBySlug(levelSlug);
  if (!level) return null;
  const unit = await prisma.unit.findUnique({ where: { levelId_slug: { levelId: level.id, slug: unitSlug } } });
  if (!unit) return null;
  return { level, unit };
}

export async function getLessons(levelSlug: string, unitSlug: string) {
  const found = await getUnitBySlug(levelSlug, unitSlug);
  if (!found) return null;
  const lessons = await prisma.lesson.findMany({
    where: { unitId: found.unit.id },
    orderBy: { order: 'asc' },
    include: { _count: { select: { parts: true } } },
  });
  return { ...found, lessons };
}

export async function getLessonBySlug(levelSlug: string, unitSlug: string, lessonSlug: string) {
  const found = await getUnitBySlug(levelSlug, unitSlug);
  if (!found) return null;
  const lesson = await prisma.lesson.findUnique({
    where: { unitId_slug: { unitId: found.unit.id, slug: lessonSlug } },
  });
  if (!lesson) return null;
  return { ...found, lesson };
}

export async function getParts(levelSlug: string, unitSlug: string, lessonSlug: string) {
  const found = await getLessonBySlug(levelSlug, unitSlug, lessonSlug);
  if (!found) return null;
  const parts = await prisma.part.findMany({ where: { lessonId: found.lesson.id }, orderBy: { order: 'asc' } });
  return { ...found, parts };
}

export async function getPartBySlug(levelSlug: string, unitSlug: string, lessonSlug: string, partSlug: string) {
  const found = await getLessonBySlug(levelSlug, unitSlug, lessonSlug);
  if (!found) return null;
  const part = await prisma.part.findUnique({
    where: { lessonId_slug: { lessonId: found.lesson.id, slug: partSlug } },
  });
  if (!part) return null;
  return { ...found, part };
}

export async function updatePartSlides(partId: string, slides: Slide[]) {
  return prisma.part.update({ where: { id: partId }, data: { slides } });
}
