/**
 * Dynamic-column-count renderer for lesson-complete.html.
 *
 * The old template hardcoded exactly 4 fixed-position columns
 * (COL1-4_HEADER/T1-4/D1-3, asymmetric: column 1 has 4 term slots, columns
 * 2-4 have 3 each) at fixed x-offsets (80/370/625/917px) — a lesson that
 * only recaps 2 categories (e.g. Affirmatives/Negatives, not the full
 * Affirmatives/Questions/Wh-Questions/Other-Words set) left 2 columns
 * completely empty, wasting half the slide. This spreads however many
 * columns are actually given (1-4) evenly across the same content band,
 * and each column's own term count is elastic too (not fixed to 3/4).
 *
 * Usage:
 *   const { renderLessonComplete } = require('./lesson-complete.render.js');
 *   const html = renderLessonComplete({
 *     breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1',
 *     columns: [
 *       { header: 'AFFIRMATIVES', terms: [{ t: "She's", d: 'Spanish.' }, ...] },
 *       { header: 'NEGATIVES', terms: [{ t: "She's not", d: 'Japanese.' }, ...] },
 *     ],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'lesson-complete.html');
const TPL_OPEN = '<script type="__bundler/template">';

const BAND_LEFT = 80;
const BAND_RIGHT = 1157; // 917 + 240, the original 4th column's right edge
const BAND_TOP = 311;
const BAND_BOTTOM = 620;
const COL_GAP = 50;

const BASE_TERMS_PER_COL = 4;
const BASE_TERM_H = 12 + 16; // .term margin-bottom + roughly one line at 11pt
const MIN_FONT_PT = 9;
const BASE_FONT_PT = 11;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeColumnGeometry(numCols) {
  const totalGap = COL_GAP * (numCols - 1);
  const colWidth = Math.floor((BAND_RIGHT - BAND_LEFT - totalGap) / numCols);
  const xs = [];
  for (let i = 0; i < numCols; i++) xs.push(BAND_LEFT + i * (colWidth + COL_GAP));
  return { colWidth, xs };
}

function computeFontPt(maxTerms) {
  if (maxTerms <= BASE_TERMS_PER_COL) return BASE_FONT_PT;
  const available = BAND_BOTTOM - BAND_TOP - 16; // minus .cat margin-bottom
  const termH = Math.floor(available / maxTerms);
  return Math.max(MIN_FONT_PT, Math.min(BASE_FONT_PT, Math.round(BASE_FONT_PT * (termH / BASE_TERM_H))));
}

function renderColumn(col, x, width, fontPt) {
  const fontStyle = fontPt === BASE_FONT_PT ? '' : ` style="font-size: ${fontPt}pt;"`;
  const termsHtml = col.terms
    .map(
      (term) =>
        `      <div class="term"><b${fontStyle}>${escapeHtml(term.t)}</b><span${fontStyle}>${escapeHtml(term.d)}</span></div>`
    )
    .join('\n');
  return `    <div style="position: absolute; left: ${x}px; top: ${BAND_TOP}px; width: ${width}px;">
      <div class="cat">${escapeHtml(col.header)}</div>
${termsHtml}
    </div>`;
}

function renderLessonComplete({ breadcrumb, columns }) {
  if (!columns || !columns.length) throw new Error('renderLessonComplete requires a non-empty columns array');
  if (columns.length > 4) throw new Error('renderLessonComplete supports at most 4 columns (the template band cannot fit more)');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const payloadEnd = shell.indexOf('</script>', start);
  const inner = JSON.parse(shell.slice(start, payloadEnd));

  const { colWidth, xs } = computeColumnGeometry(columns.length);
  const maxTerms = Math.max(...columns.map((c) => c.terms.length));
  const fontPt = computeFontPt(maxTerms);

  const columnsHtml = columns.map((col, i) => renderColumn(col, xs[i], colWidth, fontPt)).join('\n\n');

  const col1Marker = '<!-- 4 columns -->';
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const colBlockStart = inner.indexOf(col1Marker);
  if (colBlockStart === -1) {
    throw new Error('renderLessonComplete: could not locate the "4 columns" marker in lesson-complete.html — has the shell markup changed?');
  }
  const colBlockEnd = inner.indexOf(footerMarker, colBlockStart);
  if (colBlockEnd === -1) {
    throw new Error('renderLessonComplete: could not locate the footer marker after the columns block — has the shell markup changed?');
  }

  let filled = inner.slice(0, colBlockStart) + col1Marker + '\n' + columnsHtml + '\n\n    ' + inner.slice(colBlockEnd);

  filled = filled.replace('{{BREADCRUMB}}', escapeHtml(breadcrumb));

  const serialized = JSON.stringify(filled).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + serialized + shell.slice(payloadEnd);
}

module.exports = { renderLessonComplete, computeColumnGeometry, computeFontPt };
