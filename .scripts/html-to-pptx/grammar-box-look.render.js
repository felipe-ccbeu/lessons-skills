/**
 * Dynamic-row renderer for grammar-box-look.html.
 *
 * The old template hardcoded exactly 4 table rows (ROW1-4_SUBJECT/HL/TEXT)
 * and exactly 3 tips (TIP1-3_FULL/SHORT). Converts both lists to accept any
 * length: the table grows/shrinks its row count with zebra striping
 * preserved, and the tips box grows/shrinks its row count within its fixed
 * pink container.
 *
 * Usage:
 *   const { renderGrammarBoxLook } = require('./grammar-box-look.render.js');
 *   const html = renderGrammarBoxLook({
 *     breadcrumb: '...', topicName: 'VERB TO BE',
 *     ex1Pre: 'Hi, ', ex1Hl: "I'm", ex1Post: 'Camila.',
 *     ex2Pre: 'Hi, ', ex2Hl: "I'm", ex2Post: 'Rubén.',
 *     tableHeader: 'AM / IS / ARE',
 *     rows: [{ subject: 'I', hl: 'am', text: 'from Brazil.' }, ...],
 *     tips: [{ full: 'I am', short: "I'm" }, ...],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'grammar-box-look.html');
const TPL_OPEN = '<script type="__bundler/template">';

const BASE_ROWS = 4;
const BASE_ROW_PAD_PT = 7; // padding: 7px 14px
const MIN_ROW_PAD_PT = 3;
const BASE_FONT_PT = 15;
const MIN_FONT_PT = 11;

const BASE_TIPS = 3;
const BASE_TIP_GAP_PX = 10;
const MIN_TIP_GAP_PX = 4;
const BASE_TIP_FONT_PT = 15;
const MIN_TIP_FONT_PT = 11;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeTableGeometry(n) {
  if (n <= BASE_ROWS) return { padPt: BASE_ROW_PAD_PT, fontPt: BASE_FONT_PT };
  const scale = BASE_ROWS / n;
  const padPt = Math.max(MIN_ROW_PAD_PT, Math.round(BASE_ROW_PAD_PT * scale));
  const fontPt = Math.max(MIN_FONT_PT, Math.round(BASE_FONT_PT * Math.max(scale, 0.75)));
  return { padPt, fontPt };
}

function computeTipsGeometry(n) {
  if (n <= BASE_TIPS) return { gapPx: BASE_TIP_GAP_PX, fontPt: BASE_TIP_FONT_PT };
  const scale = BASE_TIPS / n;
  const gapPx = Math.max(MIN_TIP_GAP_PX, Math.round(BASE_TIP_GAP_PX * scale));
  const fontPt = Math.max(MIN_TIP_FONT_PT, Math.round(BASE_TIP_FONT_PT * Math.max(scale, 0.8)));
  return { gapPx, fontPt };
}

function renderTableRows(rows, padPt, fontPt) {
  return rows
    .map((row, i) => {
      const bg = i % 2 === 0 ? '#fff' : 'var(--surface-zebra)';
      return `      <div style="display: flex; background: ${bg};">
        <div style="flex: 0 0 21%; padding: ${padPt}px 14px; font-size: ${fontPt}pt; color: var(--ink);">${escapeHtml(row.subject)}</div>
        <div style="flex: 1 1 auto; padding: ${padPt}px 14px; font-size: ${fontPt}pt; color: var(--ink);"><span style="font-family: var(--font-title); font-weight: 700; color: var(--ccbeu-pink);">${escapeHtml(row.hl)}</span> ${escapeHtml(row.text)}</div>
      </div>`;
    })
    .join('\n');
}

function renderTipRows(tips, gapPx, fontPt) {
  return tips
    .map(
      (tip) => `        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-family: var(--font-title); font-weight: 500; color: var(--ink); font-size: ${fontPt}pt;">${escapeHtml(tip.full)}</span>
          <span style="color: var(--ccbeu-blue); font-weight: 700;">→</span>
          <span style="font-family: var(--font-title); font-weight: 700; color: var(--ccbeu-pink); font-size: ${fontPt}pt;">${escapeHtml(tip.short)}</span>
        </div>`
    )
    .join('\n');
}

function renderGrammarBoxLook({
  breadcrumb,
  topicName,
  ex1Pre,
  ex1Hl,
  ex1Post,
  ex2Pre,
  ex2Hl,
  ex2Post,
  tableHeader,
  rows,
  tips,
}) {
  if (!rows || !rows.length) throw new Error('renderGrammarBoxLook requires a non-empty rows array');
  if (!tips || !tips.length) throw new Error('renderGrammarBoxLook requires a non-empty tips array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const end = shell.lastIndexOf('</script>', shell.length - 1);
  // grammar-box-look.html has a second <script> (image hydration) after the
  // bundler payload — find the payload's own closing </script> by scanning
  // forward from `start`, not by taking the LAST </script> in the file.
  const payloadEnd = shell.indexOf('</script>', start);
  const inner = JSON.parse(shell.slice(start, payloadEnd));

  const { padPt, fontPt } = computeTableGeometry(rows.length);
  const { gapPx, fontPt: tipFontPt } = computeTipsGeometry(tips.length);

  const tableRowsHtml = renderTableRows(rows, padPt, fontPt);
  const tableOpenMarker =
    '<div style="display: flex; background: var(--ccbeu-blue);">\n        <div style="flex: 0 0 21%; padding: 8px 14px; font-family: var(--font-title); font-weight: 700; font-size: 9pt; letter-spacing: 0.06em; color: #fff;">SUBJECT</div>\n        <div style="flex: 1 1 auto; padding: 7px 14px; font-family: var(--font-title); font-weight: 700; font-size: 15pt; letter-spacing: 0.06em; color: #fff;">{{TABLE_HEADER}}</div>\n      </div>';
  const tableContainerCloseMarker = '\n    </div>\n\n    <!-- Right column: tips -->';

  const headerIdx = inner.indexOf(tableOpenMarker);
  if (headerIdx === -1) {
    throw new Error('renderGrammarBoxLook: could not locate the table header block — has the shell markup changed?');
  }
  const rowsStart = headerIdx + tableOpenMarker.length;
  const rowsEnd = inner.indexOf(tableContainerCloseMarker, rowsStart);
  if (rowsEnd === -1) {
    throw new Error('renderGrammarBoxLook: could not locate the end of the table rows block — has the shell markup changed?');
  }

  let filled = inner.slice(0, rowsStart) + '\n' + tableRowsHtml + inner.slice(rowsEnd);

  const tipsOpenMarker = 'padding: 14px 18px; font-size: 15pt;">';
  const tipsCloseMarker = '\n      </div>\n    </div>\n\n    <!-- Footer -->';
  const tipsHeaderIdx = filled.indexOf(tipsOpenMarker);
  if (tipsHeaderIdx === -1) {
    throw new Error('renderGrammarBoxLook: could not locate the tips block — has the shell markup changed?');
  }
  const tipsRowsStart = tipsHeaderIdx + tipsOpenMarker.length;
  const tipsRowsEnd = filled.indexOf(tipsCloseMarker, tipsRowsStart);
  if (tipsRowsEnd === -1) {
    throw new Error('renderGrammarBoxLook: could not locate the end of the tips rows block — has the shell markup changed?');
  }
  const tipsRowsHtml = renderTipRows(tips, gapPx, tipFontPt);
  filled = filled.slice(0, tipsRowsStart) + '\n' + tipsRowsHtml + filled.slice(tipsRowsEnd);

  // The tips container's own gap (between rows) is set on the wrapping div,
  // which sits BEFORE tipsRowsStart — patch it separately from the rows.
  filled = filled.replace(
    /(<div style="flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; gap: )\d+(px; padding: 14px 18px; font-size: 15pt;">)/,
    `$1${gapPx}$2`
  );

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TOPIC_NAME}}', escapeHtml(topicName))
    .replace('{{EX1_PRE}}', escapeHtml(ex1Pre))
    .replace('{{EX1_HL}}', escapeHtml(ex1Hl))
    .replace('{{EX1_POST}}', escapeHtml(ex1Post))
    .replace('{{EX2_PRE}}', escapeHtml(ex2Pre))
    .replace('{{EX2_HL}}', escapeHtml(ex2Hl))
    .replace('{{EX2_POST}}', escapeHtml(ex2Post))
    .replace('{{TABLE_HEADER}}', escapeHtml(tableHeader));

  // JSON.stringify does not escape "</script>" — the source template's own
  // embedded hydration <script> (for data-resource-ref images) contains that
  // literal substring, which would otherwise prematurely close the outer
  // bundler <script type="__bundler/template"> tag once re-serialized.
  // Escape the forward slash the same way the shipped template source does
  // (JSON allows \/ as an equivalent encoding of /).
  const serialized = JSON.stringify(filled).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + serialized + shell.slice(payloadEnd);
}

module.exports = { renderGrammarBoxLook, computeTableGeometry, computeTipsGeometry };
