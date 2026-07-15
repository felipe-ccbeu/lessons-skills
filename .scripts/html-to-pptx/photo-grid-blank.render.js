/**
 * Dynamic-count renderer for photo-grid-blank.html.
 *
 * Fills a grid of N anonymous photos, each with a fill-in-the-blank caption
 * underneath (e.g. Exercise 1B(a): "___ Italian." / "___ Chinese." with 6
 * photos, no names — distinct from PhotoExerciseWhoIsThis, which is built
 * for exactly ONE named person per slide). The grid uses CSS `flex-wrap` so
 * items wrap naturally; this render function only decides how many columns
 * to target and computes photo/cell size accordingly, since flex-wrap alone
 * doesn't know how large to make each cell for a given N.
 *
 * Usage:
 *   const { renderPhotoGridBlank } = require('./photo-grid-blank.render.js');
 *   const html = renderPhotoGridBlank({
 *     breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · BOOK',
 *     title: "Complete the sentences with he's, she's, or they're.",
 *     items: [
 *       { answer: "He's", text: 'Italian.' },
 *       { answer: "She's", text: 'Chinese.' },
 *       ...
 *     ],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'photo-grid-blank.html');

const GRID_LEFT = 80;
const GRID_TOP = 180;
const GRID_WIDTH = 1120;
const GRID_BOTTOM = 620;
const GAP = 24;

const BASE_ITEMS = 4;
const BASE_CELL_W = 260;
const BASE_PHOTO_H = 170;
const BASE_FONT_PT = 13;
const MIN_FONT_PT = 10;
const MIN_PHOTO_H = 90;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Picks a column count that keeps rows roughly square-ish and fits the
// available vertical band, rather than always defaulting to the original
// 4-per-row layout once N grows past what fits in 2 rows at that width.
function computeColumns(n) {
  if (n <= 4) return Math.min(n, 4);
  if (n <= 6) return 3;
  if (n <= 8) return 4;
  return 5;
}

function computeGeometry(n) {
  const cols = computeColumns(n);
  const rows = Math.ceil(n / cols);
  const cellW = Math.floor((GRID_WIDTH - GAP * (cols - 1)) / cols);
  const availableH = GRID_BOTTOM - GRID_TOP;
  // Font only ever shrinks from the base as rows grow — more rows means less
  // vertical room per row, never more. (A previous version scaled by
  // 4/cols, which grew the font for narrower/more-numerous columns — e.g.
  // 3 columns produced 17pt, bigger than the 13pt base — and pushed captions
  // tall enough to collide with the footer credit on a 2-row, 6-item grid.)
  const fontPt = rows <= 1 ? BASE_FONT_PT : Math.max(MIN_FONT_PT, BASE_FONT_PT - (rows - 1) * 2);
  // Caption is a single line of body text at fontPt with a 12px top margin.
  // A line at Npt renders roughly 1.35*N px tall (font metrics + a little
  // leading) — measured empirically against rendered output after a flatter
  // 44px guess still let 2-row grids collide with the footer credit.
  const captionH = Math.round(fontPt * 1.35) + 12 + 10; // +10px extra safety gasket
  let photoH = Math.floor((availableH - GAP * (rows - 1)) / rows) - captionH;
  photoH = Math.max(MIN_PHOTO_H, Math.min(BASE_PHOTO_H, photoH));
  return { cellW, photoH, fontPt };
}

function renderPhotoGridBlank({ breadcrumb, title, items }) {
  if (!items || !items.length) throw new Error('renderPhotoGridBlank requires a non-empty items array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const { cellW, photoH, fontPt } = computeGeometry(items.length);
  const fontStyle = fontPt === BASE_FONT_PT ? '' : ` font-size: ${fontPt}pt;`;

  const cellsHtml = items
    .map(
      (item) => `      <div class="pg-cell" style="width: ${cellW}px;">
        <div class="pg-photo" style="width: ${cellW}px; height: ${photoH}px;">PHOTO</div>
        <p class="pg-caption" style="margin: 12px 0 0;${fontStyle}"><span class="gap">${escapeHtml(item.answer)}</span> ${escapeHtml(item.text)}</p>
      </div>`
    )
    .join('\n');

  const gridOpenMarker = `<div style="position: absolute; left: ${GRID_LEFT}px; top: ${GRID_TOP}px; width: ${GRID_WIDTH}px; display: flex; flex-wrap: wrap; gap: ${GAP}px;">`;
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const gridStart = shell.indexOf(gridOpenMarker);
  const gridEnd = shell.indexOf(footerMarker);
  if (gridStart === -1 || gridEnd === -1 || gridEnd < gridStart) {
    throw new Error('renderPhotoGridBlank: could not locate the grid block in photo-grid-blank.html — has the shell markup changed?');
  }
  const gridCloseIdx = shell.lastIndexOf('</div>', gridEnd);
  let filled =
    shell.slice(0, gridStart) +
    gridOpenMarker +
    '\n' +
    cellsHtml +
    '\n    ' +
    shell.slice(gridCloseIdx, gridEnd) +
    shell.slice(gridEnd);

  filled = filled.replace('{{BREADCRUMB}}', escapeHtml(breadcrumb)).replace('{{TITLE}}', escapeHtml(title));

  return filled;
}

module.exports = { renderPhotoGridBlank, computeGeometry, computeColumns };
