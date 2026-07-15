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
    // Last </script> in the file, not the first: some templates (e.g.
    // grammar-box-look.html) embed their own <script> for image hydration,
    // and a non-greedy match up to the FIRST </script> truncates the
    // payload mid-JSON.
    const end = html.lastIndexOf('</script>');
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
};

for (const [file, meta] of Object.entries(DYNAMIC_TEMPLATES)) {
  if (index[file]) {
    index[file] = { ...index[file], dynamic: meta };
  }
}

fs.writeFileSync(OUT, JSON.stringify(index, null, 2), 'utf8');
const sizeKb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`Wrote ${OUT} (${Object.keys(index).length} templates, ${sizeKb} KB)`);
