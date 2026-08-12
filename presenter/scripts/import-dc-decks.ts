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
  Exercise1Data,
  ExerciseRow,
  GettingStartedData,
  ObjectivesData,
  RollCallData,
  GrammarBoxLookData,
  GrammarBoxLookRow,
  GrammarBoxLookTip,
  LessonCompleteData,
  LessonCompleteColumn,
  ChangePlacesData,
  PhotoExerciseWhoIsThisData,
  MatchVocabImageData,
  MatchingWithChartData,
  MatchingWithChartRow,
  PhotoGridBlankData,
  PhotoGridBlankItem,
  ModelExampleListData,
  SectionTransitionData,
  Fluency2Data,
  Fluency3Data,
  GrammarBox2YesNoData,
  GrammarBox2YesNoRow,
  GuessFourImagesData,
  LookLightData,
  LookLightExample,
  DialoguePracticeData,
  DialoguePracticeLine,
  RevealCardGridData,
  RevealCardGridItem,
  PhotoLabelGridData,
  PhotoLabelGridItem,
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
  const colWrapper = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'flex-direction:column'));
  const rows = colWrapper ? Array.from(colWrapper.children) : [];
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

function extractChangePlaces(section: Element): ChangePlacesData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;
  const instructionP = section.querySelector('p');
  const title = instructionP ? `${text(h1)} ${text(instructionP)}`.trim() : text(h1);

  // Sub-pattern A: a numbered list — <div><span>N</span>sentence</div> rows,
  // all siblings inside one wrapper div.
  const numberedRows = Array.from(section.querySelectorAll('div > span'))
    .filter((s) => styleHas(s, 'width:28px'))
    .map((span) => {
      const row = span.parentElement!;
      const label = text(span);
      const sentence = text(row).slice(label.length).trim();
    return { label, sentence };
  });
  if (numberedRows.length >= 2) {
    return { breadcrumb: extractBreadcrumb(section), title, rows: numberedRows };
  }

  // Sub-pattern B: 3 labeled boxes — <div>bar + <div>Label:</div> + <div>sentence</div></div>.
  const boxes = Array.from(section.querySelectorAll('div')).filter((d) => styleHas(d, 'tint-pink-soft'));
  if (boxes.length >= 2) {
    const boxRows = boxes.map((box) => {
      const children = Array.from(box.children).filter((c) => text(c));
      const label = text(children[0]).replace(/:$/, '');
      const sentence = text(children[1]);
      return { label, sentence };
    });
    return { breadcrumb: extractBreadcrumb(section), title: text(h1), rows: boxRows };
  }

  return null;
}

function extractPhotoExerciseWhoIsThis(section: Element): PhotoExerciseWhoIsThisData | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1 || !p) return null;

  // Name + role are the two pink 27px divs right after the h1 (excluding the
  // breadcrumb, which is also pink-dotted but has a different font-size).
  const pinkDivs = Array.from(section.querySelectorAll('div')).filter((d) => styleHas(d, 'color:var(--ccbeu-pink)') && styleHas(d, 'font-weight:700') && !d.querySelector('*'));
  if (pinkDivs.length < 2) return null;
  const [nameDiv, roleDiv] = pinkDivs;

  const gapSpan = p.querySelector('span');
  const gap = text(gapSpan);
  const fullSentence = text(p);
  const idx = gap ? fullSentence.indexOf(gap) : -1;
  const sentencePre = idx < 0 ? fullSentence : fullSentence.slice(0, idx).trim();

  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    personName: text(nameDiv),
    personRole: text(roleDiv),
    sentencePre,
    sentenceGap: gap,
    imageUrl: '',
  };
}

function extractMatchVocabImage(section: Element): MatchVocabImageData | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1 || !p) return null;
  const badgeContainer = Array.from(section.querySelectorAll('div')).find((d) => {
    return styleHas(d, 'flex-direction:column') && d.children.length >= 2 && Array.from(d.children).every((c) => styleHas(c, 'tint-blue-bubble'));
  });
  if (!badgeContainer) return null;
  const keywords = Array.from(badgeContainer.children).map((c) => text(c));
  if (keywords.length === 0) return null;

  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    instruction: text(p),
    keywords,
    answers: keywords,
    imageUrl: '',
  };
}

