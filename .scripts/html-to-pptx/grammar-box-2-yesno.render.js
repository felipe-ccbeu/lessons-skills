/**
 * Dynamic-row renderer for grammar-box-2-yesno.html.
 *
 * The old template hardcoded exactly 4 table rows (ROW1-4: SUBJECT / yes-no
 * QUESTION / YES-NO short-answer). Converts to accept any length, keeping
 * the zebra striping and 3-column (15% / auto / 40%) layout.
 *
 * Usage:
 *   const { renderGrammarBox2YesNo } = require('./grammar-box-2-yesno.render.js');
 *   const html = renderGrammarBox2YesNo({
 *     breadcrumb: '...', photo1Caption: '"Are you students?"',
 *     photo2Caption: '"Is she a teacher?"',
 *     col2Header: 'YES/NO QUESTION', col3Header: 'SHORT ANSWER',
 *     rows: [{ subject: 'you', qHl: 'Are', qPost: 'a student?', aPre: 'Yes, I', aYes: 'am', aMid: 'No, I', aNo: "'m not" }, ...],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'grammar-box-2-yesno.html');
const TPL_OPEN = '<script type="__bundler/template">';

const BASE_ROWS = 4;
const BASE_PAD_PT = 8;
const MIN_PAD_PT = 3;
const BASE_FONT_PT = 15;
const MIN_FONT_PT = 10;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(n) {
  if (n <= BASE_ROWS) return { padPt: BASE_PAD_PT, fontPt: BASE_FONT_PT };
  const scale = BASE_ROWS / n;
  const padPt = Math.max(MIN_PAD_PT, Math.round(BASE_PAD_PT * scale));
  const fontPt = Math.max(MIN_FONT_PT, Math.round(BASE_FONT_PT * Math.max(scale, 0.7)));
  return { padPt, fontPt };
}

function renderRows(rows, padPt, fontPt) {
  const cellExtra = `padding: ${padPt}px 16px; font-size: ${fontPt}pt;`;
  return rows
    .map((row, i) => {
      const bg = i % 2 === 0 ? '#fff' : 'var(--surface-zebra)';
      return `      <div style="display: flex; background: ${bg};">
        <div class="g2-cell" style="flex: 0 0 15%; ${cellExtra}">${escapeHtml(row.subject)}</div>
        <div class="g2-cell" style="flex: 1 1 auto; ${cellExtra}"><span class="pk">${escapeHtml(row.qHl)}</span> ${escapeHtml(row.qPost)}</div>
        <div class="g2-cell" style="flex: 0 0 40%; ${cellExtra}">${escapeHtml(row.aPre)} <span class="pk">${escapeHtml(row.aYes)}</span>. / ${escapeHtml(row.aMid)} <span class="pk">${escapeHtml(row.aNo)}</span>.</div>
      </div>`;
    })
    .join('\n');
}

function renderGrammarBox2YesNo({ breadcrumb, photo1Caption, photo2Caption, col2Header, col3Header, rows }) {
  if (!rows || !rows.length) throw new Error('renderGrammarBox2YesNo requires a non-empty rows array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const start = shell.indexOf(TPL_OPEN) + TPL_OPEN.length;
  const payloadEnd = shell.indexOf('</script>', start);
  const inner = JSON.parse(shell.slice(start, payloadEnd));

  const { padPt, fontPt } = computeGeometry(rows.length);
  const rowsHtml = renderRows(rows, padPt, fontPt);

  const headerCloseMarker = '</div>\n      </div>\n      <div style="display: flex; background: #fff;">';
  const headerBlockEnd = inner.indexOf(headerCloseMarker);
  if (headerBlockEnd === -1) {
    throw new Error('renderGrammarBox2YesNo: could not locate the table header block — has the shell markup changed?');
  }
  const rowsStart = headerBlockEnd + '</div>\n      </div>'.length;

  const tableCloseMarker = '\n    </div>\n\n    <div style="position: absolute; left: 80px; top: 636px;';
  const rowsEnd = inner.indexOf(tableCloseMarker, rowsStart);
  if (rowsEnd === -1) {
    throw new Error('renderGrammarBox2YesNo: could not locate the end of the table rows block — has the shell markup changed?');
  }

  let filled = inner.slice(0, rowsStart) + '\n' + rowsHtml + inner.slice(rowsEnd);

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{PHOTO1_CAPTION}}', escapeHtml(photo1Caption))
    .replace('{{PHOTO2_CAPTION}}', escapeHtml(photo2Caption))
    .replace('{{COL2_HEADER}}', escapeHtml(col2Header))
    .replace('{{COL3_HEADER}}', escapeHtml(col3Header));

  const serialized = JSON.stringify(filled).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + serialized + shell.slice(payloadEnd);
}

module.exports = { renderGrammarBox2YesNo, computeGeometry };
