/**
 * Regenerates templates-tokens.json — a lightweight index of every template
 * in this directory (name, {{TOKEN}} list, decoded body HTML), so the
 * arrange-lessons skill can look up a template's structure without opening
 * the raw .html file (each one is 800KB+ because of embedded woff2 fonts,
 * which blows past normal file-read limits and wastes context).
 *
 * Run this whenever a template's tokens or markup change:
 *   node build-templates-index.js
 */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUT = path.join(DIR, 'templates-tokens.json');

const TPL_OPEN = '<script type="__bundler/template">';

function extractBody(file) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf8');
  const start = html.indexOf(TPL_OPEN);

  let inner;
  if (start === -1) {
    // Plain (non-bundled) template, e.g. cover-image.html.
    inner = html;
  } else {
    const from = start + TPL_OPEN.length;
    // The FIRST </script> after `from`, not the last: this closes the
    // bundler's own <script type="__bundler/template"> tag. Templates like
    // grammar-box-look.html embed a hydration <script> INSIDE the JSON
    // payload itself (as an escaped "<\/script>" string, never a literal
    // "</script>"), so searching forward from `from` for the first literal
    // occurrence correctly lands on the payload's real closing tag — using
    // lastIndexOf on the whole file instead can pick up an unrelated
    // trailing <script> elsewhere in the document.
    const end = html.indexOf('</script>', from);
    const raw = html.slice(from, end);
    inner = JSON.parse(raw);
  }

  const bodyMatch = inner.match(/<body>([\s\S]*)<\/body>/);
  const body = bodyMatch ? bodyMatch[1].trim() : inner.trim();
  const tokens = [...new Set([...inner.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]))];

  return { tokens, body };
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
const index = {};

for (const file of files) {
  try {
    index[file] = extractBody(file);
  } catch (err) {
    console.error(`Failed to index ${file}: ${err.message}`);
  }
}

