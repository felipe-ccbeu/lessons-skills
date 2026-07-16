const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PIPE_DIR = __dirname;
const OUT_DIR = path.resolve(PIPE_DIR, '../../basic-1-unit-1-lesson-b-part-1-v3/slides');
const FICHA = path.resolve(PIPE_DIR, '../../basic-1-unit-1-lesson-b-part-1-v3/basic-1-unit-1-lesson-b-part-1-v3-ficha.json');

const templateFile = {
  CoverImage: 'cover-image.html',
  SectionTransition: 'section-transition.html',
  Objectives: 'objectives.html',
  PhotoExerciseWhoIsThis: 'photo-exercise-who-is-this.html',
};

const renderFn = {
  WarmupOralTransform: ['warmup-oral-transform.render.js', 'renderWarmupOralTransform'],
  MatchVocabImage: ['match-vocab-image.render.js', 'renderMatchVocabImage'],
  MultipleChoice: ['multiple-choice.render.js', 'renderMultipleChoice'],
  MatchingWithChart: ['matching-with-chart.render.js', 'renderMatchingWithChart'],
  GrammarBox2YesNo: ['grammar-box-2-yesno.render.js', 'renderGrammarBox2YesNo'],
  PhotoGridBlank: ['photo-grid-blank.render.js', 'renderPhotoGridBlank'],
  Exercise1: ['exercise-1.render.js', 'renderExercise1'],
  ModelExampleList: ['model-example-list.render.js', 'renderModelExampleList'],
  LessonComplete: ['lesson-complete.render.js', 'renderLessonComplete'],
  MatchLetters: ['match-letters.render.js', 'renderMatchLetters'],
  ChangePlaces: ['changeplaces.render.js', 'renderChangePlaces'],
};

const ficha = JSON.parse(fs.readFileSync(FICHA, 'utf8'));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function adaptGrammarBox2YesNo(v) {
  const rows = [];
  for (let i = 1; v[`row${i}_subject`] !== undefined; i++) {
    rows.push({
      subject: v[`row${i}_subject`],
      qHl: v[`row${i}_q_hl`],
      qPost: v[`row${i}_q_post`],
      aPre: v[`row${i}_a_pre`],
      aYes: v[`row${i}_a_yes`],
      aMid: v[`row${i}_a_mid`],
      aNo: v[`row${i}_a_no`],
    });
  }
  return {
    breadcrumb: v.breadcrumb,
    photo1Caption: v.photo1_caption,
    photo2Caption: v.photo2_caption,
    col2Header: v.col2_header,
    col3Header: v.col3_header,
    rows,
  };
}