function extractMatchingWithChart(section: Element): MatchingWithChartData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;

  // Two labeled instruction lines: <span>letter</span><span>label text</span>,
  // each followed by its own content block. First is the match section
  // (numbered prompts + lettered options), second is the chart.
  const instructionRows = Array.from(section.querySelectorAll('div')).filter((d) => {
    if (d.children.length !== 2) return false;
    const [a, b] = Array.from(d.children);
    return a.tagName === 'SPAN' && b.tagName === 'SPAN' && styleHas(a, 'color:var(--ccbeu-pink)');
  });
  if (instructionRows.length < 2) return null;
  const matchLabel = text(instructionRows[0].children[1]);
  const chartLabel = text(instructionRows[1].children[1]);

  // Numbered prompts / lettered options: rows of <div><span>N or letter</span><span>text</span></div>,
  // grouped in two flex-column wrappers right after the match instruction row.
  const numberOrLetterRows = Array.from(section.querySelectorAll('div > span'))
    .filter((s) => styleHas(s, 'font-family:var(--font-title)') && styleHas(s, 'font-weight:700') && styleHas(s, 'color:var(--ccbeu-blue)'))
    .map((s) => s.parentElement!)
    .filter((row) => row.children.length === 2);
  const prompts = numberOrLetterRows.filter((row) => /^\d+$/.test(text(row.children[0])));
  const options = numberOrLetterRows.filter((row) => /^[a-z]$/.test(text(row.children[0])));
  if (prompts.length === 0 || options.length === 0) return null;
  const matchPrompts = prompts.map((row) => text(row.children[1]));
  const matchOptions = options.map((row) => text(row.children[1]));

  // Chart table: bordered div, first child is the "+"/header bar (skip),
  // remaining children are flex rows of 2 cell divs.
  const tableContainer = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'border-radius:8px') && styleHas(d, 'overflow:hidden') && styleHas(d, 'border:1pxsolidvar(--border-hair)'));
  if (!tableContainer) return null;
  const chartDataRows = Array.from(tableContainer.children)
    .slice(1)
    .filter((c) => styleHas(c, 'display:flex'));
  const chartRows: MatchingWithChartRow[] = chartDataRows.map((row) => {
    const label = text(row.children[0]);
    const answer = text(row.children[1]).replace(/^\d+\s*/, '');
    return { label, answer };
  });
  if (chartRows.length === 0) return null;

  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    matchLabel,
    matchPrompts,
    matchOptions,
    matchAnswerKey: '',
    chartLabel,
    chartRows,
  };
}

function extractPhotoGridBlank(section: Element): PhotoGridBlankData | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1) return null;
  // <p> often starts with a single letter list marker ("a  Complete...") — drop it.
  const instruction = p ? text(p).replace(/^[a-z]\s+/, '') : '';
  const title = instruction ? `${text(h1)}. ${instruction}`.trim() : text(h1);

  const grid = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'display:grid') && styleHas(d, 'grid-template-columns'));
  if (!grid) return null;
  // Each grid cell is <div><div>photo</div><div><span>N</span><span><b>answer</b> rest.</span></div></div>.
  const items: PhotoGridBlankItem[] = Array.from(grid.children)
    .map((cell) => {
      const textRow = cell.children[1];
      if (!textRow) return null;
      const textSpan = textRow.children[1]; // second span: <b>answer</b> rest.
      if (!textSpan) return null;
      const bold = text(textSpan.querySelector('b'));
      const full = text(textSpan);
      const idx = bold ? full.indexOf(bold) : -1;
      const rest = idx < 0 ? full : full.slice(idx + bold.length).trim();
      return { answer: bold, text: rest, imageUrl: '' };
    })
    .filter((it): it is PhotoGridBlankItem => !!it && !!it.answer);
  if (items.length === 0) return null;

  return { breadcrumb: extractBreadcrumb(section), title, items };
}

function extractExercise1(section: Element): Exercise1Data | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1) return null;
  const instructionPre = p ? text(p).replace(/^[a-z]\s+/, '') : '';

  // Numbered sentence rows: <div><span>N</span><span>orig <b>hl</b> post</span></div>,
  // all siblings inside one flex-column wrapper.
  const wrapper = Array.from(section.querySelectorAll('div')).find(
    (d) => styleHas(d, 'flex-direction:column') && d.children.length > 0 && Array.from(d.children).every((c) => c.children.length === 2 && /^\d+$/.test(text(c.children[0])))
  );
  if (!wrapper) return null;

  const rows: ExerciseRow[] = Array.from(wrapper.children).map((row) => {
    const textSpan = row.children[1];
    const bold = text(textSpan.querySelector('b'));
    const full = text(textSpan);
    const idx = bold ? full.indexOf(bold) : -1;
    if (idx < 0) return { orig: full, hl: '', post: '' };
    return { orig: full.slice(0, idx).trim(), hl: bold, post: full.slice(idx + bold.length).trim() };
  });
  if (rows.length === 0) return null;

  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    instructionPre,
    instructionHl: '',
    instructionPost: '',
    rows,
  };
}

