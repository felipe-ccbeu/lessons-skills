/**
 * Dynamic-item-count renderer for model-example-list.html.
 *
 * Fills a "worked example + N practice items in the same shape" slide (e.g.
 * a notebook-exercise instruction slide: "Example: Neymar is brazilian, he
 * is a soccer player." followed by 3 more items students complete in the
 * same pattern). Distinct from Exercise1 (which pairs an original sentence
 * with its arrow-transformed rewrite) and from MultipleChoice/PracticeQaBadges
 * (which are question-driven) — this is a single flat list of same-shape
 * statements with one of them flagged as the worked model.
 *
 * `.ml-item` has a fixed CSS `height: 48px` but items stack via normal
 * document flow (no per-item `top:` offset), same shape as exercise-1.html
 * — only row height/font need to shrink once N exceeds the original 3.
 *
 * Usage:
 *   const { renderModelExampleList } = require('./model-example-list.render.js');
 *   const html = renderModelExampleList({
 *     breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · NOTEBOOK',
 *     title: 'Talk about nationalities and jobs',
 *     example: 'Neymar is brazilian, he is a soccer player.',
 *     items: [
 *       'Zhu Ting is chinese, she is a volleyball player.',
 *       'Ricky Rubio is spanish, he is a basketball player.',
 *       'Javier and Guillermo are soccer players, they are mexican.',
 *     ],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'model-example-list.html');

const BAND_TOP = 190;
const EXAMPLE_H = 68; // .ml-example padding + line-height + margin-bottom, roughly
const BAND_BOTTOM = 620;

const BASE_ITEMS = 3;
const BASE_ROW_H = 48;
const BASE_FONT_PT = 15;
const MIN_FONT_PT = 11;
const MIN_ROW_H = 32;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(n) {
  if (n <= BASE_ITEMS) return { rowH: BASE_ROW_H, fontPt: BASE_FONT_PT };
  const available = BAND_BOTTOM - BAND_TOP - EXAMPLE_H;
  const rowH = Math.max(MIN_ROW_H, Math.floor(available / n));
  const fontPt = Math.max(MIN_FONT_PT, Math.min(BASE_FONT_PT, Math.round(BASE_FONT_PT * (rowH / BASE_ROW_H))));
  return { rowH, fontPt };
}

function renderModelExampleList({ breadcrumb, title, example, items }) {
  if (!items || !items.length) throw new Error('renderModelExampleList requires a non-empty items array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const { rowH, fontPt } = computeGeometry(items.length);

  const itemsHtml = items
    .map((item, i) => {
      const rowStyle = rowH === BASE_ROW_H ? '' : ` style="height: ${rowH}px;"`;
      const fontStyle = fontPt === BASE_FONT_PT ? '' : ` style="font-size: ${fontPt}pt;"`;
      return `      <div class="ml-item"${rowStyle}><div class="ml-item-n">${i + 1}</div><div class="ml-item-text"${fontStyle}>${escapeHtml(item)}</div></div>`;
    })
    .join('\n');

  const listOpenMarker = '<div style="position: absolute; left: 80px; top: 190px; width: 1120px;">';
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const listStart = shell.indexOf(listOpenMarker);
  const listEnd = shell.indexOf(footerMarker);
  if (listStart === -1 || listEnd === -1 || listEnd < listStart) {
    throw new Error('renderModelExampleList: could not locate the list block in model-example-list.html — has the shell markup changed?');
  }

  const exampleBlockMarker = '<div class="ml-example"><div class="ml-example-label">Example</div><div class="ml-example-text">{{EXAMPLE}}</div></div>';
  const exampleBlock = exampleBlockMarker.replace('{{EXAMPLE}}', escapeHtml(example));

  const listCloseIdx = shell.lastIndexOf('</div>', listEnd);
  let filled =
    shell.slice(0, listStart) +
    listOpenMarker +
    '\n      ' +
    exampleBlock +
    '\n' +
    itemsHtml +
    '\n    ' +
    shell.slice(listCloseIdx, listEnd) +
    shell.slice(listEnd);

  filled = filled.replace('{{BREADCRUMB}}', escapeHtml(breadcrumb)).replace('{{TITLE}}', escapeHtml(title));

  return filled;
}

module.exports = { renderModelExampleList, computeGeometry };
