/**
 * One-off importer: converts the standalone "design canvas" lesson decks
 * (`*.dc.html` — multi-<section> files produced outside this repo's normal
 * html-to-pptx pipeline) into `Part.slides` rows.
 *
 * Sections whose structure is uniform across all 6 decks are mapped to real
 * presenter templates (structured, editable `data`, real entrance
 * animations): gettingStarted, objectives, rollCall, grammarBoxLook,
 * lessonComplete. Everything else falls back to a self-contained `customHtml`
 * slide (token CSS inlined, <img> assets inlined as base64, <image-slot>
 * replaced with a static gray placeholder) — still visually faithful, just
 * not field-editable.
 *
 * Run with: npx tsx scripts/import-dc-decks.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import type {
  Slide,
  GettingStartedData,
  ObjectivesData,
  RollCallData,
  GrammarBoxLookData,
  GrammarBoxLookRow,
  GrammarBoxLookTip,
  LessonCompleteData,
  LessonCompleteColumn,
} from '../src/lib/types.ts';

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

function replaceImageSlots(root: ParentNode) {
  const slots = Array.from(root.querySelectorAll('image-slot'));
  for (const slot of slots) {
    const placeholder = slot.getAttribute('placeholder') ?? 'Image';
    const style = slot.getAttribute('style') ?? '';
    const div = slot.ownerDocument!.createElement('div');
    div.setAttribute(
      'style',
      `${style};display:flex;align-items:center;justify-content:center;background:var(--img-safe, #EEF1F8);color:var(--ink-muted, #6B7280);font-family:var(--font-body, Inter, sans-serif);font-size:14px;text-align:center;padding:12px;box-sizing:border-box;`
    );
    div.textContent = placeholder;
    slot.replaceWith(div);
  }
}

function inlineImages(root: ParentNode) {
  const imgs = Array.from(root.querySelectorAll('img[src^="assets/"]'));
  for (const img of imgs) {
    const src = img.getAttribute('src')!;
    img.setAttribute('src', assetToDataUri(src));
  }
}

function sectionToSlideHtml(section: Element, tokenCss: string): string {
  replaceImageSlots(section);
  inlineImages(section);
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

function slugify(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${String(index + 1).padStart(2, '0')}-${base || 'slide'}`;
}

function text(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Inline `style` attributes in these decks inconsistently include a space after `:` — normalize before substring checks. */
function styleHas(el: Element, needle: string): boolean {
  const s = (el.getAttribute('style') ?? '').replace(/\s+/g, '');
  return s.includes(needle.replace(/\s+/g, ''));
}

const idGen = (deckKey: string, i: number) => `dc-${deckKey}-${i + 1}`;

// ---------------------------------------------------------------------------
// Per-pattern extractors. Each returns a Slide['data'] (without id/template)
// or null if the section doesn't actually match the expected shape (falls
// back to customHtml instead of producing a wrong/empty structured slide).
// ---------------------------------------------------------------------------

function extractBreadcrumb(section: Element): string {
  // The breadcrumb is the first absolutely-positioned flex row containing the
  // pink dot span — always the first such div in every section.
  const div = Array.from(section.querySelectorAll('div')).find((d) => d.querySelector(':scope > span'));
  return text(div);
}

function extractGettingStarted(section: Element): GettingStartedData | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1) return null;
  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    subtitle: text(p),
    imageUrl: '',
  };
}

function extractObjectives(section: Element): ObjectivesData | null {
  // 3 objective rows: <b>VERB</b> rest of sentence — the pink-highlighted
  // <b> at the start of each row is the verb, everything after is the text.
  const rows = Array.from(section.querySelectorAll('div[style*="flex-direction:column"] > div'));
  if (rows.length < 3) return null;
  const parts = rows.slice(0, 3).map((row) => {
    const b = row.querySelector('b');
    const verb = text(b);
    const full = text(row);
    const rest = full.startsWith(verb) ? full.slice(verb.length).trim() : full;
    return { verb, rest };
  });
  return {
    breadcrumb: extractBreadcrumb(section),
    obj1Verb: parts[0].verb,
    obj1Pre: '',
    obj1Hl: '',
    obj1Post: parts[0].rest,
    obj2Verb: parts[1].verb,
    obj2Text: parts[1].rest,
    obj3Verb: parts[2].verb,
    obj3Text: parts[2].rest,
  };
}

