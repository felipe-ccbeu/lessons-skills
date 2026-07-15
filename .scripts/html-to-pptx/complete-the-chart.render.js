/**
 * Dynamic-row-per-group renderer for complete-the-chart.html.
 *
 * The template has 2 fixed groups (each with its own boxed table + a
 * separate associated image at a fixed position) — that part is NOT made
 * elastic here, since growing the number of GROUPS would require
 * re-deriving image/numbering positions the source design never specified
 * (the shipped template even has a half-finished "Group 3": an image +
 * number circle with no table, suggesting groups-count was already a rigid
 * assumption upstream). What this DOES make elastic is the number of ROWS
 * inside each group's table (hardcoded to exactly 2 per group before) —
 * `.cc-row` has a fixed CSS `height: 48px` but stacks via normal document
 * flow inside its bordered box, so more rows just make that one box taller
 * without touching the other group or either image.
 *
 * Usage:
 *   const { renderCompleteTheChart } = require('./complete-the-chart.render.js');
 *   const html = renderCompleteTheChart({
 *     breadcrumb: '...', title: 'Complete the chart',
 *     group1: { label: 'CONTRACTIONS', rows: [{ sentence: 'I am', answer: "I'm" }, ...] },
 *     group2: { label: 'NEGATIVES', rows: [{ sentence: 'I am not', answer: "I'm not" }, ...] },
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'complete-the-chart.html');
const TPL_OPEN = '<script type="__bundler/template">';

const BASE_ROWS_PER_GROUP = 2;
const BASE_ROW_H = 48;
const MIN_ROW_H = 30;
const BASE_FONT_PT = 13;
const MIN_FONT_PT = 10;

// Vertical room each group's box has before its own image (group1: image
// top 143px vs box top 210px is above it, so the real constraint is not
// colliding with group2's box at top 380px — 210 + 40 header + N*rowH must
// stay comfortably under 380). Kept conservative since the group's image is
// vertically centered alongside the box, not just below it.
const GROUP_HEADER_H = 40;
const GROUP1_TOP = 210;
const GROUP2_TOP = 380;
const MAX_GROUP_BOX_H = GROUP2_TOP - GROUP1_TOP - 20; // 150px, leaves a 20px gasket

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(n) {
  if (n <= BASE_ROWS_PER_GROUP) return { rowH: BASE_ROW_H, fontPt: BASE_FONT_PT };
  const available = MAX_GROUP_BOX_H - GROUP_HEADER_H;
  const rowH = Math.max(MIN_ROW_H, Math.floor(available / n));
  const fontPt = Math.max(MIN_FONT_PT, Math.min(BASE_FONT_PT, Math.round(BASE_FONT_PT * (rowH / BASE_ROW_H))));
  return { rowH, fontPt };
}

function renderGroupRows(rows) {
  const { rowH, fontPt } = computeGeometry(rows.length);
  return rows
    .map((row, i) => {
      const bg = i % 2 === 0 ? '#fff' : 'var(--surface-zebra)';
      const style = rowH === BASE_ROW_H && fontPt === BASE_FONT_PT ? '' : ` height: ${rowH}px; font-size: ${fontPt}pt;`;
      return `      <div class="cc-row" style="background: ${bg};${style}">${escapeHtml(row.sentence)} (= <span class="cc-ans">&nbsp;${escapeHtml(row.answer)}</span>)</div>`;
    })
    .join('\n');
}

function renderCompleteTheChart({ breadcrumb, title, group1, group2 }) {
  if (!group1 || !group1.rows || !group1.rows.length) throw new Error('renderCompleteTheChart requires group1.rows to be non-empty');
  if (!group2 || !group2.rows || !group2.rows.length) throw new Error('renderCompleteTheChart requires group2.rows to be non-empty');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const payloadEnd = shell.indexOf('</script>', start);
  const inner = JSON.parse(shell.slice(start, payloadEnd));

  // Match structurally (regex across the 2 hardcoded rows) rather than a
  // literal string, since the exact whitespace/indentation inside the
  // bundler-decoded payload doesn't necessarily match templates-tokens.json's
  // pretty-printed body (that index re-formats for readability).
  const group1Re = /<div class="cc-row"[^>]*>\{\{GROUP1_ROW1_SENTENCE\}\}[\s\S]*?\{\{GROUP1_ROW2_ANSWER\}\}<\/span>\)<\/div>/;
  const group2Re = /<div class="cc-row"[^>]*>\{\{GROUP2_ROW1_SENTENCE\}\}[\s\S]*?\{\{GROUP2_ROW2_ANSWER\}\}<\/span>\)<\/div>/;

  if (!group1Re.test(inner) || !group2Re.test(inner)) {
    throw new Error('renderCompleteTheChart: could not locate the group row blocks in complete-the-chart.html — has the shell markup changed?');
  }

  let filled = inner
    .replace(group1Re, renderGroupRows(group1.rows))
    .replace(group2Re, renderGroupRows(group2.rows));

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{GROUP1_LABEL}}', escapeHtml(group1.label))
    .replace('{{GROUP2_LABEL}}', escapeHtml(group2.label));

  const serialized = JSON.stringify(filled).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + serialized + shell.slice(payloadEnd);
}

module.exports = { renderCompleteTheChart, computeGeometry };