function extractModelExampleList(section: Element): ModelExampleListData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;
  const exampleBox = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'surface-zebra') && styleHas(d, 'border-radius:12px'));
  if (!exampleBox) return null;
  const example = text(exampleBox).replace(/^Example:\s*/, '');

  // Numbered item rows: <div><span>circle N</span><div>sentence</div></div>,
  // inside a flex-column wrapper.
  const wrapper = Array.from(section.querySelectorAll('div')).find(
    (d) => styleHas(d, 'flex-direction:column') && d.children.length > 0 && Array.from(d.children).every((c) => c.children.length === 2 && styleHas(c.children[0] as Element, 'border-radius:999px'))
  );
  if (!wrapper) return null;
  const items = Array.from(wrapper.children).map((row) => text(row.children[1]));
  if (items.length === 0) return null;

  return { breadcrumb: extractBreadcrumb(section), title: text(h1), example, items };
}

function extractSectionTransition(section: Element): SectionTransitionData | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1) return null;
  // Bail if there's an image-slot — that visual weight is lost entirely by
  // this template (no image field), better left as customHtml.
  if (section.querySelector('image-slot')) return null;
  return {
    breadcrumb: extractBreadcrumb(section),
    tag: '',
    title: text(h1),
    subtitle: text(p),
  };
}

function extractFluency2(section: Element): Fluency2Data | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1 || !p) return null;
  if (!section.querySelector('image-slot')) return null;
  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    instructionPre: text(p),
    instructionHl: '',
    imageUrl: '',
  };
}

function extractFluency3(section: Element): Fluency3Data | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1) return null;
  const slots = section.querySelectorAll('image-slot');
  if (slots.length !== 2) return null;
  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    instruction: text(p),
    imageUrl1: '',
    imageUrl2: '',
  };
}

function extractGrammarBox2YesNo(section: Element): GrammarBox2YesNoData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;
  const tableContainer = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'border-radius:8px') && styleHas(d, 'overflow:hidden') && styleHas(d, 'border:1pxsolidvar(--border-hair)') && d.children.length >= 2);
  if (!tableContainer) return null;
  const rowsEl = Array.from(tableContainer.children).filter((c) => styleHas(c, 'display:flex'));
  if (rowsEl.length < 2) return null;

  const [headerRow, ...dataRows] = rowsEl;
  const col2Header = text(headerRow.children[1]);
  const col3Header = text(headerRow.children[2]);

  const rows: GrammarBox2YesNoRow[] = dataRows.map((row) => {
    const subject = text(row.children[0]);
    const q = splitOnFirstBold(row.children[1]);
    const answerCell = row.children[2];
    const answerItalics = Array.from(answerCell.querySelectorAll('i'));
    const yesText = answerItalics[0] ? splitOnFirstBold(answerItalics[0]) : { pre: '', hl: '' };
    const noText = answerItalics[1] ? splitOnFirstBold(answerItalics[1]) : { pre: '', hl: '' };
    return {
      subject,
      qHl: q.hl,
      qPost: q.post,
      aPre: yesText.pre.replace(/,$/, ''),
      aYes: yesText.hl,
      aMid: noText.pre.replace(/,$/, ''),
      aNo: noText.hl,
    };
  });
  if (rows.length === 0) return null;

  return {
    breadcrumb: extractBreadcrumb(section),
    photo1Caption: rows[0] ? `"${rows[0].qHl} ${rows[0].qPost}"` : '',
    photo2Caption: rows[1] ? `"${rows[1].qHl} ${rows[1].qPost}"` : '',
    col2Header,
    col3Header,
    rows,
    imageUrl1: '',
    imageUrl2: '',
  };
}

function extractGuessFourImages(section: Element): GuessFourImagesData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;
  const slots = section.querySelectorAll('image-slot');
  if (slots.length !== 4) return null;
  const exampleBox = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'tint-blue-bubble') && d.children.length === 2 && text(d.children[0]).trim() === 'Ex.');
  if (!exampleBox) return null;
  const example = splitOnFirstBold(exampleBox.children[1]);

  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    instruction: '',
    examplePre: example.hl ? example.pre : text(exampleBox.children[1]),
    exampleHl: example.hl,
    imageUrls: ['', '', '', ''],
  };
}

