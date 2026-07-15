/**
 * Dynamic-option-count renderer for multiple-choice.html.
 *
 * Fills a "quiz question + N lettered options" slide (e.g. "Books closed! Do
 * you remember? / Is Heather Watson a _______? / Baseball player. / Tennis
 * player. / Basketball player." from a Books-closed recall quiz). No answer
 * is marked correct in the rendered slide — this is a question for the class
 * to answer aloud, not an answer key (matches the source lesson pattern this
 * template was built for: the correct answer was never written on the slide
 * itself, only known to the teacher).
 *
 * `.mc-opt` has a fixed CSS `height: 56px` but options stack via normal
 * document flow (no per-option `top:` offset), same shape as exercise-1.html
 * — only row height/font need to shrink once N exceeds the original 3.
 *
 * Usage:
 *   const { renderMultipleChoice } = require('./multiple-choice.render.js');
 *   const html = renderMultipleChoice({
 *     breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · RECAP',
 *     tag: 'Books closed! Do you remember?',
 *     question: 'Is Heather Watson a _______?',
 *     options: ['Baseball player.', 'Tennis player.', 'Basketball player.'],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'multiple-choice.html');

const BAND_TOP = 320;
const BAND_BOTTOM = 620;
const BAND_HEIGHT = BAND_BOTTOM - BAND_TOP;

const BASE_OPTIONS = 3;
const BASE_ROW_H = 56;
const BASE_FONT_PT = 15;
const MIN_FONT_PT = 11;
const MIN_ROW_H = 34;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(n) {
  if (n <= BASE_OPTIONS) return { rowH: BASE_ROW_H, fontPt: BASE_FONT_PT };
  const rowH = Math.max(MIN_ROW_H, Math.floor(BAND_HEIGHT / n));
  const fontPt = Math.max(MIN_FONT_PT, Math.min(BASE_FONT_PT, Math.round(BASE_FONT_PT * (rowH / BASE_ROW_H))));
  return { rowH, fontPt };
}

function renderMultipleChoice({ breadcrumb, tag, question, options }) {
  if (!options || !options.length) throw new Error('renderMultipleChoice requires a non-empty options array');
  if (options.length > LETTERS.length) throw new Error('renderMultipleChoice supports at most 26 options');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const { rowH, fontPt } = computeGeometry(options.length);

  const optionsHtml = options
    .map((opt, i) => {
      const rowStyle = rowH === BASE_ROW_H ? '' : ` style="height: ${rowH}px;"`;
      const fontStyle = fontPt === BASE_FONT_PT ? '' : ` style="font-size: ${fontPt}pt;"`;
      return `      <div class="mc-opt"${rowStyle}><div class="mc-opt-letter">${LETTERS[i]}</div><div class="mc-opt-text"${fontStyle}>${escapeHtml(opt)}</div></div>`;
    })
    .join('\n');

  const listOpenMarker = '<div style="position: absolute; left: 80px; top: 320px; width: 700px;">';
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const listStart = shell.indexOf(listOpenMarker);
  const listEnd = shell.indexOf(footerMarker);
  if (listStart === -1 || listEnd === -1 || listEnd < listStart) {
    throw new Error('renderMultipleChoice: could not locate the options block in multiple-choice.html — has the shell markup changed?');
  }
  const listCloseIdx = shell.lastIndexOf('</div>', listEnd);
  let filled =
    shell.slice(0, listStart) +
    listOpenMarker +
    '\n' +
    optionsHtml +
    '\n    ' +
    shell.slice(listCloseIdx, listEnd) +
    shell.slice(listEnd);

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TAG}}', escapeHtml(tag))
    .replace('{{QUESTION}}', escapeHtml(question));

  return filled;
}

module.exports = { renderMultipleChoice, computeGeometry };
