/**
 * Dynamic-count renderer for match-vocab-image.html.
 *
 * The old template hardcoded exactly 5 keyword chips (KEYWORD1-5, laid out
 * with `justify-content: space-between` across a fixed-width row) and
 * exactly 4 numbered answer chips (ANSWER1-4, stacked in a fixed-gap
 * column). Converts both lists to accept any length. The keyword row swaps
 * `justify-content: space-between` for an explicit `gap` once rendered,
 * since space-between's spacing is a function of item count and would
 * silently produce wildly different spacing at N != 5 — an explicit gap
 * keeps that predictable at any N.
 *
 * Usage:
 *   const { renderMatchVocabImage } = require('./match-vocab-image.render.js');
 *   const html = renderMatchVocabImage({
 *     breadcrumb: '...', title: 'Match the vocabulary',
 *     instruction: 'Look at the map and match each word to the picture.',
 *     keywords: ['park', 'school', 'hospital', 'bank', 'library', 'station'],
 *     answers: ['park', 'school', 'hospital', 'bank'],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'match-vocab-image.html');
const TPL_OPEN = '<script type="__bundler/template">';

const KEYWORD_ROW_WIDTH = 1120;
const BASE_KEYWORDS = 5;
const BASE_KW_FONT_PT = 11;
const MIN_KW_FONT_PT = 8;

const BASE_ANSWERS = 4;
const BASE_ANSWER_GAP_PX = 14;
const MIN_ANSWER_GAP_PX = 6;
// Answer column sits at top: 320px inside an 847x318 image box that ends at
// y=608; footer starts at y=636, so the column has roughly this much room.
const ANSWER_COLUMN_HEIGHT = 636 - 320;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeKeywordFont(n) {
  if (n <= BASE_KEYWORDS) return BASE_KW_FONT_PT;
  return Math.max(MIN_KW_FONT_PT, Math.round(BASE_KW_FONT_PT * (BASE_KEYWORDS / n)));
}

function computeAnswerGap(n) {
  if (n <= BASE_ANSWERS) return BASE_ANSWER_GAP_PX;
  const rowH = 28; // chip height plus its own line-height, roughly
  const gap = Math.floor((ANSWER_COLUMN_HEIGHT - n * rowH) / Math.max(1, n - 1));
  return Math.max(MIN_ANSWER_GAP_PX, gap);
}

function renderKeywords(keywords) {
  const fontPt = computeKeywordFont(keywords.length);
  const fontStyle = fontPt === BASE_KW_FONT_PT ? '' : ` font-size: ${fontPt}pt;`;
  return keywords.map((kw) => `<span class="kw" style="${fontStyle}">${escapeHtml(kw)}</span>`).join('');
}

function renderAnswers(answers) {
  const gapPx = computeAnswerGap(answers.length);
  return answers
    .map(
      (a, i) =>
        `      <div style="display: flex; align-items: center; gap: 10px;"><span style="font-family: var(--font-title); font-weight: 700; color: var(--ccbeu-blue);">${i + 1}</span><span class="chip">${escapeHtml(a)}</span></div>`
    )
    .join('\n');
}

function renderMatchVocabImage({ breadcrumb, title, instruction, keywords, answers }) {
  if (!keywords || !keywords.length) throw new Error('renderMatchVocabImage requires a non-empty keywords array');
  if (!answers || !answers.length) throw new Error('renderMatchVocabImage requires a non-empty answers array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const payloadEnd = shell.indexOf('</script>', start);
  const inner = JSON.parse(shell.slice(start, payloadEnd));

  const kwRowOpenMarker =
    '<div style="position: absolute; left: 80px; top: 230px; width: 1120px; display: flex; justify-content: space-between;">';
  const kwRowStart = inner.indexOf(kwRowOpenMarker);
  if (kwRowStart === -1) {
    throw new Error('renderMatchVocabImage: could not locate the keyword row — has the shell markup changed?');
  }
  const kwContentStart = kwRowStart + kwRowOpenMarker.length;
  const kwContentEnd = inner.indexOf('</div>', kwContentStart);

  const kwRowReplacement = `<div style="position: absolute; left: 80px; top: 230px; width: ${KEYWORD_ROW_WIDTH}px; display: flex; justify-content: flex-start; gap: 28px; flex-wrap: wrap;">`;

  let filled =
    inner.slice(0, kwRowStart) +
    kwRowReplacement +
    renderKeywords(keywords) +
    inner.slice(kwContentEnd);

  const answersOpenMarker =
    '<div style="position: absolute; left: 960px; top: 320px; width: 240px; display: flex; flex-direction: column; gap: 14px;">';
  const ansRowStart = filled.indexOf(answersOpenMarker);
  if (ansRowStart === -1) {
    throw new Error('renderMatchVocabImage: could not locate the answer chip column — has the shell markup changed?');
  }
  const ansContentStart = ansRowStart + answersOpenMarker.length;
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const footerIdx = filled.indexOf(footerMarker, ansContentStart);
  const ansContentEnd = filled.lastIndexOf('</div>', footerIdx);

  const gapPx = computeAnswerGap(answers.length);
  const answersRowReplacement = `<div style="position: absolute; left: 960px; top: 320px; width: 240px; display: flex; flex-direction: column; gap: ${gapPx}px;">`;

  filled =
    filled.slice(0, ansRowStart) +
    answersRowReplacement +
    '\n' +
    renderAnswers(answers) +
    '\n    ' +
    filled.slice(ansContentEnd);

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{INSTRUCTION}}', escapeHtml(instruction));

  const serialized = JSON.stringify(filled).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + serialized + shell.slice(payloadEnd);
}

module.exports = { renderMatchVocabImage, computeKeywordFont, computeAnswerGap };