function extractRollCall(section: Element): RollCallData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;
  const bubbleDivs = Array.from(section.querySelectorAll('div')).filter((d) => {
    const style = d.getAttribute('style') ?? '';
    return style.includes('tint-blue-bubble') || style.includes('tint-pink-bubble');
  });
  if (bubbleDivs.length === 0) return null;
  const phrases = bubbleDivs.map((d) => text(d).replace(/_{2,}/g, '_____'));
  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    phrases,
    imageUrl: '',
  };
}

function splitOnFirstBold(el: Element): { pre: string; hl: string; post: string } {
  const b = el.querySelector('b, span[style*="pink"]');
  const hl = text(b);
  const full = text(el);
  const idx = hl ? full.indexOf(hl) : -1;
  if (idx < 0) return { pre: full, hl: '', post: '' };
  return { pre: full.slice(0, idx).trim(), hl, post: full.slice(idx + hl.length).trim() };
}

function extractGrammarBoxLook(section: Element): GrammarBoxLookData | null {
  // No real <table> in these decks — the "table" is a bordered div containing
  // one header row + N data rows, each row itself a flex div of 2 cell divs.
  const tableContainer = Array.from(section.querySelectorAll('div')).find((d) => {
    return styleHas(d, 'border:1px solid var(--border-hair)') && styleHas(d, 'border-radius:6px') && d.children.length >= 2;
  });
  if (!tableContainer) return null;
  const tableRows = Array.from(tableContainer.children).filter((c) => styleHas(c, 'display:flex'));
  if (tableRows.length < 2) return null;

  const [headerRow, ...dataRows] = tableRows;
  const tableHeader = text(headerRow.children[1] ?? headerRow);

  const rows: GrammarBoxLookRow[] = dataRows.map((row) => {
    const subject = text(row.children[0]);
    const { hl, post } = splitOnFirstBold(row.children[1] ?? row);
    return { subject, hl, text: post };
  });
  if (rows.length === 0) return null;

  // The two illustrated examples are <figure><image-slot/><figcaption>...</figcaption></figure>.
  const figures = Array.from(section.querySelectorAll('figure'));
  const [fig1, fig2] = figures;
  const ex1 = fig1 ? splitOnFirstBold(fig1.querySelector('figcaption') ?? fig1) : { pre: '', hl: '', post: '' };
  const ex2 = fig2 ? splitOnFirstBold(fig2.querySelector('figcaption') ?? fig2) : { pre: '', hl: '', post: '' };

  const topicHeader = Array.from(section.querySelectorAll('div')).find((d) => {
    return styleHas(d, 'font-weight:700') && styleHas(d, 'font-size:24px') && !d.querySelector('*');
  });

  // Tips box: pink icon column + a column of "He is → He's" rows (each row
  // is a flex div of 3 spans: full form, arrow, contracted form). Select only
  // the deepest rows (no descendant divs) to avoid also matching their
  // ancestor wrapper divs.
  const tipsContainer = Array.from(section.querySelectorAll('div')).find((d) => (d.getAttribute('style') ?? '').includes('tint-pink-soft'));
  // Second child of the tips box is the rows column (`flex:1 1 auto`); the
  // first child is the pink "TIPS!" icon/label — skip it entirely.
  const tipRowsColumn = tipsContainer?.children[1];
  const tipRows = tipRowsColumn ? Array.from(tipRowsColumn.children) : [];
  const tips: GrammarBoxLookTip[] = tipRows
    .map((row) => {
      const spans = Array.from(row.querySelectorAll('span'));
      const full = text(spans[0]);
      const short = text(spans[spans.length - 1]);
      return { full, short };
    })
    .filter((t) => t.full && t.short);

  return {
    breadcrumb: extractBreadcrumb(section),
    topicName: text(topicHeader),
    ex1Pre: ex1.pre,
    ex1Hl: ex1.hl,
    ex1Post: ex1.post,
    ex2Pre: ex2.pre,
    ex2Hl: ex2.hl,
    ex2Post: ex2.post,
    tableHeader,
    rows,
    tips,
    imageUrl1: '',
    imageUrl2: '',
  };
}

