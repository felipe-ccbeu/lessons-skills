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
      '`answers` is optional (added 2026-07-15) - omit it or pass an empty array for a plain "keyword list + central image" slide (e.g. a pronunciation-practice slide with no matching/answer step at all); the whole numbered-chip column is dropped entirely, not left as an empty column. Do not fabricate an answers list just to satisfy this template when the source lesson genuinely has no answer/matching step. ' +
      'Call renderMatchVocabImage({ breadcrumb, title, instruction, keywords, answers }) instead of string-replacing tokens.',
  },
  'multiple-choice.html': {
    renderModule: './multiple-choice.render.js',
    renderFn: 'renderMultipleChoice',
    schema: {
      breadcrumb: 'string',
      tag: 'string - small pink eyebrow label above the question, e.g. "Books closed! Do you remember?"',
      question: 'string - the quiz question, e.g. "Is Heather Watson a _______?"',
      options: '[string, ...] - any length, lettered A/B/C/... automatically. No option is marked correct in the rendered slide - this is a question for the class to answer aloud, not an answer key.',
    },
    notes:
      'Added 2026-07-15 to fill a real gap: a Books-closed recall quiz ("Is X a _______? / Baseball player. / Tennis player. / Basketball player.") had no matching template - PracticeQaBadges is Yes/No binary only, does not fit N free-form alternatives. ' +
      'Up to 3 options render with the original hand-tuned row height/font; more options shrinks row height/font to fit the content band (same elastic-row pattern as exercise-1.html/practice-qa-badges.html - rows stack via document flow, no per-row position math). ' +
      'Call renderMultipleChoice({ breadcrumb, tag, question, options }) instead of string-replacing tokens. Supports at most 26 options (A-Z).',
  },
  'photo-grid-blank.html': {
    renderModule: './photo-grid-blank.render.js',
    renderFn: 'renderPhotoGridBlank',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      items: '[{ answer: string, text: string }, ...] - any length. `answer` is the pink/bold fill-in-the-blank portion (e.g. "He\'s"), `text` is the rest of the caption (e.g. "Italian.").',
    },
    notes:
      'Added 2026-07-15 to fill a real gap: an exercise with N anonymous photos (no names), each captioned with a fill-in-the-blank sentence (e.g. Exercise 1B(a): 6 photos, "___ Italian." / "___ Chinese." / ...), had no matching template - PhotoExerciseWhoIsThis is built for exactly ONE named person per slide (PERSON_NAME/PERSON_ROLE), forcing it here would mean either fabricating 6 slides from 1 source slide (breaking the 1:1 rule) or leaving PERSON_NAME empty (template misuse). ' +
      'Auto-picks a column count (up to 4 for <=4 items, 3 for 5-6, 4 for 7-8, 5 for 9+) and computes photo/cell size and caption font from that - this is NOT a simple row-stacking elastic template like exercise-1.html, it is a 2D grid, so both column count and per-row height matter. Call renderPhotoGridBlank({ breadcrumb, title, items }) instead of string-replacing tokens.',
  },
  'matching-with-chart.html': {
    renderModule: './matching-with-chart.render.js',
    renderFn: 'renderMatchingWithChart',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      matchLabel: 'string - small pink label above the matching column, e.g. "Match 1-3 with a-c"',
      matchPrompts: '[string, ...] - any length, numbered 1/2/3/... automatically (the left side of the match)',
      matchOptions: '[string, ...] - any length (max 26), lettered a/b/c/... automatically (the right side of the match)',
      matchAnswerKey: 'string, optional - e.g. "Answers: 1-c, 2-a, 3-b"',
      chartLabel: 'string - small pink label above the mini chart, e.g. "Complete the chart"',
      chartRows: '[{ label: string, answer: string }, ...] - any length',
    },
    notes:
      'Added 2026-07-15 to fill a real gap: a combined two-part exercise (numbered matching drill + a small fill-in-the-blank chart in the same source slide, e.g. Cambridge Exercise 2A+2B: "Match 1-3 with a-c" then "Complete the chart") had no matching template - no existing template covers two different drill shapes stacked in one slide. ' +
      'Inherently a dense two-column layout by design (vertical divider down the middle) - prompts/options/chart rows are elastic in count but this template does not aggressively auto-shrink font the way single-purpose full-width templates do, since it is already sharing the slide width between two exercises. Keep each half reasonably short. ' +
      'Call renderMatchingWithChart({ breadcrumb, title, matchLabel, matchPrompts, matchOptions, matchAnswerKey, chartLabel, chartRows }) instead of string-replacing tokens.',
  },
  'model-example-list.html': {
    renderModule: './model-example-list.render.js',
    renderFn: 'renderModelExampleList',
    schema: {
      breadcrumb: 'string',
      title: 'string',
      example: 'string - the worked model sentence, shown in a highlighted "Example" pill',
      items: '[string, ...] - any length, numbered 1/2/3/... automatically, same shape as the example but left for the student to complete',
    },
    notes:
      'Added 2026-07-15 to fill a real gap: a notebook-exercise instruction slide (1 worked example + N more items in the same shape, e.g. "Example: Neymar is brazilian, he is a soccer player." followed by 3 more names/nationalities/jobs) had no matching template - distinct from Exercise1 (which pairs an original sentence with its arrow-transformed rewrite) and from MultipleChoice/PracticeQaBadges (which are question-driven). This is a flat list of same-shape statements with one flagged as the model. ' +
      'Up to 3 items render with the original hand-tuned row height/font (items stack via document flow, same shape as exercise-1.html); more items shrinks row height/font to fit. Call renderModelExampleList({ breadcrumb, title, example, items }) instead of string-replacing tokens.',
  },
  'lesson-complete.html': {
    renderModule: './lesson-complete.render.js',
    renderFn: 'renderLessonComplete',
    schema: {
      breadcrumb: 'string',
      columns: '[{ header: string, terms: [{ t: string, d: string }, ...] }, ...] - 1 to 4 columns, each with its own elastic term count',
    },
    notes:
      'Converted to elastic 2026-07-15 after a real case: a lesson that only recapped 2 categories (Affirmatives/Negatives, not the full Affirmatives/Questions/Wh-Questions/Other-Words set the old fixed-4-column template assumed) left 2 columns completely empty in the rendered slide, wasting half the width. ' +
      'The render function spreads however many columns are actually given (1-4) evenly across the same content band the old template used, and computes a shared font size across all columns from whichever column has the most terms. Do NOT pass more than 4 columns - the content band cannot fit a 5th without overlapping the title. Only fill in the categories the source lesson actually recapped; do not invent a Questions/Wh-Questions column just to reach 4. Call renderLessonComplete({ breadcrumb, columns }) instead of string-replacing tokens.',
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
