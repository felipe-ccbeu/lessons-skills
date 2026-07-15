/**
 * Dynamic-row renderer for exercise-1.html.
 *
 * The old template hardcoded exactly 5 `.ex-row` divs (ROW1_ORIG/HL/POST ...
 * ROW5_ORIG/HL/POST). `.ex-row` has a fixed CSS `height: 68px` but is laid
 * out by normal document flow (no per-row `top:` offset), so unlike
 * changeplaces/warmup-oral-transform this one doesn't need per-row position
 * math — rows just stack. Only the row height/font need to shrink once N
 * exceeds the original 5, to keep the list inside the content band.
 *
 * Usage:
 *   const { renderExercise1 } = require('./exercise-1.render.js');
 *   const html = renderExercise1({
 *     breadcrumb: 'UNIT 1 · LESSON A · PART 2 · PRACTICE',
 *     title: 'Transform the sentences',
 *     instructionPre: 'Rewrite each sentence using the',
 *     instructionHl: 'short form',
 *     instructionPost: '.',
 *     rows: [
 *       { orig: 'I am a teacher.', hl: "I'm", post: 'a teacher.' },
 *       ...
 *     ],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'exercise-1.html');
const TPL_OPEN = '<script type="__bundler/template">';

const BAND_TOP = 258;
const BAND_BOTTOM = 620;
const BAND_HEIGHT = BAND_BOTTOM - BAND_TOP;

const BASE_ROWS = 5;
const BASE_ROW_H = 68;
const BASE_FONT_PT = 14;
const MIN_FONT_PT = 10;
const MIN_ROW_H = 36;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(n) {
  if (n <= BASE_ROWS) {
    return { rowH: BASE_ROW_H, fontPt: BASE_FONT_PT };
  }
  const rowH = Math.max(MIN_ROW_H, Math.floor(BAND_HEIGHT / n));
  const fontPt = Math.max(MIN_FONT_PT, Math.min(BASE_FONT_PT, Math.round(BASE_FONT_PT * (rowH / BASE_ROW_H))));
  return { rowH, fontPt };
}

function renderExercise1({ breadcrumb, title, instructionPre, instructionHl, instructionPost, rows }) {
  if (!rows || !rows.length) {
    throw new Error('renderExercise1 requires a non-empty rows array');
  }

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const end = shell.lastIndexOf('</script>');
  const inner = JSON.parse(shell.slice(start, end));

  const { rowH, fontPt } = computeGeometry(rows.length);
  const rowsHtml = rows
    .map((row, i) => {
      const style = rowH === BASE_ROW_H ? '' : ` style="height: ${rowH}px;"`;
      const fontStyle = fontPt === BASE_FONT_PT ? '' : ` style="font-size: ${fontPt}pt;"`;
      return `      <div class="ex-row"${style}><div class="ex-n">${i + 1}</div><div class="ex-orig"${fontStyle}>${escapeHtml(row.orig)}</div><div class="ex-arrow">→</div><div class="ex-new"${fontStyle}><span class="pk">${escapeHtml(row.hl)}</span> ${escapeHtml(row.post)}</div></div>`;
    })
    .join('\n');

  const listOpenMarker = '<div style="position: absolute; left: 80px; top: 258px; width: 1120px;">';
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const listStart = inner.indexOf(listOpenMarker);
  const listEnd = inner.indexOf(footerMarker);
  if (listStart === -1 || listEnd === -1 || listEnd < listStart) {
    throw new Error('renderExercise1: could not locate the row-list block in exercise-1.html — has the shell markup changed?');
  }
  const listCloseIdx = inner.lastIndexOf('</div>', listEnd);
  let filled =
    inner.slice(0, listStart) +
    listOpenMarker +
    '\n' +
    rowsHtml +
    '\n    ' +
    inner.slice(listCloseIdx, listEnd) +
    inner.slice(listEnd);

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{INSTRUCTION_PRE}}', escapeHtml(instructionPre))
    .replace('{{INSTRUCTION_HL}}', escapeHtml(instructionHl))
    .replace('{{INSTRUCTION_POST}}', escapeHtml(instructionPost));

  return shell.slice(0, start) + JSON.stringify(filled) + shell.slice(end);
}

module.exports = { renderExercise1, computeGeometry };
