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

fs.writeFileSync(OUT, JSON.stringify(index, null, 2), 'utf8');
const sizeKb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`Wrote ${OUT} (${Object.keys(index).length} templates, ${sizeKb} KB)`);
