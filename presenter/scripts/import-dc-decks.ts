/**
 * One-off importer: converts the standalone "design canvas" lesson decks
 * (`*.dc.html` — multi-<section> files produced outside this repo's normal
 * html-to-pptx pipeline) into `Part.slides` rows of `template: 'customHtml'`.
 *
 * Each <section> becomes its own self-contained HTML document: the design
 * system's token CSS is inlined, <img src="assets/..."> references are
 * inlined as base64 data URIs, and <image-slot> placeholders (an editor-only
 * custom element with no runtime here) are replaced with a static gray box
 * showing the same placeholder caption.
 *
 * Run with: npx tsx scripts/import-dc-decks.ts
 */
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = 'C:\\Users\\felipe.fadel\\Downloads\\Design system CCBEU A1';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type DeckMapping = {
  file: string;
  unitSlug: string;
  unitTitle: string;
  lessonSlug: string;
  lessonTitle: string;
  partSlug: string;
  partTitle: string;
};

const DECKS: DeckMapping[] = [
  {
    file: 'Lesson B - Countries & Nationalities.dc.html',
    unitSlug: 'unit-1',
    unitTitle: 'Unit 1',
    lessonSlug: 'lesson-b',
    lessonTitle: 'Lesson B — Countries & Nationalities',
    partSlug: 'part-1',
    partTitle: 'Part 1',
  },
  {
    file: 'Lesson B Part 2 - Yes-No Questions.dc.html',
    unitSlug: 'unit-1',
    unitTitle: 'Unit 1',
    lessonSlug: 'lesson-b',
    lessonTitle: 'Lesson B — Countries & Nationalities',
    partSlug: 'part-2',
    partTitle: 'Part 2 — Yes-No Questions',
  },
  {
    file: 'Lesson C - Greetings & Everyday English.dc.html',
    unitSlug: 'unit-1',
    unitTitle: 'Unit 1',
    lessonSlug: 'lesson-c',
    lessonTitle: 'Lesson C — Greetings & Everyday English',
    partSlug: 'part-1',
    partTitle: 'Part 1',
  },
  {
    file: 'Unit 2 - Lesson A Part 1 - Cities & Towns.dc.html',
    unitSlug: 'unit-2',
    unitTitle: 'Unit 2',
    lessonSlug: 'lesson-a',
    lessonTitle: 'Lesson A — Cities & Towns',
    partSlug: 'part-1',
    partTitle: 'Part 1',
  },
  {
    file: 'Unit 2 - Lesson A Part 2 - Adjectives & Possessives.dc.html',
    unitSlug: 'unit-2',
    unitTitle: 'Unit 2',
    lessonSlug: 'lesson-a',
    lessonTitle: 'Lesson A — Cities & Towns',
    partSlug: 'part-2',
    partTitle: 'Part 2 — Adjectives & Possessives',
  },
  {
    file: 'Unit 2 - Lesson B - Airport Objects and Plurals.dc.html',
    unitSlug: 'unit-2',
    unitTitle: 'Unit 2',
    lessonSlug: 'lesson-b',
    lessonTitle: 'Lesson B — Airport Objects and Plurals',
    partSlug: 'part-1',
    partTitle: 'Part 1',
  },
];

const DS_DIR = join(
  SOURCE_DIR,
  '_ds',
  'ccbeu-english-center-design-system-56bfb573-0408-471b-9598-a493e1d4e789'
);

function readTokenCss(): string {
  // styles.css is just @import lines to the token files; inline the token
  // files directly (skip the Google Fonts @import, kept separately since
  // it's a real network URL that works fine inside the iframe srcDoc).
  const files = ['tokens/colors.css', 'tokens/typography.css', 'tokens/spacing.css'];
  return files.map((f) => readFileSync(join(DS_DIR, f), 'utf-8')).join('\n');
}

const GOOGLE_FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Inter:ital,wght@0,400;0,500;0,700;1,400&display=swap');";

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

const assetDataUriCache = new Map<string, string>();

function assetToDataUri(relPath: string): string {
  const cached = assetDataUriCache.get(relPath);
  if (cached) return cached;
  const abs = join(SOURCE_DIR, relPath);
  const bytes = readFileSync(abs);
  const ext = relPath.split('.').pop()?.toLowerCase() ?? '';
  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
  const dataUri = `data:${mime};base64,${bytes.toString('base64')}`;
  assetDataUriCache.set(relPath, dataUri);
  return dataUri;
}

