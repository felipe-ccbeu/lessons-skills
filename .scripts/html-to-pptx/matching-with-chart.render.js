/**
 * Dynamic renderer for matching-with-chart.html.
 *
 * Fills a two-part combined exercise: a numbered matching drill (N numbered
 * prompts matched to M lettered options, with an optional answer key line)
 * on the left, and a small fill-in-the-blank chart (any number of rows) on
 * the right — e.g. Cambridge Exercise 2A+2B: "Match 1-3 with a-c" followed
 * by "Complete the chart" (he is -> he's, they are -> they're).
 *
 * Both halves have elastic row counts (matching prompts/options stack via
 * document flow; the chart is a short list of label+answer rows), but this
 * template does not try to auto-shrink font as aggressively as the
 * full-width single-purpose templates — it's inherently a dense, two-column
 * layout, so keep prompts/options/chart rows short by design rather than
 * relying on font shrink to rescue an overloaded slide.
 *
 * Usage:
 *   const { renderMatchingWithChart } = require('./matching-with-chart.render.js');
 *   const html = renderMatchingWithChart({
 *     breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · BOOK',
 *     title: 'Match 1-3 with a-c. Listen and check.',
 *     matchLabel: 'Match 1-3 with a-c',
 *     matchPrompts: ['Heather Watson is a tennis player.', 'Shohei Ohtani is a baseball player.', 'Serena and Venus Williams are tennis players.'],
 *     matchOptions: ["He's Japanese.", "They're American.", "She's British."],
 *     matchAnswerKey: 'Answers: 1-c, 2-a, 3-b',
 *     chartLabel: 'Complete the chart',
 *     chartRows: [{ label: 'he is', answer: "he's" }, { label: 'they are', answer: "they're" }],
 *   });
 */
const fs = require('fs');
const path = require('path');

const SHELL_PATH = path.join(__dirname, 'matching-with-chart.html');

const MATCH_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMatchRows(prompts, options) {
  const promptsHtml = prompts
    .map(
      (p, i) =>
        `      <div class="mw-match-row"><div class="mw-match-n">${i + 1}</div><div class="mw-match-text">${escapeHtml(p)}</div></div>`
    )
    .join('\n');
  const optionsHtml = options
    .map(
      (o, i) =>
        `      <div class="mw-match-row"><div class="mw-match-letter">${MATCH_LETTERS[i]}</div><div class="mw-match-text">${escapeHtml(o)}</div></div>`
    )
    .join('\n');
  return { promptsHtml, optionsHtml };
}

function renderChartRows(rows) {
  return rows
    .map(
      (row) =>
        `      <div class="mw-chart-row"><div class="mw-chart-label">${escapeHtml(row.label)}</div><div class="mw-chart-answer">${escapeHtml(row.answer)}</div></div>`
    )
    .join('\n');
}

function renderMatchingWithChart({
  breadcrumb,
  title,
  matchLabel,
  matchPrompts,
  matchOptions,
  matchAnswerKey,
  chartLabel,
  chartRows,
}) {
  if (!matchPrompts || !matchPrompts.length) throw new Error('renderMatchingWithChart requires a non-empty matchPrompts array');
  if (!matchOptions || !matchOptions.length) throw new Error('renderMatchingWithChart requires a non-empty matchOptions array');
  if (matchOptions.length > MATCH_LETTERS.length) throw new Error('renderMatchingWithChart supports at most 26 match options');
  if (!chartRows || !chartRows.length) throw new Error('renderMatchingWithChart requires a non-empty chartRows array');

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const { promptsHtml, optionsHtml } = renderMatchRows(matchPrompts, matchOptions);
  const chartHtml = renderChartRows(chartRows);

  const promptsMarker =
    '      <div class="mw-match-row"><div class="mw-match-n">1</div><div class="mw-match-text">{{MATCH1_PROMPT}}</div></div>\n      <div class="mw-match-row"><div class="mw-match-n">2</div><div class="mw-match-text">{{MATCH2_PROMPT}}</div></div>\n      <div class="mw-match-row"><div class="mw-match-n">3</div><div class="mw-match-text">{{MATCH3_PROMPT}}</div></div>';
  const optionsMarker =
    '      <div class="mw-match-row"><div class="mw-match-letter">a</div><div class="mw-match-text">{{MATCHa_TEXT}}</div></div>\n      <div class="mw-match-row"><div class="mw-match-letter">b</div><div class="mw-match-text">{{MATCHb_TEXT}}</div></div>\n      <div class="mw-match-row"><div class="mw-match-letter">c</div><div class="mw-match-text">{{MATCHc_TEXT}}</div></div>';
  const chartMarker =
    '      <div class="mw-chart-row"><div class="mw-chart-label">{{CHART1_LABEL}}</div><div class="mw-chart-answer">{{CHART1_ANSWER}}</div></div>\n      <div class="mw-chart-row"><div class="mw-chart-label">{{CHART2_LABEL}}</div><div class="mw-chart-answer">{{CHART2_ANSWER}}</div></div>';

  if (!shell.includes(promptsMarker) || !shell.includes(optionsMarker) || !shell.includes(chartMarker)) {
    throw new Error('renderMatchingWithChart: could not locate the expected blocks in matching-with-chart.html — has the shell markup changed?');
  }

  let filled = shell
    .replace(promptsMarker, promptsHtml)
    .replace(optionsMarker, optionsHtml)
    .replace(chartMarker, chartHtml);

  filled = filled
    .replace('{{BREADCRUMB}}', escapeHtml(breadcrumb))
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{MATCH_LABEL}}', escapeHtml(matchLabel))
    .replace('{{MATCH_ANSWER_KEY}}', escapeHtml(matchAnswerKey))
    .replace('{{CHART_LABEL}}', escapeHtml(chartLabel));

  return filled;
}

module.exports = { renderMatchingWithChart };
