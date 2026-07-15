/**
 * Dynamic-row renderer for practice-qa-badges.html.
 *
 * The old template hardcoded exactly 4 `.pr-row` divs (ROW1-4: QUESTION /
 * YES answer badge / NO answer badge). `.pr-row` has a fixed CSS
 * `height: 78px` but rows stack via normal document flow (no per-row `top:`
 * offset), same shape as exercise-1.html — only row height/font need to
 * shrink once N exceeds the original 4.
 *
 * Usage:
 *   const { renderPracticeQaBadges } = require('./practice-qa-badges.render.js');
 *   const html = renderPracticeQaBadges({
 *     breadcrumb: '...', title: 'Ask and answer!',
 *     rows: [{ question: 'Are you a student?', yes: 'Yes, I am.', no: "No, I'm not." }, ...],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'practice-qa-badges.html');
const TPL_OPEN = '<script type="__bundler/template">';

const BAND_TOP = 280;
const BAND_BOTTOM = 620;
const BAND_HEIGHT = BAND_BOTTOM - BAND_TOP;

const BASE_ROWS = 4;
const BASE_ROW_H = 78;
const BASE_FONT_PT = 14; // .pr-q font-size, the largest of the three cell fonts
const MIN_FONT_PT = 10;
const MIN_ROW_H = 36;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(n) {
  if (n <= BASE_ROWS) return { rowH: BASE_ROW_H, fontPt: BASE_FONT_PT };
  const rowH = Math.max(MIN_ROW_H, Math.floor(BAND_HEIGHT / n));
  const fontPt = Math.max(MIN_FONT_PT, Math.min(BASE_FONT_PT, Math.round(BASE_FONT_PT * (rowH / BASE_ROW_H))));
  return { rowH, fontPt };
}

function renderPracticeQaBadges({ breadcrumb, title, rows }) {
  if (!rows || !rows.length) throw new Error('renderPracticeQaBadges requires a non-empty rows array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const payloadEnd = shell.indexOf('</script>', start);
  const inner = JSON.parse(shell.slice(start, payloadEnd));

  const { rowH, fontPt } = computeGeometry(rows.length);
  const rowsHtml = rows
    .map((row, i) => {
      const rowStyle = rowH === BASE_ROW_H ? '' : ` style="height: ${rowH}px;"`;
      const fontStyle = fontPt === BASE_FONT_PT ? '' : ` style="font-size: ${fontPt}pt;"`;
      return `      <div class="pr-row"${rowStyle}><div class="pr-n">${i + 1}</div><div class="pr-q"${fontStyle}>${escapeHtml(row.question)}</div><div class="pr-yes"${fontStyle}>${escapeHtml(row.yes)}</div><div class="pr-no"${fontStyle}>${escapeHtml(row.no)}</div></div>`;
    })
    .join('\n');

  const listOpenMarker = '<div style="position: absolute; left: 80px; top: 280px; width: 1120px;">';
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const listStart = inner.indexOf(listOpenMarker);
  const listEnd = inner.indexOf(footerMarker);
  if (listStart === -1 || listEnd === -1 || listEnd < listStart) {
    throw new Error('renderPracticeQaBadges: could not locate the row-list block in practice-qa-badges.html — has the shell markup changed?');
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

  filled = filled.replace('{{BREADCRUMB}}', escapeHtml(breadcrumb)).replace('{{TITLE}}', escapeHtml(title));

  const serialized = JSON.stringify(filled).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + serialized + shell.slice(payloadEnd);
}

module.exports = { renderPracticeQaBadges, computeGeometry };