// Templates with a sibling <name>.render.js are dynamic (arbitrary-length
// `rows` array + optional sections) instead of fixed {{TOKEN}} slots — e.g.
// changeplaces.render.js replaced changeplaces.html's old hardcoded
// ROW1-3 divs. Document the render function's shape instead of scraping
// {{TOKEN}} names out of the (now mostly token-free) shell, so the ficha
// step knows to pass `rows: [...]` rather than fixed ROWn_* keys.
const DYNAMIC_TEMPLATES = {
  'changeplaces.html': {
    renderModule: './changeplaces.render.js',
    renderFn: 'renderChangePlaces',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      rows: '[{ label: string, sentence: string }, ...] - any length, not fixed to 3',
    },
    notes:
      'Up to 3 rows renders with the original hand-tuned spacing/font. ' +
      '4+ rows auto-shrinks row height and font size to fit the same content band. ' +
      'Call renderChangePlaces({ breadcrumb, title, rows }) directly instead of string-replacing tokens - ' +
      'ignore the tokens[] array below, it reflects the static shell file only and is not how this template is actually filled.',
  },
  'warmup-oral-transform.html': {
    renderModule: './warmup-oral-transform.render.js',
    renderFn: 'renderWarmupOralTransform',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      instruction: 'string',
      rows: '[{ pre: string, answer: string, post: string }, ...] - any length, not fixed to 3. `answer` is the pink/bold fill-in-the-blank portion; `pre`/`post` are the plain-text portions before/after it, either may be empty.',
      ctaTitle: 'string - right-panel heading, e.g. "Work in Pairs!"',
      ctaSubtitle: 'string, optional - empty/omitted removes the whole subtitle paragraph (not just its text), shrinking the right panel to just the title',
      timeBadge: 'string, optional - empty/omitted removes the whole pink pill (not just its text)',
    },
    notes:
      'Up to 3 rows renders with the original hand-tuned spacing/font. 4+ rows auto-shrinks font/gap to fit the same content band. ' +
      'Call renderWarmupOralTransform({ breadcrumb, title, instruction, rows, ctaTitle, ctaSubtitle, timeBadge }) directly instead of string-replacing tokens - ' +
      'ignore the tokens[] array below, it reflects the static shell file only and is not how this template is actually filled. ' +
      'This is the "Change to the negative!"-style warm-up transform drill with a blue Pair-Work call-to-action panel on the right - ' +
      'do not confuse with ChangePlaces (white background, no side panel, Affirmative/Negative/Question table).',
  },
  'exercise-1.html': {
    renderModule: './exercise-1.render.js',
    renderFn: 'renderExercise1',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      instructionPre: 'string',
      instructionHl: 'string - the pink-highlighted word/phrase inside the instruction sentence',
      instructionPost: 'string',
      rows: '[{ orig: string, hl: string, post: string }, ...] - any length, not fixed to 5. `hl` is the pink-bold transformed portion after the arrow; `orig` is the original sentence before the arrow.',
    },
    notes:
      'Up to 5 rows renders with the original hand-tuned row height/font. 6+ rows shrinks row height and font to fit the same content band. ' +
      'Call renderExercise1({ breadcrumb, title, instructionPre, instructionHl, instructionPost, rows }) instead of string-replacing tokens.',
  },
  'grammar-box-look.html': {
    renderModule: './grammar-box-look.render.js',
    renderFn: 'renderGrammarBoxLook',
    schema: {
      breadcrumb: 'string',
      topicName: 'string - blue badge text next to the GRAMMAR BOX pill, e.g. "VERB TO BE"',
      ex1Pre: 'string', ex1Hl: 'string', ex1Post: 'string',
      ex2Pre: 'string', ex2Hl: 'string', ex2Post: 'string',
      tableHeader: 'string - e.g. "AM / IS / ARE"',
      rows: '[{ subject: string, hl: string, text: string }, ...] - any length, not fixed to 4 (the SUBJECT table)',
      tips: '[{ full: string, short: string }, ...] - any length, not fixed to 3 (the pink TIPS! box)',
    },
    notes:
      'Up to 4 table rows / 3 tips render with the original hand-tuned spacing/font. More of either shrinks padding/font to fit their own fixed containers - the table and tips box do not resize each other. ' +
      'Call renderGrammarBoxLook({ breadcrumb, topicName, ex1Pre, ex1Hl, ex1Post, ex2Pre, ex2Hl, ex2Post, tableHeader, rows, tips }) instead of string-replacing tokens. ' +
      'This template embeds a hydration <script> inside its payload for the two figure images - the render function already handles escaping "</script>" correctly when re-serializing; do not hand-roll this template\'s HTML another way.',
  },
  'grammar-box-2-yesno.html': {
    renderModule: './grammar-box-2-yesno.render.js',
    renderFn: 'renderGrammarBox2YesNo',
    schema: {
      breadcrumb: 'string',
      photo1Caption: 'string - quoted question under the first example photo, e.g. \'"Are you students?"\'',
      photo2Caption: 'string',
      col2Header: 'string - e.g. "YES/NO QUESTION"',
      col3Header: 'string - e.g. "SHORT ANSWER"',
      rows: '[{ subject: string, qHl: string, qPost: string, aPre: string, aYes: string, aMid: string, aNo: string }, ...] - any length, not fixed to 4',
    },
    notes:
      'Up to 4 rows render with the original hand-tuned padding/font. More rows shrinks padding/font to fit the full-width table. ' +
      'Call renderGrammarBox2YesNo({ breadcrumb, photo1Caption, photo2Caption, col2Header, col3Header, rows }) instead of string-replacing tokens. ' +
      'Distinct from GrammarBoxLook: this is the yes/no-question table (question + short answer), not an affirmative-statement table.',
  },
  'practice-qa-badges.html': {
    renderModule: './practice-qa-badges.render.js',
    renderFn: 'renderPracticeQaBadges',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      rows: '[{ question: string, yes: string, no: string }, ...] - any length, not fixed to 4',
    },
    notes:
      'Up to 4 rows render with the original hand-tuned row height/font. 5+ rows shrinks row height/font to fit the content band. ' +
      'Call renderPracticeQaBadges({ breadcrumb, title, rows }) instead of string-replacing tokens.',
  },
  'complete-the-chart.html': {
    renderModule: './complete-the-chart.render.js',
    renderFn: 'renderCompleteTheChart',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      group1: '{ label: string, rows: [{ sentence: string, answer: string }, ...] } - rows length is elastic (not fixed to 2)',
      group2: '{ label: string, rows: [{ sentence: string, answer: string }, ...] } - rows length is elastic (not fixed to 2)',
    },
    notes:
      'ONLY the number of ROWS per group is elastic here - the number of GROUPS stays fixed at exactly 2 (group1, group2), each tied to its own fixed-position reference image that this render function does not move. ' +
      'Do not try to add a "group3" - the shipped template already has an unused, incomplete Group 3 image slot with no table, which is a known rough edge, not a usable third group. ' +
      'Call renderCompleteTheChart({ breadcrumb, title, group1, group2 }) instead of string-replacing tokens.',
  },
  'fluency-1.html': {
    renderModule: './fluency-1.render.js',
    renderFn: 'renderFluency1',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      instruction: 'string',
      questions: '[string | { pre: string }, ...] - any length, not fixed to 8. A plain string renders as-is; { pre } renders with a trailing fill-in-the-blank "___________." (the old Q4_PRE/Q8_PRE shape).',
    },
    notes:
      'Questions are auto-split evenly across the template\'s fixed two-column layout (left column gets the extra one when the count is odd) - there is no separate left/right input, just one flat `questions` array in source order. ' +
      'Up to 4 questions per column render with the original hand-tuned spacing/font; more per column shrinks gap/font to fit. ' +
      'Call renderFluency1({ breadcrumb, title, instruction, questions }) instead of string-replacing tokens.',
  },
  'match-vocab-image.html': {
    renderModule: './match-vocab-image.render.js',
    renderFn: 'renderMatchVocabImage',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      instruction: 'string',
      keywords: '[string, ...] - any length, not fixed to 5 (the pink keyword row above the image)',
      answers: '[string, ...] - any length, not fixed to 4 (the numbered chip column beside the image) - independent count from keywords, does not have to match it',
    },
    notes:
      'keywords and answers are two independent lists with independently elastic lengths - the source template already had 5 keywords but only 4 answer chips, so unequal counts are the normal case, not a bug. ' +
      'The keyword row switches from the shipped template\'s `justify-content: space-between` to an explicit gap once rendered, so spacing stays predictable regardless of keyword count (space-between\'s spacing is a function of item count and would otherwise vary unpredictably). ' +
      'Call renderMatchVocabImage({ breadcrumb, title, instruction, keywords, answers }) instead of string-replacing tokens.',
  },
};

for (const [file, meta] of Object.entries(DYNAMIC_TEMPLATES)) {
  if (index[file]) {
    index[file] = { ...index[file], dynamic: meta };
  }
}

fs.writeFileSync(OUT, JSON.stringify(index, null, 2), 'utf8');
const sizeKb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`Wrote ${OUT} (${Object.keys(index).length} templates, ${sizeKb} KB)`);
