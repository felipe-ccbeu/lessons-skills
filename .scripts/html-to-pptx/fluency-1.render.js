/**
 * Dynamic-question-count renderer for fluency-1.html.
 *
 * The old template hardcoded exactly 8 questions (Q1-Q8) split into two
 * fixed 4-item columns, with Q4/Q8 given a special "_PRE" token because
 * those two rows end in a fill-in-the-blank gap instead of plain text.
 * Converts to accept any number of questions, auto-splitting them evenly
 * across the two columns (left column gets the extra one when odd), with
 * `.fq { margin-bottom: 30px }` shrinking once a column holds more than the
 * original 4 rows.
 *
 * `questions[i]` is either a plain string, or `{ pre: '...' }` to render
 * with the trailing "___________." blank (the old Q4_PRE/Q8_PRE shape).
 *
 * Usage:
 *   const { renderFluency1 } = require('./fluency-1.render.js');
 *   const html = renderFluency1({
 *     breadcrumb: '...', title: 'Fluency practice', instruction: 'Ask and answer.',
 *     questions: [
 *       'What is your name?',
 *       'Where are you from?',
 *       { pre: 'My favorite color is' },
 *       ...
 *     ],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'fluency-1.html');
const TPL_OPEN = '<script type="__bundler/template">';

const LEFT_COL_OPEN = '<div style="position: absolute; left: 80px; top: 290px; width: 520px;">';
const RIGHT_COL_OPEN = '<div style="position: absolute; left: 680px; top: 290px; width: 520px;">';

const BASE_PER_COLUMN = 4;
const BASE_GAP_PX = 30;
const MIN_GAP_PX = 10;
const BASE_FONT_PT = 15;
const MIN_FONT_PT = 11;

const COLUMN_HEIGHT = 636 - 290; // footer top minus column top
const ROW_H_ESTIMATE = 30; // ~1 line at 15pt plus tick height

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(perColumn) {
  if (perColumn <= BASE_PER_COLUMN) return { gapPx: BASE_GAP_PX, fontPt: BASE_FONT_PT };
  const totalH = perColumn * ROW_H_ESTIMATE + (perColumn - 1) * BASE_GAP_PX;
  if (totalH <= COLUMN_HEIGHT) return { gapPx: BASE_GAP_PX, fontPt: BASE_FONT_PT };
  const gapPx = Math.max(MIN_GAP_PX, Math.floor((COLUMN_HEIGHT - perColumn * ROW_H_ESTIMATE) / Math.max(1, perColumn - 1)));
  const fontPt = Math.max(MIN_FONT_PT, Math.min(BASE_FONT_PT, Math.round(BASE_FONT_PT * (BASE_PER_COLUMN / perColumn))));
  return { gapPx, fontPt };
}

function renderColumn(questions, gapPx, fontPt) {
  const fontStyle = fontPt === BASE_FONT_PT ? '' : ` style="font-size: ${fontPt}pt;"`;
  return questions
    .map((q, i) => {
      const text = typeof q === 'string' ? escapeHtml(q) : escapeHtml(q.pre);
      const gapSuffix = typeof q === 'string' ? '' : ' <span class="gap">___________</span>.';
      const marginStyle = i === questions.length - 1 ? '' : ` style="margin-bottom: ${gapPx}px;"`;
      return `      <div class="fq"${marginStyle}><div class="fq-tick"></div><div class="fq-t"${fontStyle}>${text}${gapSuffix}</div></div>`;
    })
    .join('\n');
}

function renderFluency1({ breadcrumb, title, instruction, questions }) {
  if (!questions || !questions.length) throw new Error('renderFluency1 requires a non-empty questions array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const payloadEnd = shell.indexOf('</script>', start);
  const inner = JSON.parse(shell.slice(start, payloadEnd));

  const leftStart = inner.indexOf(LEFT_COL_OPEN);
  const rightStart = inner.indexOf(RIGHT_COL_OPEN);
  if (leftStart === -1 || rightStart === -1 || rightStart < leftStart) {
    throw new Error('renderFluency1: could not locate the two question-column blocks in fluency-1.html — has the shell markup changed?');
  }
  const leftContentStart = leftStart + LEFT_COL_OPEN.length;
  const leftContentEnd = inner.lastIndexOf('</div>', rightStart);
  const rightContentStart = rightStart + RIGHT_COL_OPEN.length;
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const footerIdx = inner.indexOf(footerMarker, rightContentStart);
  const rightContentEnd = inner.lastIndexOf('</div>', footerIdx);

  const leftCount = Math.ceil(questions.length / 2);
  const left = questions.slice(0, leftCount);
  const right = questions.slice(leftCount);
  const perColumn = Math.max(left.length, right.length || 1);
  const { gapPx, fontPt } = computeGeometry(perColumn);

  const leftHtml = renderColumn(left, gapPx, fontPt);
  const rightHtml = right.length ? renderColumn(right, gapPx, fontPt) : '';

  let filled =
    inner.slice(0, leftContentStart) +
    '\n' +
    leftHtml +
    '\n    ' +
    inner.slice(leftContentEnd, rightContentStart) +
    '\n' +
    rightHtml +
    '\n    ' +
    inner.slice(rightContentEnd);

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{INSTRUCTION}}', escapeHtml(instruction));

  const serialized = JSON.stringify(filled).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + serialized + shell.slice(payloadEnd);
}

module.exports = { renderFluency1, computeGeometry };