function extractLessonComplete(section: Element): LessonCompleteData | null {
  // 2-4 side-by-side columns (width varies: 520px for 2 columns, 350px for
  // 3...), each: an uppercase header label div + a flex-column of term rows
  // (each row = <b>term</b> rest.). Identify columns structurally instead of
  // by width.
  const containers = Array.from(section.querySelectorAll(':scope > div')).filter((d) => {
    if (d.children.length < 2) return false;
    return styleHas(d.children[0], 'text-transform:uppercase') && styleHas(d.children[1], 'flex-direction:column');
  });
  if (containers.length < 2) return null;

  const columns: LessonCompleteColumn[] = containers.map((col) => {
    const header = col.firstElementChild;
    const termsWrap = col.children[1];
    const rows = termsWrap ? Array.from(termsWrap.children) : [];
    const terms = rows.map((row) => {
      // Row text is "<optional plain prefix><b>highlighted part</b> rest." —
      // e.g. `She<b>'s not</b> Japanese.`. `t` is prefix+bold combined
      // ("She's not"), `d` is everything after the bold ("Japanese.").
      const bold = text(row.querySelector('b'));
      const full = text(row);
      const idx = bold ? full.indexOf(bold) : -1;
      if (idx < 0) return { t: full, d: '' };
      return { t: full.slice(0, idx + bold.length).trim(), d: full.slice(idx + bold.length).trim() };
    });
    return { header: text(header), terms };
  });

  return {
    breadcrumb: extractBreadcrumb(section),
    columns,
  };
}

// ---------------------------------------------------------------------------
// Dispatch: decide which extractor (if any) applies to a section, by its
// data-label. Falls back to customHtml when the label isn't recognized or
// the extractor bails out (returns null) because the structure diverged.
// ---------------------------------------------------------------------------

function extractSlideData(section: Element, tokenCss: string): { template: Slide['template']; data: unknown } {
  const label = (section.getAttribute('data-label') ?? '').trim();
  const background = section.getAttribute('style') ?? '';

  if (label === 'Opener' || label === 'Homework Check') {
    const data = extractGettingStarted(section);
    if (data) return { template: 'gettingStarted', data };
  }
  if (label === 'Objectives') {
    const data = extractObjectives(section);
    if (data) return { template: 'objectives', data };
  }
  if (label === 'Roll Call' && !background.includes('ccbeu-blue')) {
    const data = extractRollCall(section);
    if (data) return { template: 'rollCall', data };
  }
  if (label.startsWith('Grammar Box')) {
    const data = extractGrammarBoxLook(section);
    if (data) return { template: 'grammarBoxLook', data };
  }
  if (label === 'Lesson Complete') {
    const data = extractLessonComplete(section);
    if (data) return { template: 'lessonComplete', data };
  }

  return { template: 'customHtml', data: { html: sectionToSlideHtml(section, tokenCss), sourceFile: label } };
}

function extractSlides(fileAbsPath: string, tokenCss: string, deckKey: string): Slide[] {
  const raw = readFileSync(fileAbsPath, 'utf-8');
  const { document } = parseHTML(raw);
  const sections = Array.from(document.querySelectorAll('x-import > section'));
  if (sections.length === 0) throw new Error(`Nenhum <section> encontrado em ${fileAbsPath}`);

  return sections.map((section, i) => {
    const { template, data } = extractSlideData(section, tokenCss);
    return { id: idGen(deckKey, i), template, data } as Slide;
  });
}

async function main() {
  const tokenCss = readTokenCss();

  const level = await prisma.level.upsert({
    where: { slug: 'basic-1' },
    update: {},
    create: { slug: 'basic-1', title: 'Basic 1', order: 1 },
  });

  const templateCounts = new Map<string, number>();
  let imported = 0;

  for (const deck of DECKS) {
    const fileAbsPath = join(SOURCE_DIR, deck.file);
    const deckKey = `${deck.unitSlug}-${deck.lessonSlug}-${deck.partSlug}`;
    const slides = extractSlides(fileAbsPath, tokenCss, deckKey);

    for (const s of slides) {
      templateCounts.set(s.template, (templateCounts.get(s.template) ?? 0) + 1);
    }

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

    const part = await prisma.part.upsert({
      where: { lessonId_slug: { lessonId: lesson.id, slug: deck.partSlug } },
      update: { title: deck.partTitle, slides },
      create: {
        lessonId: lesson.id,
        slug: deck.partSlug,
        title: deck.partTitle,
        order: Number(deck.partSlug.split('-')[1]),
        slides,
      },
    });

    const structuredCount = slides.filter((s) => s.template !== 'customHtml').length;
    console.log(
      `Imported ${deck.file} -> ${deck.unitSlug}/${deck.lessonSlug}/${deck.partSlug} (${slides.length} slides, ${structuredCount} structured, part ${part.id})`
    );
    imported += 1;
  }

  console.log(`\nDone: ${imported} decks imported into level "basic-1".`);
  console.log('Template usage:', Object.fromEntries(templateCounts));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