function extractLookLight(section: Element): LookLightData | null {
  // Colored bubble boxes (blue/pink alternating) with a bold highlighted word
  // each, plus a tip paragraph and 1-2 photos. No table — that's what
  // distinguishes this pattern from grammarBoxLook.
  const exampleBoxes = Array.from(section.querySelectorAll('div')).filter((d) => styleHas(d, 'tint-blue-bubble') || styleHas(d, 'tint-pink-bubble'));
  if (exampleBoxes.length === 0) return null;
  const tip = section.querySelector('p');
  if (!tip) return null;

  const examples: LookLightExample[] = exampleBoxes.map((box) => {
    const bold = text(box.querySelector('b'));
    const full = text(box);
    const idx = bold ? full.indexOf(bold) : -1;
    if (idx < 0) return { pre: full, hl: '', post: '' };
    return { pre: full.slice(0, idx).trim(), hl: bold, post: full.slice(idx + bold.length).trim() };
  });

  const imageUrls = Array.from(section.querySelectorAll('image-slot')).map(() => '');
  if (imageUrls.length === 0) return null;

  return {
    breadcrumb: extractBreadcrumb(section),
    examples,
    tip: text(tip),
    imageUrls,
  };
}

function extractDialoguePractice(section: Element): DialoguePracticeData | null {
  const h1 = section.querySelector('h1');
  const p = section.querySelector('p');
  if (!h1 || !p) return null;

  const wordBankBox = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'tint-blue-bubble') && d.children.length > 0 && Array.from(d.children).every((c) => c.tagName === 'SPAN'));
  if (!wordBankBox) return null;
  const wordBank = Array.from(wordBankBox.children).map((c) => text(c));

  const linesWrapper = Array.from(section.querySelectorAll('div')).find(
    (d) => styleHas(d, 'flex-direction:column') && d.children.length >= 2 && Array.from(d.children).every((c) => c.querySelector('b'))
  );
  if (!linesWrapper) return null;

  const lines: DialoguePracticeLine[] = Array.from(linesWrapper.children).map((row) => {
    const boldEls = Array.from(row.querySelectorAll('b'));
    // Speaker span has no fixed gap to the line text in the renderer, so give
    // it visible trailing whitespace here (source itself uses &nbsp;&nbsp;
    // for this) — a single space collapses invisibly once rendered as HTML.
    const speaker = `${text(boldEls[0]).trim()}  `;
    // Walk the row's child nodes, splitting into text/hl parts. Skip the
    // first <b> (the speaker label already extracted above). Only collapse
    // internal whitespace — do NOT trim node-by-node, or the space that
    // separates plain text from an adjacent <b> highlight is lost.
    const parts: DialoguePracticeLine['textParts'] = [];
    let sawSpeaker = false;
    for (const node of Array.from(row.childNodes)) {
      if (node.nodeType === 1 && (node as Element).tagName === 'B') {
        if (!sawSpeaker) {
          sawSpeaker = true;
          continue;
        }
        parts.push({ hl: text(node as Element) });
      } else {
        const t = (node.textContent ?? '').replace(/\s+/g, ' ');
        if (t.trim()) parts.push(t);
      }
    }
    return { speaker, textParts: parts };
  });
  if (lines.length === 0) return null;

  return {
    breadcrumb: extractBreadcrumb(section),
    title: text(h1),
    instruction: text(p),
    wordBank,
    lines,
  };
}

function extractRevealCardGrid(section: Element): RevealCardGridData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;
  const grid = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'display:grid') && styleHas(d, 'grid-template-columns'));
  if (!grid) return null;

  const items: RevealCardGridItem[] = Array.from(grid.children)
    .map((card) => {
      const textCol = card.children[1];
      if (!textCol) return null;
      const term = text(textCol.children[0]);
      const answer = text(textCol.children[1]); // inside <sc-if>, still queryable
      if (!term) return null;
      return { imageUrl: '', term, answer: answer || term };
    })
    .filter((it): it is RevealCardGridItem => !!it);
  if (items.length === 0) return null;

  return { breadcrumb: extractBreadcrumb(section), title: text(h1), items };
}