// extract.js resolves <img src> to a data URI via an in-page fetch() before
// walking the DOM — but Chromium's fetch() refuses file:// URLs outright
// ("URL scheme 'file' is not supported"), unlike an <img> tag itself, which
// loads file:// fine for on-screen rendering. That mismatch let two images
// (this deck's MatchLetters grid and the Fluency2 game-board photo) render
// correctly in every local screenshot check but silently end up with
// dataUri: null in the layout.json, and therefore missing entirely from the
// uploaded .pptx — the failure was invisible because visual preview and the
// actual embed step take different code paths. Fixed by inlining these two
// local images as data: URIs directly in the generated HTML's <img src>, so
// extract.js's fetch() sees img.currentSrc.startsWith("data:") and skips the
// network fetch entirely (see its own early-return branch for that case).
function toDataUri(absPath) {
  const buf = fs.readFileSync(absPath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

function adaptMatchLetters(v) {
  // v.gridImage is a relative path (e.g. './nationality-grid.png') meant to
  // sit next to the generated HTML — resolve it against OUT_DIR and inline
  // it as a data: URI for the same file:// + fetch() reason documented above
  // toDataUri.
  const absPath = path.join(OUT_DIR, v.gridImage.replace(/^\.\//, ''));
  return { ...v, gridImage: toDataUri(absPath) };
}

const adapters = {
  GrammarBox2YesNo: adaptGrammarBox2YesNo,
  MatchLetters: adaptMatchLetters,
};

const GAME_BOARD_SRC = path.resolve(
  PIPE_DIR,
  '../../basic-1-unit-1-lesson-b-part-1-v3/slides/game-board.png'
);

function buildFluency2WithImage(v) {
  const shellPath = path.join(PIPE_DIR, 'fluency-2.html');
  const shell = fs.readFileSync(shellPath, 'utf8');
  const TPL_OPEN = '<script type="__bundler/template">';
  const start = shell.indexOf(TPL_OPEN);
  const s2 = start + TPL_OPEN.length;
  const end = shell.indexOf('</script>', s2);
  let inner = JSON.parse(shell.slice(s2, end));

  inner = inner
    .replace('{{BREADCRUMB}}', v.breadcrumb)
    .replace('{{TITLE}}', v.title)
    .replace('{{INSTRUCTION_PRE}}', v.instruction_pre);

  const hlMarker = ' <em>{{INSTRUCTION_HL}}</em>.';
  inner = v.instruction_hl
    ? inner.replace('{{INSTRUCTION_HL}}', v.instruction_hl)
    : inner.replace(hlMarker, '');

  const placeholderDiv =
    '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--font-title); font-weight: 700; font-size: 12pt; letter-spacing: 0.08em; color: #9AA1AC;">IMAGE AREA</div>';
  const dataUri = toDataUri(GAME_BOARD_SRC);
  const imgTag = `<img src="${dataUri}" alt="Game board with 12 numbered squares" style="width: 100%; height: 100%; object-fit: contain;">`;
  if (!inner.includes(placeholderDiv)) {
    throw new Error('buildFluency2WithImage: placeholder div not found — has fluency-2.html changed?');
  }
  inner = inner.replace(placeholderDiv, imgTag);

  const serialized = JSON.stringify(inner).replace(/<\/script>/g, '<\\/script>');
  return shell.slice(0, start) + TPL_OPEN + serialized + shell.slice(end);
}

const layoutFiles = [];

for (const entry of ficha) {
  const n = String(entry.slide).padStart(2, '0');
  const tpl = entry.template;
  const base = `${n}-${tpl}`;
  const htmlPath = path.join(OUT_DIR, `${base}.html`);

  let html;
  if (tpl === 'Fluency2' && entry.values.__image) {
    html = buildFluency2WithImage(entry.values);
    const imgOut = path.join(OUT_DIR, entry.values.__image);
    if (!fs.existsSync(imgOut)) fs.copyFileSync(GAME_BOARD_SRC, imgOut);
  } else if (renderFn[tpl]) {
    const [file, fn] = renderFn[tpl];
    const mod = require(path.join(PIPE_DIR, file));
    const args = adapters[tpl] ? adapters[tpl](entry.values) : entry.values;
    html = mod[fn](args);
  } else {
    const file = templateFile[tpl];
    if (!file) throw new Error(`Unknown template ${tpl} on slide ${entry.slide}`);
    html = fs.readFileSync(path.join(PIPE_DIR, file), 'utf8');
    for (const [key, val] of Object.entries(entry.values || {})) {
      const token = `{{${key.toUpperCase()}}}`;
      html = html.split(token).join(val == null ? '' : String(val));
    }
  }

  fs.writeFileSync(htmlPath, html, 'utf8');

  const layoutPath = path.join(OUT_DIR, `${base}-layout.json`);
  console.log(`[extract] slide ${n} (${tpl})`);
  execSync(`node extract.js "${htmlPath}" --out "${layoutPath}"`, { cwd: PIPE_DIR, stdio: 'inherit' });
  layoutFiles.push(layoutPath);
}

const mergedOut = path.resolve(PIPE_DIR, '../../basic-1-unit-1-lesson-b-part-1-v3/basic-1-unit-1-lesson-b-part-1-v3.pptx');
console.log('[build] merging', layoutFiles.length, 'slides');
execSync(`node build.js ${layoutFiles.map(f => `"${f}"`).join(' ')} --out "${mergedOut}"`, { cwd: PIPE_DIR, stdio: 'inherit' });

console.log('DONE ->', mergedOut);
