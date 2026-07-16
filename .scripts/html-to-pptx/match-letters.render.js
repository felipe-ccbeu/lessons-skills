/**
 * Dynamic-row renderer for match-letters.html.
 *
 * Role: letter-matching WITH a photo grid — e.g. "match each nationality to
 * its lettered photo", where the source lesson's real content is a grid of
 * N labeled photos (a-h) on the left, matched against a term/letter list on
 * the right. This fills the "Letter-matching without a central image" gap
 * noted in references/templates.md — added 2026-07-16, then corrected the
 * same day: the first version of this template dropped the photo grid
 * entirely and rendered only the term/letter list, which lost the actual
 * content of the exercise (the grid of 8 real photos with flag+name+role
 * captions IS the matching puzzle, not decoration around it). The grid
 * itself is supplied as a single pre-built image (`gridImage`, a path to a
 * PNG assembled from the source lesson's real photos, e.g. cropped directly
 * from the original slide's screenshot to guarantee no fabricated people
 * appear) — this render function does not itself lay out N photos into a
 * grid, it composites one already-correct grid image with an elastic
 * term/letter list beside it.
 *
 * Usage:
 *   const { renderMatchLetters } = require('./match-letters.render.js');
 *   const html = renderMatchLetters({
 *     breadcrumb: '...', title: 'Match the nationalities',
 *     gridImage: './nationality-grid.png',
 *     rows: [{ term: 'American', letter: 'C' }, { term: 'Chinese', letter: 'G' }, ...],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'match-letters.html');

const BAND_TOP = 172;
const BAND_BOTTOM = 636;
const BAND_HEIGHT = BAND_BOTTOM - BAND_TOP;

const BASE = { rows: 8, pitch: 52, fontPt: 18 };
const MIN_FONT_PT = 12;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function computeGeometry(n) {
  const pitch = n <= BASE.rows ? BASE.pitch : BAND_HEIGHT / n;
  const fontPt =
    n <= BASE.rows ? BASE.fontPt : Math.max(MIN_FONT_PT, Math.round(BASE.fontPt * (pitch / BASE.pitch)));
  return { pitch, fontPt };
}

function renderMatchLetters({ breadcrumb, title, gridImage, rows }) {
  if (!rows || !rows.length) {
    throw new Error('renderMatchLetters requires a non-empty rows array');
  }
  if (!gridImage) {
    throw new Error('renderMatchLetters requires gridImage (path to the pre-built photo-grid PNG)');
  }

  const { pitch, fontPt } = computeGeometry(rows.length);
  const badgeFontPt = Math.round(fontPt * 1.22);

  const rowsHtml = rows
    .map((row, i) => {
      const top = Math.round(BAND_TOP + i * pitch);
      return `    <div class="ml-row" style="top: ${top}px;">
      <div class="ml-term" style="font-size: ${fontPt}pt;">${escapeHtml(row.term)}</div>
      <div class="ml-letter-badge" style="font-size: ${badgeFontPt}pt;">${escapeHtml(row.letter)}</div>
    </div>`;
    })
    .join('\n\n');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');

  const blockStartMarker = '<!-- ROW_BLOCK -->';
  const blockEndMarker = '<!-- /ROW_BLOCK -->';
  const blockStart = shell.indexOf(blockStartMarker);
  const blockEnd = shell.indexOf(blockEndMarker);
  if (blockStart === -1 || blockEnd === -1) {
    throw new Error('renderMatchLetters: could not locate the row block markers — has the shell markup changed?');
  }

  let html =
    shell.slice(0, blockStart + blockStartMarker.length) +
    '\n' +
    rowsHtml +
    '\n    ' +
    shell.slice(blockEnd);

  html = html
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{GRID_IMAGE}}', gridImage);

  return html;
}

module.exports = { renderMatchLetters, computeGeometry };