function extractPhotoLabelGrid(section: Element): PhotoLabelGridData | null {
  const h1 = section.querySelector('h1');
  if (!h1) return null;
  // Each item is <figure><div>photo</div><figcaption>caption</figcaption></figure>.
  const figures = Array.from(section.querySelectorAll('figure'));
  if (figures.length < 2) return null;

  const items: PhotoLabelGridItem[] = figures
    .map((fig) => ({ imageUrl: '', caption: text(fig.querySelector('figcaption')) }))
    .filter((it) => it.caption);
  if (items.length !== figures.length || items.length === 0) return null;

  return { breadcrumb: extractBreadcrumb(section), title: text(h1), items };
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
    const cell = row.children[1] ?? row;
    // Some decks highlight the whole cell (a plain <div style="color:pink">)
    // instead of wrapping a <b> inside a longer sentence — splitOnFirstBold
    // only looks for <b>, so in that case treat the whole cell as the hl.
    const wholeCellIsHighlight = !cell.querySelector('b') && styleHas(cell, 'ccbeu-pink');
    if (wholeCellIsHighlight) {
      return { subject, hl: text(cell), text: '' };
    }
    const { hl, post } = splitOnFirstBold(cell);
    return { subject, hl, text: post };
  });
  if (rows.length === 0) return null;

  // The two illustrated examples are <figure><image-slot/><figcaption>...</figcaption></figure>.
  const figures = Array.from(section.querySelectorAll('figure'));
  const [fig1, fig2] = figures;
  const ex1 = fig1 ? splitOnFirstBold(fig1.querySelector('figcaption') ?? fig1) : { pre: '', hl: '', post: '' };
  const ex2 = fig2 ? splitOnFirstBold(fig2.querySelector('figcaption') ?? fig2) : { pre: '', hl: '', post: '' };

  // Some decks wrap the topic text in an inner <span> (<div ...><span>Plurals</span></div>);
  // don't require "no element children", just match on the distinctive style.
  const topicHeader = Array.from(section.querySelectorAll('div')).find((d) => styleHas(d, 'font-weight:700') && styleHas(d, 'font-size:24px'));

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
  if (label.startsWith('LOOK')) {
    const data = extractLookLight(section);
    if (data) return { template: 'lookLight', data };
  }
  if (label.includes('Conversation') || label.includes('Dialogue')) {
    const data = extractDialoguePractice(section);
    if (data) return { template: 'dialoguePractice', data };
  }
  if (label.startsWith('Plural Quiz')) {
    const data = extractRevealCardGrid(section);
    if (data) return { template: 'revealCardGrid', data };
  }
  if (label.startsWith('Vocabulary')) {
    const data = extractPhotoLabelGrid(section);
    if (data) return { template: 'photoLabelGrid', data };
  }
  if (label === 'Lesson Complete') {
    const data = extractLessonComplete(section);
    if (data) return { template: 'lessonComplete', data };
  }
  if (label.startsWith('Warm-up') || label.startsWith('Change the Sentences')) {
    const data = extractChangePlaces(section);
    if (data) return { template: 'changePlaces', data };
  }
  if (label.startsWith('Who is this?')) {
    const data = extractPhotoExerciseWhoIsThis(section);
    if (data) return { template: 'photoExerciseWhoIsThis', data };
  }
  if (label === 'Match' || label === 'Pronunciation') {
    const data = extractMatchVocabImage(section);
    if (data) return { template: 'matchVocabImage', data };
  }
  if (label.startsWith('Exercise 2A') || label.startsWith('Exercise 2B')) {
    const chartData = extractMatchingWithChart(section);
    if (chartData) return { template: 'matchingWithChart', data: chartData };
  }
  if (label.startsWith('Exercise')) {
    const gridData = extractPhotoGridBlank(section);
    if (gridData) return { template: 'photoGridBlank', data: gridData };
  }
  if (label.startsWith('Exercise') || label.includes('sentences') || label.includes('Sentences')) {
    const data = extractExercise1(section);
    if (data) return { template: 'exercise1', data };
  }
  if (label === 'Practice') {
    const data = extractModelExampleList(section);
    if (data) return { template: 'modelExampleList', data };
  }
  if (label.startsWith("Let's Play") || label.startsWith("Let's play") || label.startsWith('Fluency')) {
    const f2 = extractFluency2(section);
    if (f2) return { template: 'fluency2', data: f2 };
  }
  if (label === 'Not OK at the Airport') {
    const f3 = extractFluency3(section);
    if (f3) return { template: 'fluency3', data: f3 };
  }
  if (label.startsWith('Yes/No Questions')) {
    const data = extractGrammarBox2YesNo(section);
    if (data) return { template: 'grammarBox2YesNo', data };
  }
  if (label.startsWith('Pair Work')) {
    const data = extractGuessFourImages(section);
    if (data) return { template: 'guessFourImages', data };
  }
  if (label === 'Choose 3 people' || label === 'Assign Practice' || label.startsWith("Let's Play") || label.startsWith("Let's play")) {
    const data = extractSectionTransition(section);
    if (data) return { template: 'sectionTransition', data };
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
