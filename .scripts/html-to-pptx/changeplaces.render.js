/**
 * Dynamic-row renderer for changeplaces.html.
 *
 * The old changeplaces.html hardcoded exactly 3 `.cp-card` rows at fixed
 * pixel offsets (top: 239/381/523). That made the template physically unable
 * to hold a 4th or 5th sentence — a real lesson slide with 5 affirmative/
 * negative/question transforms had no template that could hold it without
 * dropping content. This renders the row block for an arbitrary-length
 * `rows` array instead, shrinking row height/gap/font once the content no
 * longer fits the original 3-row spacing, rather than overflowing off-slide.
 *
 * Usage:
 *   const { renderChangePlaces } = require('./changeplaces.render.js');
 *   const html = renderChangePlaces({
 *     breadcrumb: 'LESSON 1 · PRACTICE THE GRAMMAR',
 *     title: 'Change to the negative!',
 *     rows: [
 *       { label: '1', sentence: 'I am not from China.' },
 *       { label: '2', sentence: "I'm not James." },
 *       ...
 *     ],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'changeplaces.html');

// Content band the cards must fit inside: below the title, above the footer.
const BAND_TOP = 239;
const BAND_BOTTOM = 620;
const BAND_HEIGHT = BAND_BOTTOM - BAND_TOP;

// Original hand-tuned geometry for the reference 3-row design — kept as-is
// whenever rows.length <= 3 so existing decks render pixel-identical.
const BASE = { rows: 3, cardH: 88, pitch: 142, fontPt: 24 };

// Below this, a card can no longer hold a full sentence at any legible size
// — this is the actual capacity ceiling, not an arbitrary guess: pptxgenjs
// renders one line of 12pt body copy at ~18-20px, so a card shorter than
// that plus the 4px top bar can't hold a single line of text.
const MIN_CARD_H = 40;

function computeGeometry(n) {
  if (n <= BASE.rows) {
    return { cardH: BASE.cardH, pitch: BASE.pitch, fontPt: BASE.fontPt };
  }
  const pitch = BAND_HEIGHT / n;
  const cardH = Math.max(MIN_CARD_H, Math.round(pitch * 0.62));
  // Scale font down proportionally to the pitch shrink, floor at 12pt so
  // text stays legible on a projector; ceil at the original 24pt.
  const fontPt = Math.max(12, Math.min(BASE.fontPt, Math.round(BASE.fontPt * (pitch / BASE.pitch))));
  return { cardH, pitch, fontPt };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderChangePlaces({ breadcrumb, title, rows }) {
  if (!rows || !rows.length) {
    throw new Error('renderChangePlaces requires a non-empty rows array');
  }

  const { cardH, pitch, fontPt } = computeGeometry(rows.length);
  const barH = cardH >= 60 ? 4 : 3;
  const labelTop = Math.round((cardH - fontPt * 1.35) / 2) + barH;
  const contentTop = labelTop;

  const cardsHtml = rows
    .map((row, i) => {
      const top = Math.round(BAND_TOP + i * pitch);
      return `    <div class="cp-card" style="top: ${top}px; height: ${cardH}px;">
      <div class="cp-bar" style="height: ${barH}px;"></div>
      <div class="cp-label" style="top: ${labelTop}px; font-size: ${fontPt}pt;">${escapeHtml(row.label)}</div>
      <div class="cp-content" style="top: ${contentTop}px; font-size: ${fontPt}pt;">${escapeHtml(row.sentence)}</div>
    </div>`;
    })
    .join('\n\n');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');

  // Replace the entire hardcoded 3-card block with the generated N-card
  // block. Cut at the literal start of card 1's opening tag and the literal
  // end of card 3's closing marker (the footer div that immediately follows
  // it in the shell) — anchoring on those two exact strings sidesteps having
  // to balance nested </div> counts with regex, which is fragile against
  // .cp-bar's empty-body div closing immediately after its open tag.
  const blockStart = shell.indexOf('<div class="cp-card"');
  const footerMarker = '<div style="position: absolute; left: 80px; top: 636px;';
  const blockEnd = shell.indexOf(footerMarker);
  if (blockStart === -1 || blockEnd === -1 || blockEnd < blockStart) {
    throw new Error('renderChangePlaces: could not locate the card block in changeplaces.html — has the shell markup changed?');
  }
  let html = shell.slice(0, blockStart) + cardsHtml + '\n\n    ' + shell.slice(blockEnd);

  html = html
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TITLE}}', escapeHtml(title));

  return html;
}

module.exports = { renderChangePlaces, computeGeometry };
