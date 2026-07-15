/**
 * Dynamic-row + optional-CTA-subtitle renderer for warmup-oral-transform.html.
 *
 * The old template hardcoded exactly 3 sentence rows
 * (ANSWER1/SENTENCE1, SENTENCE2_PRE/ANSWER2/SENTENCE2_POST,
 * SENTENCE3_PRE/ANSWER3/SENTENCE3_POST) and always rendered a full CTA
 * subtitle on the right-hand blue panel. Two real gaps followed from that:
 *   1. A lesson with more than 3 sentences to transform had nowhere to put
 *      the extra ones — content got silently dropped.
 *   2. The right panel always shows detailed instructional copy (e.g. "Ring
 *      the bell competition: take turns changing each sentence to the
 *      negative with a partner. First correct answer = 1 point.") even when
 *      the source lesson only called for a short "Work in Pairs!" cue.
 *
 * This renders the sentence-row block for an arbitrary-length `rows` array,
 * and drops the CTA subtitle (and its layout gap) entirely when not given.
 *
 * `rows[i].pre` / `rows[i].answer` / `rows[i].post` mirror the template's own
 * SENTENCE*_PRE / ANSWER* / SENTENCE*_POST split: `answer` is the
 * highlighted (pink, bold) fill-in-the-blank portion, `pre`/`post` are the
 * plain-text portions before/after it — either may be empty (e.g. row 1 in
 * the original design has no PRE, the blank leads the sentence).
 *
 * Usage:
 *   const { renderWarmupOralTransform } = require('./warmup-oral-transform.render.js');
 *   const html = renderWarmupOralTransform({
 *     breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · WARM-UP',
 *     title: 'Change to the negative!',
 *     instruction: 'Change the sentences to the negative!',
 *     rows: [
 *       { pre: '', answer: "I'm not", post: 'from China.' },
 *       { pre: '', answer: "I'm not", post: 'James.' },
 *       { pre: '', answer: "We aren't", post: 'teachers.' },
 *       { pre: '', answer: "We aren't", post: 'from California.' },
 *       { pre: '', answer: "You aren't", post: 'beautiful.' },
 *     ],
 *     ctaTitle: 'Work in Pairs!',
 *     ctaSubtitle: '',  // omit/empty -> subtitle block removed, panel just shows the title
 *     timeBadge: '',    // omit/empty -> badge pill removed
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'warmup-oral-transform.html');
const TPL_OPEN = '<script type="__bundler/template">';

// Content band the row list must fit inside: below the instruction text,
// above the footer.
const BAND_TOP = 270;
const BAND_BOTTOM = 620;
const BAND_HEIGHT = BAND_BOTTOM - BAND_TOP;

// Original hand-tuned geometry for the reference 3-row design (measured from
// the shipped template: row font-size 18pt, ~22px CSS margin-bottom between
// rows, single-line rows ~35px tall, two-line rows ~64px tall). Kept as-is
// whenever rows.length <= 3 so existing decks render unchanged (same
// .wu-row/.wu-n/.wu-blank classes, just repeated instead of hardcoded).
const BASE_ROWS = 3;
const BASE_FONT_PT = 18;
const BASE_GAP_PX = 22;

const MIN_FONT_PT = 12;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Rough single-line height estimate at a given font size, used only to scale
// down gap/font once row count exceeds the original 3-row design — not used
// for final pixel-perfect placement (the browser still lays out the real
// flex column at render time via extract.js).
function estimateRowHeight(fontPt) {
  return fontPt * 1.75; // ~line-height 1.3 plus baseline padding, in px at 96dpi/72pt
}

function computeGeometry(n) {
  if (n <= BASE_ROWS) {
    return { fontPt: BASE_FONT_PT, gapPx: BASE_GAP_PX };
  }
  // Shrink font/gap together until n rows (assuming worst-case 2-line wrap)
  // fit the band; floor at MIN_FONT_PT so text stays legible.
  let fontPt = BASE_FONT_PT;
  let gapPx = BASE_GAP_PX;
  while (fontPt > MIN_FONT_PT) {
    const rowH = estimateRowHeight(fontPt) * 1.6; // assume most rows wrap to 2 lines
    const total = n * rowH + (n - 1) * gapPx;
    if (total <= BAND_HEIGHT) break;
    fontPt -= 1;
    gapPx = Math.max(10, Math.round(BASE_GAP_PX * (fontPt / BASE_FONT_PT)));
  }
  return { fontPt, gapPx };
}

function renderRowsHtml(rows, fontPt, gapPx) {
  return rows
    .map((row, i) => {
      const marginBottom = i === rows.length - 1 ? 0 : gapPx;
      const pre = escapeHtml(row.pre);
      const answer = escapeHtml(row.answer);
      const post = escapeHtml(row.post);
      return `      <div class="wu-row" style="margin-bottom: ${marginBottom}px;"><span class="wu-n" style="font-size: ${fontPt}pt;">${i + 1}</span><span class="wu-t" style="font-size: ${fontPt}pt;">${pre ? pre + ' ' : ''}<span class="wu-blank" style="font-size: ${fontPt}pt;">${answer}</span>${post ? ' ' + post : ''}</span></div>`;
    })
    .join('\n');
}

function renderWarmupOralTransform({
  breadcrumb,
  title,
  instruction,
  rows,
  ctaTitle,
  ctaSubtitle,
  timeBadge,
}) {
  if (!rows || !rows.length) {
    throw new Error('renderWarmupOralTransform requires a non-empty rows array');
  }

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const end = shell.lastIndexOf('</script>');
  const inner = JSON.parse(shell.slice(start, end));

  const { fontPt, gapPx } = computeGeometry(rows.length);
  const rowsHtml = renderRowsHtml(rows, fontPt, gapPx);

  // Replace the entire hardcoded 3-row sentence-list block. Anchored on the
  // literal wrapping <div> (left/top/width set inline) that immediately
  // precedes the .wu-row markup, through to its closing </div> right before
  // the "<!-- Footer -->" comment — both are stable landmarks in the shell.
  const listOpenMarker = '<div style="position: absolute; left: 80px; top: 270px; width: 500px;">';
  const footerMarker = '<!-- Footer -->';
  const listStart = inner.indexOf(listOpenMarker);
  const listEnd = inner.indexOf(footerMarker);
  if (listStart === -1 || listEnd === -1 || listEnd < listStart) {
    throw new Error(
      'renderWarmupOralTransform: could not locate the sentence-list block in warmup-oral-transform.html — has the shell markup changed?'
    );
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
    .replace('{{INSTRUCTION}}', escapeHtml(instruction));

  // CTA subtitle is optional: when empty/omitted, drop the whole <p> tag
  // (not just its text) so the panel visually shrinks to title + badge only,
  // instead of leaving a blank paragraph's line-height as dead space.
  if (ctaSubtitle) {
    filled = filled.replace('{{CTA_SUBTITLE}}', escapeHtml(ctaSubtitle));
  } else {
    filled = filled.replace(
      /<p style="margin: 0; font-family: var\(--font-body\); font-weight: 400; font-size: 13pt; color: rgba\(255,255,255,0\.88\);">\{\{CTA_SUBTITLE\}\}<\/p>\s*/,
      ''
    );
  }

  // Time badge pill is likewise optional — drop the whole <span> (pill
  // background included) rather than rendering an empty pink pill.
  if (timeBadge) {
    filled = filled.replace('{{TIME_BADGE}}', escapeHtml(timeBadge));
  } else {
    filled = filled.replace(
      /<span style="margin-top: 14px; background: var\(--ccbeu-pink\);[^"]*">\{\{TIME_BADGE\}\}<\/span>\s*/,
      ''
    );
  }

  filled = filled.replace('{{CTA_TITLE}}', escapeHtml(ctaTitle));

  return shell.slice(0, start) + JSON.stringify(filled) + shell.slice(end);
}

module.exports = { renderWarmupOralTransform, computeGeometry };