/** Replaces every <image-slot> with a static gray placeholder box carrying the same caption. */
function replaceImageSlots(doc: Document) {
  const slots = Array.from(doc.querySelectorAll('image-slot'));
  for (const slot of slots) {
    const placeholder = slot.getAttribute('placeholder') ?? 'Image';
    const style = slot.getAttribute('style') ?? '';
    const div = doc.createElement('div');
    div.setAttribute(
      'style',
      `${style};display:flex;align-items:center;justify-content:center;background:var(--img-safe, #EEF1F8);color:var(--ink-muted, #6B7280);font-family:var(--font-body, Inter, sans-serif);font-size:14px;text-align:center;padding:12px;box-sizing:border-box;`
    );
    div.textContent = placeholder;
    slot.replaceWith(div);
  }
}

/** Inlines every <img src="assets/..."> as a base64 data URI. */
function inlineImages(doc: Document) {
  const imgs = Array.from(doc.querySelectorAll('img[src^="assets/"]'));
  for (const img of imgs) {
    const src = img.getAttribute('src')!;
    img.setAttribute('src', assetToDataUri(src));
  }
}

function sectionToSlideHtml(section: Element, tokenCss: string): string {
  replaceImageSlots(section.ownerDocument as unknown as Document);
  inlineImages(section.ownerDocument as unknown as Document);

  // The section itself carries the slide's background/overflow style; drop
  // its outer <section> wrapper and use its innerHTML as the <body> content,
  // with the section's own style attribute reapplied to <body> so the
  // 1280x720 background/overflow rules still apply.
  const sectionStyle = section.getAttribute('style') ?? '';
  const inner = section.innerHTML;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
${GOOGLE_FONTS_IMPORT}
${tokenCss}
html, body { margin: 0; padding: 0; }
body { position: relative; width: 1280px; height: 720px; ${sectionStyle} }
</style>
</head>
<body>
${inner}
</body>
</html>`;
}

function slugifyLabel(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${String(index + 1).padStart(2, '0')}-${base || 'slide'}`;
}

function extractSlides(fileAbsPath: string, tokenCss: string) {
  const raw = readFileSync(fileAbsPath, 'utf-8');
  const { document } = parseHTML(raw);
  const sections = Array.from(document.querySelectorAll('x-import > section'));
  if (sections.length === 0) {
    throw new Error(`Nenhum <section> encontrado em ${fileAbsPath}`);
  }

  return sections.map((section, i) => {
    const label = section.getAttribute('data-label') ?? `Slide ${i + 1}`;
    const html = sectionToSlideHtml(section, tokenCss);
    return { label, html, sourceFile: slugifyLabel(label, i) };
  });
}

async function main() {
  const tokenCss = readTokenCss();

  const level = await prisma.level.upsert({
    where: { slug: 'basic-1' },
    update: {},
    create: { slug: 'basic-1', title: 'Basic 1', order: 1 },
  });

  let imported = 0;
  for (const deck of DECKS) {
    const fileAbsPath = join(SOURCE_DIR, deck.file);
    const slides = extractSlides(fileAbsPath, tokenCss);

    const unit = await prisma.unit.upsert({
      where: { levelId_slug: { levelId: level.id, slug: deck.unitSlug } },
      update: { title: deck.unitTitle },
      create: { levelId: level.id, slug: deck.unitSlug, title: deck.unitTitle, order: Number(deck.unitSlug.split('-')[1]) },
    });

    const lesson = await prisma.lesson.upsert({
      where: { unitId_slug: { unitId: unit.id, slug: deck.lessonSlug } },
      update: { title: deck.lessonTitle },
      create: {
        unitId: unit.id,
        slug: deck.lessonSlug,
        title: deck.lessonTitle,
        order: deck.lessonSlug.charCodeAt(deck.lessonSlug.length - 1) - 'a'.charCodeAt(0) + 1,
      },
    });

    const slideRows = slides.map((s, i) => ({
      id: `dc-import-${deck.unitSlug}-${deck.lessonSlug}-${deck.partSlug}-${i + 1}`,
      template: 'customHtml' as const,
      data: { html: s.html, sourceFile: s.sourceFile },
    }));

    const part = await prisma.part.upsert({
      where: { lessonId_slug: { lessonId: lesson.id, slug: deck.partSlug } },
      update: { title: deck.partTitle, slides: slideRows },
      create: {
        lessonId: lesson.id,
        slug: deck.partSlug,
        title: deck.partTitle,
        order: Number(deck.partSlug.split('-')[1]),
        slides: slideRows,
      },
    });

    console.log(`Imported ${deck.file} -> ${deck.unitSlug}/${deck.lessonSlug}/${deck.partSlug} (${slides.length} slides, part ${part.id})`);
    imported += 1;
  }

  console.log(`\nDone: ${imported} decks imported into level "basic-1".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
