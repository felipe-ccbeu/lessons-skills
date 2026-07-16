import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';
import { sampleSlides } from '../src/lib/sample-slides';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const LEVELS = [
  { slug: 'basic-1', title: 'Basic 1', units: 6 },
  { slug: 'basic-2', title: 'Basic 2', units: 6 },
  { slug: 'basic-3', title: 'Basic 3', units: 5 },
  { slug: 'intermediate-1', title: 'Intermediate 1', units: 8 },
  { slug: 'intermediate-2', title: 'Intermediate 2', units: 4 },
  { slug: 'advanced-1', title: 'Advanced 1', units: 3 },
];

const LESSON_LETTERS = ['A', 'B', 'C', 'D'] as const;

const LESSON_THEMES = [
  'Greetings & Introductions',
  'Family & Friends',
  'Daily Routines',
  'Food & Drinks',
  'Travel & Directions',
  'Work & School',
  'Hobbies & Free Time',
  'Shopping',
  'Health & the Body',
  'Weather & Seasons',
  'Numbers & Time',
  'Describing People',
];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  let levelOrder = 0;
  for (const levelDef of LEVELS) {
    levelOrder += 1;
    const level = await prisma.level.upsert({
      where: { slug: levelDef.slug },
      update: { title: levelDef.title, order: levelOrder },
      create: { slug: levelDef.slug, title: levelDef.title, order: levelOrder },
    });

    for (let u = 1; u <= levelDef.units; u++) {
      const unitTitle = `Unit ${u}`;
      const unit = await prisma.unit.upsert({
        where: { levelId_slug: { levelId: level.id, slug: `unit-${u}` } },
        update: { title: unitTitle, order: u },
        create: { levelId: level.id, slug: `unit-${u}`, title: unitTitle, order: u },
      });

      // Vary the number of lessons per unit (2 to 4) so listings don't look uniform.
      const lessonCount = 2 + ((u + levelOrder) % 3);
      for (let l = 0; l < lessonCount; l++) {
        const letter = pick(LESSON_LETTERS, l);
        const theme = pick(LESSON_THEMES, u + l + levelOrder);
        const lessonTitle = `Lesson ${letter} — ${theme}`;
        const lesson = await prisma.lesson.upsert({
          where: { unitId_slug: { unitId: unit.id, slug: `lesson-${letter.toLowerCase()}` } },
          update: { title: lessonTitle, order: l + 1 },
          create: { unitId: unit.id, slug: `lesson-${letter.toLowerCase()}`, title: lessonTitle, order: l + 1 },
        });

        // Vary parts per lesson (1 to 3).
        const partCount = 1 + ((u + l) % 3);
        for (let p = 1; p <= partCount; p++) {
          const isSeedShowcase = levelDef.slug === 'basic-1' && u === 1 && letter === 'B' && p === 1;
          await prisma.part.upsert({
            where: { lessonId_slug: { lessonId: lesson.id, slug: `part-${p}` } },
            update: isSeedShowcase ? { slides: sampleSlides } : {},
            create: {
              lessonId: lesson.id,
              slug: `part-${p}`,
              title: `Part ${p}`,
              order: p,
              slides: sampleSlides,
            },
          });
        }
      }
    }
  }

  const counts = await Promise.all([
    prisma.level.count(),
    prisma.unit.count(),
    prisma.lesson.count(),
    prisma.part.count(),
  ]);
  console.log('Seed complete:', { levels: counts[0], units: counts[1], lessons: counts[2], parts: counts[3] });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
