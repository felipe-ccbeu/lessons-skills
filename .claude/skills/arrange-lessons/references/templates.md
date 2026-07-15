# CCBEU Template Catalog — HTML → PPTX pipeline

Source of truth for **design**: the 19 HTML templates in
`c:\Users\felipe.fadel\lessons\.scripts\html-to-pptx\*.html`. Source of truth for
**lesson content**: the old lesson's extraction doc (from `/extract-lesson-slides`).

Each template is a standalone HTML file with `{{TOKEN}}` placeholders written
directly into the visible text. Filling a template means string-replacing every
`{{TOKEN}}` with real lesson content, then running the pipeline (see
`../SKILL.md` step 3) to turn that filled HTML into a slide.

**Do not edit these HTML files' structure, CSS, or class names when filling a
lesson.** Only replace the literal `{{TOKEN}}` text. If a template's shape
genuinely doesn't fit a lesson's content (see Known gaps below), don't force it —
flag the gap.

**Exception — templates with a sibling `<name>.render.js`:** a small number of
templates (currently `ChangePlaces` and `WarmupOralTransform`) are "list of N
items" shapes that used to hardcode a fixed row count (`ROW1_*`/`ROW2_*`/
`ROW3_*`, or `SENTENCE1`/`SENTENCE2_PRE`/`SENTENCE3_POST` etc.) directly in
the HTML, which meant a lesson with more items than the template had rows
silently lost content — this happened for real (see the WarmupOralTransform
entry below: a 5-sentence warm-up drill into a template built for 3). For
these, fill by calling the render function with a `rows: [...]` array of
whatever length the source lesson actually has, not by string-replacing fixed
tokens. `WarmupOralTransform` also has optional secondary sections (a CTA
subtitle, a time badge) that drop entirely — not just go text-empty — when
the ficha leaves them out, so a template's side panel can shrink to just its
essential label instead of always rendering full instructional copy.
`templates-tokens.json`'s `dynamic` field on each template's entry documents
the function's exact call shape. If you're adding a new template that has a
repeating row/item/card pattern or an optional secondary section, follow this
same convention rather than hardcoding N slots or always-rendered copy —
check `templates-tokens.json` for `dynamic` first before assuming a template
only takes fixed `{{TOKEN}}`s.

Every template except `ChangePlaces` has a footer text "CCBEU English Center" —
always fixed, never a token, never touched.

---

## 1. Objectives
**File:** `objectives.html`
**Role:** blue full-bleed opening slide — "Today you will be able to…" — lists 3
skill objectives (verb lead-in + sentence, not necessarily USE/ASK/TALK — any
short bold verb/imperative works, see below) plus 4 skill seals
(Listening/Speaking/Reading/Writing, each a real icon with a plain text label
underneath) at the bottom, plus the CCBEU wordmark+star footer mark.
**Background:** solid blue (`#0448DF`), all text white.
**Fixed 2026-07-14** (found while running the pipeline end-to-end on a test
lesson — see `basic-1-unit-1-lesson-a-part-1/` for the ficha that surfaced
these):
- The 4 skill labels used to sit inside a translucent "glass" pill
  (`rgba(255,255,255,0.16)` background). That pill has been removed — the
  reference design has plain text under each icon, no pill. Don't reintroduce
  a background fill on `.seal-pill`.
- The Reading icon asset was a closed book with a single page; replaced with
  an open-book (two-page) icon to match the other three templates using this
  same icon family and the reference design.
- The breadcrumb dot was 10×10px in this template specifically, inconsistent
  with the 8×8px dot every other template uses — fixed to 8×8px.
- This template previously had **no footer at all** (every other template has
  the "CCBEU English Center" text/logo credit at bottom-left) — added the same
  wordmark+star footer mark now used everywhere (see "Footer mark" below).
**Objective line length — read before filling:** each of the 3 objective lines
must render as a single line, no wrap. `OBJ1` in particular has 3 slots
(`OBJ1_PRE`/`OBJ1_HL`/`OBJ1_POST`) that together with `OBJ1_VERB` can run long
— if the lesson's natural phrasing doesn't fit on one line, compress the
wording (shorter connective words, cut a redundant clause) rather than letting
it wrap. The verb doesn't have to be USE/ASK/TALK; any short, all-caps-styled
imperative that's true to the lesson content works (e.g. "GREET", "PRACTICE").

## 2. GettingStarted
**File:** `getting-started.html`
**Role:** lesson-opener title card — big "01"-style unit number, title, one-line
description, right half of the slide is a full-height photo placeholder.
**Background:** white, with a light-gray (`#EEF1F8`) photo panel on the right half.

## 3. WarmupOralTransform
**File:** `warmup-oral-transform.html` shell + `warmup-oral-transform.render.js`
(dynamic-row renderer — **do not fill this one by string-replacing
`{{TOKEN}}`s**, call the render function instead, see below)
**Role:** opening warm-up — 50/50 white/blue split. Left: numbered list of
sentences to transform (e.g. "Change to the negative!"), each with a pink-bold
fill-in-the-blank answer portion inline (e.g. "**I'm not** from China."), plus
a breadcrumb, title, and one-line instruction above the list. Right: solid
blue call-to-action panel (title, e.g. "Work in Pairs!", optional subtitle,
optional pink time/points badge).
**Row count is elastic, not fixed to 3.** This was a real gap found
2026-07-15: a lesson slide with 5 sentences to transform had no template that
could hold more than 3, so 2 sentences were silently dropped. The template
was also rendering the right panel's full instructional copy ("Ring the bell
competition: take turns changing each sentence to the negative with a
partner. First correct answer = 1 point.") even when the source lesson only
called for a short cue — the user's actual preference was to just show "Work
in Pairs!" with no further detail. Both are fixed by
`warmup-oral-transform.render.js`:

```js
const { renderWarmupOralTransform } = require('./warmup-oral-transform.render.js');
const html = renderWarmupOralTransform({
  breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · WARM-UP',
  title: 'Change to the negative!',
  instruction: 'Change the sentences to the negative!',
  rows: [
    { pre: '', answer: "I'm not", post: 'from China.' },
    { pre: '', answer: "I'm not", post: 'James.' },
    { pre: '', answer: "We aren't", post: 'teachers.' },
    { pre: '', answer: "We aren't", post: 'from California.' },
    { pre: '', answer: "You aren't", post: 'beautiful.' },
  ],
  ctaTitle: 'Work in Pairs!',
  ctaSubtitle: '',  // omit/empty -> subtitle paragraph is dropped entirely, panel shows just the title
  timeBadge: '',    // omit/empty -> pink pill is dropped entirely
});
```

Call this instead of step 3's usual "read the .html, string-replace
{{TOKEN}}s" — feed the resulting `html` string straight into `extract.js` the
same as any other filled template. `rows[i].answer` is the highlighted
fill-in-the-blank portion (pink, bold); `pre`/`post` are the plain-text
portions before/after it, per the source lesson's actual sentence structure —
either may be empty (e.g. when the blank leads the sentence, `pre` is empty).
Up to 3 rows renders with the original hand-tuned spacing/font; 4+ rows
auto-shrinks font size (floor 12pt) and row gap to fit the same content band
without overflowing into the footer. Only drop `ctaSubtitle`/`timeBadge` when
the source lesson genuinely didn't specify that level of instructional detail
— don't drop them just to make the slide look cleaner if the original lesson
did call for that framing (per the hard rule in `../SKILL.md`, don't silently
remove content that was actually there).

## 4. GrammarBoxLook
**File:** `grammar-box-look.html`
**Role:** "LOOK!" grammar presentation — big "LOOK!" headline, a pill-style
"GRAMMAR BOX" callout, a 5-row SUBJECT / VERB-TO-BE reference table (with
pink-bold contraction hints floating over blanks), a pink "TIPS!" panel showing
3 expansion→contraction pairs (e.g. "I am → I'm"), and two photo-with-caption
examples underneath (each caption has a contracted form highlighted in pink).
**Notable:** richest template in the set — this is the primary "teach the rule"
slide, distinct from `ChangePlaces` and `GrammarBox2YesNo`, which are drills, not
explanations.

## 5. GrammarBox2YesNo
**File:** `grammar-box-2-yesno.html`
**Role:** "LOOK!" yes/no-question reference — 5-row SUBJECT / YES-NO-QUESTION /
SHORT-ANSWER table, two photo-with-quote-caption examples above the table (each
captioned with a question in quotes, e.g. `"Are you students?"`).
**Notable:** same visual family as `GrammarBoxLook` but the table schema is
question+short-answer, not affirmative statement — don't merge the two, they
teach different grammar shapes.

## 6. ChangePlaces
**File:** `changeplaces.html` shell + `changeplaces.render.js` (dynamic-row
renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**, call the
render function instead, see below)
**Role:** compact Affirmative/Negative/Question-style transform reference — one
sentence per row, no fill-in-the-blank, no hint parens. Simplest grammar-shape
template in the set.
**Background:** white. **No breadcrumb UNIT/LESSON/PART split** — uses a single
free-text `breadcrumb` string instead (e.g. "LESSON 1 · PRACTICE THE GRAMMAR").
**Row count is elastic, not fixed to 3.** This was a real gap found
2026-07-15: a lesson slide with 5 sentences to transform ("I am from China" /
"I am James" / "We are teachers" / "We are from California" / "You are
beautiful") had no template that could hold more than 3 rows, so 2 sentences
were silently dropped. Fixed by converting this template from a static HTML
file with hardcoded `ROW1_*`/`ROW2_*`/`ROW3_*` divs into a render function:

```js
const { renderChangePlaces } = require('./changeplaces.render.js');
const html = renderChangePlaces({
  breadcrumb: 'LESSON 1 · PRACTICE THE GRAMMAR',
  title: 'Change to the negative!',
  rows: [
    { label: '1', sentence: "I'm not from China." },
    { label: '2', sentence: "I'm not James." },
    // ...as many rows as the source lesson actually has
  ],
});
```

Call this instead of step 3's usual "read the .html, string-replace {{TOKEN}}s"
— feed the resulting `html` string straight into `extract.js` the same as any
other filled template. Up to 3 rows renders with the original hand-tuned
spacing; 4+ rows auto-shrinks row height/font (floor 12pt) to fit the same
content band without overflowing into the footer. `rows[].label` is whatever
the source used per row (a number, "Affirmative"/"Negative"/"Question", etc.) —
don't assume it's always the 3-way grammar-role labeling, that's just the
common case.

## 7. Comparative
**File:** `comparative.html`
**Role:** side-by-side statement-vs-question comparison, two tinted cards (blue
accent / pink accent), each with a colored-bold lead word + plain rest of
sentence, plus an underline rule beneath each answer area.
**Notable:** structurally the closest match to the old catalog's
`StatementQuestionCompare` — same left-statement/right-question color contrast
(blue bold left, pink bold right), same "which word is highlighted" logic.

## 8. CompleteTheChart
**File:** `complete-the-chart.html`
**Role:** 2-column x 2-group fill-in-the-blank grammar chart ("I/We" and "You"
groups so far), each row a sentence with a blank + `(= hint)`, pink-bold answer
overlay, plus 3 numbered photo placeholders on the right (one per example
person/context).
**Notable:** `(= )` parens are fixed decoration around the hint span — token only
the hint word itself, not the parens.

## 9. Exercise1
**File:** `exercise-1.html`
**Role:** "Rewrite using contractions" drill — numbered list (5 rows), each row:
original sentence → arrow → rewritten sentence with the contraction highlighted
pink-bold at the start.
**Notable:** the instruction line has a pink-highlighted key term ("short form")
mid-sentence — token that separately from the surrounding plain instruction text.

## 10. Fluency1
**File:** `fluency-1.html`
**Role:** "Ask your partner" fluency drill — two columns of question prompts (4
each), one prompt in the left column has a pink-underlined gap for a personal
answer ("My name is ___________.").

## 11. Fluency2
**File:** `fluency-2.html`
**Role:** "Look and describe" — single large photo placeholder, instruction line
with an italicized key verb phrase highlighted.

## 12. Fluency3
**File:** `fluency-3.html`
**Role:** "Compare the two people" — two side-by-side photo placeholders labeled
PHOTO 1 / PHOTO 2, instruction line above.

## 13. GuessFourImages
**File:** `guess-4-images.html`
**Role:** "Where are they from?" guessing game — 4 photo placeholders in a row,
instruction line, one worked example below in a tinted callout box ("Ex. She's
from Japan." with the country highlighted blue-bold).

## 14. MatchVocabImage
**File:** `match-vocab-image.html`
**Role:** "Match the countries" — one large map/diagram placeholder, 5 pink-bold
vocabulary tags above it, 4 numbered answer chips floating on the right edge of
the map area (word bank matched by number, not by position).

## 15. ListenAndRepeat
**File:** `listen-and-repeat.html`
**Role:** "Listen & Repeat" pair-work — numbered 3-step instruction list on the
left, a two-turn model dialogue on the right rendered as chat bubbles (each with
its own circular avatar photo placeholder).

## 16. PhotoExerciseWhoIsThis
**File:** `photo-exercise-who-is-this.html`
**Role:** "Who is this person?" — large right-half photo placeholder, a
name+role caption pair in pink-bold on the left, a fill-in-the-blank sentence
below with the answer highlighted pink-bold in a gap.

## 17. PracticeQaBadges
**File:** `practice-qa-badges.html`
**Role:** "Answer the questions — both ways" — 4-row Q&A drill, each row: numbered
question (pink title), a green "Yes, ..." answer and a red "No, ..." answer side
by side (both answers shown, not just one model answer — distinct from the old
catalog's `MultiQAPractice`, which only shows one answer per question).

## 18. LessonComplete
**File:** `lesson-complete.html`
**Role:** blue closing "Lesson Complete!" recap slide — 4 labeled columns
(currently: Affirmatives, Questions, Wh-Questions, Other Words), each column a
short vocabulary/grammar list of bold-term + plain-gloss pairs — **column 1 has 4
item slots (`COL1_T1..T4`/`COL1_D1..D4`), columns 2-4 have 3 each
(`COLn_T1..T3`/`COLn_D1..D3`)** — asymmetric, confirmed by grepping the actual
template; don't assume 3 everywhere.
**Background:** solid blue (`#0448DF`), all text white/near-white.
**Notable:** same "add/remove a slot" concern as the old catalog's `LessonRecap`
— if a lesson has a different item count per column than the template's current
3, duplicate/remove a `.term` block in the filled HTML (copy the whole
`<div class="term">...</div>` unit, don't just add text) rather than cramming
two items into one line.

## 19. CoverImage
**File:** `cover-image.html`
**Role:** full-bleed brand cover — solid CCBEU blue background with just the
wordmark+star logo centered, no text, no breadcrumb, no footer. Use for a
pure title/cover moment (e.g. the very first slide of a lesson) where no
lesson content needs to render at all.
**Tokens:** none — this template has no `{{TOKEN}}` placeholders to fill, it's
static. Just point the ficha at it with an empty `values` object.
**Added 2026-07-14**, filling the "CoverImage — not yet built" gap noted
below. Built on the `<img>` pipeline support added the same day (see
"Pipeline capabilities" below) — this template is the reason that work
happened, since a cover with only a logo has nothing else to render.

---

## Pipeline capabilities (extract.js / build.js)

`extract.js` and `build.js` are the two scripts that turn a filled HTML
template into the `.pptx` (see `../SKILL.md` step 3). What they can and can't
capture from the HTML directly shapes what you can put in a template — a few
load-bearing facts, most discovered 2026-07-14 while running the pipeline
end-to-end on a test lesson:

- **`<img>` support was added 2026-07-14.** Before that date, `extract.js` had
  no handling for `<img>` tags at all — every image (skill icons, photo
  placeholders, any logo) silently disappeared from the generated `.pptx`,
  with no error or warning. It's fixed now: `extract.js` resolves each
  `<img>`'s rendered `src` to a data URI and records its on-screen box;
  `build.js` draws it via `addImage`, containing (not stretching) it inside
  that box to preserve the image's own aspect ratio. If you're ever
  troubleshooting "an image is in the HTML but missing from the deck," check
  whether these two scripts are older than 2026-07-14 first.
- **Inline SVG is still not supported** — only `<img>` (raster: PNG/JPEG/etc,
  referenced via `src` or a bundler manifest ref). An inline `<svg>` element
  gets walked as a generic DOM node: its `<text>` children get treated as
  plain text (ignoring the SVG's own coordinate system, so multi-word text
  wraps character-by-character into a stacked mess) and shape children
  (`<polygon>`, `<circle>`, etc.) are silently dropped. Don't try to add a
  vector graphic as inline SVG to save the size of a base64 PNG — rasterize it
  to a PNG first (e.g. render it with Playwright and screenshot just the SVG
  element, the same way `objectives.html`'s Reading icon was fixed) and use
  that as an `<img>` instead.
- **Fixed: text glued to a stacked (not just side-by-side) icon.** A flex
  container laid out in a column (icon above a label, e.g. `.seal` in
  `objectives.html`) used to get its label text measured against the
  *container's* full box (icon height included), not just the label's own
  line — the label rendered vertically centered across the icon+label stack
  instead of anchored under the icon. `extract.js` only checked for this
  "non-text sibling takes up space" case on the X axis (a leading icon in a
  flex *row*); it now checks both axes. If a template's icon+label pairing
  still looks off after this fix, check whether the container is laid out on
  a third axis pattern this fix doesn't cover yet.
- **Fixed: `border-radius` on a very short/thin pill-shaped bar.** A
  fully-rounded bar (`border-radius: 999px`, the usual "pill" convention)
  used to convert to a nonsense `rectRadius` in the output — `extract.js` read
  `getComputedStyle().borderRadius`, which reports the *literal CSS value*
  (`999px`), not the radius actually rendered (clamped to half the shorter
  side at paint time by the browser). For an 88×6px accent bar this became a
  `rectRadius` of 10.4 inches, wildly exceeding pptxgenjs's own max and
  distorting the shape. `extract.js` now clamps the radius itself (mirroring
  the browser's own clamp) before converting px→inches.
- **`templates-tokens.json` is a prebuilt index** (name → `{tokens, body}`) of
  every template, kept next to the `.html` files. It exists purely to save
  context: each template's `.html` is 800KB+ (embedded woff2 fonts), so
  `arrange-lessons` step 2 reads this index instead when it only needs to know
  a template's token names or body markup. Regenerate it with
  `node build-templates-index.js` whenever a template's tokens or markup
  change — nothing reads it automatically, and a stale index just quietly
  shows the old token names.
- **If you ever programmatically rewrite a template's bundled `__bundler/
  template` JSON payload** (not the normal string-replace-a-token workflow —
  something closer to editing the template itself, e.g. what
  `build-templates-index.js`-adjacent tooling or a template-authoring script
  would do): escape `/` as `/` in the re-encoded JSON, the same way the
  original templates do. The payload sits inside a `<script>` tag, and the
  browser's HTML parser ends that tag at the first literal `</script>` it
  finds — including one inside the JSON string. Templates that embed their
  own `<script>` (e.g. `grammar-box-look.html`'s image-hydration script)
  will have one, and a plain `JSON.stringify` without this escape leaves that
  `</script>` unescaped, truncating the bundle. The failure mode is a slide
  that renders nothing but "Error unpacking: Unterminated string in JSON" —
  confirmed 2026-07-14 while building a sample deck across all templates.
  Also splice the new payload in by string index, not `String.replace` — the
  payload contains `$` sequences that `replace`'s special pattern handling
  (`$&`, `$'`, etc.) silently mangles.

## Footer mark

`objectives.html` had no footer at all until 2026-07-14, when a wordmark+star
logo `<img>` mark was added to it (see its entry above). The other 17
templates still use the original plain "CCBEU English Center" text credit —
that has NOT been changed and is still the current, intended footer for all
of them. Don't swap a template's text footer for a logo image on your own
initiative while filling a lesson; if the brand wants that change rolled out
to the rest of the catalog, that's a separate, deliberate template-editing
task, not something to improvise mid-lesson-generation.

---

## Known gaps (roles with no purpose-built HTML template)

Per the 1:1 rule in `../SKILL.md`, a content shape having no purpose-built
template is **not** a reason to omit the slide — every source slide still needs
a generated slide. These are documented so you don't waste time hunting for a
bespoke template that doesn't exist; instead, pick the closest-role template
(or `SectionTransition` for non-drill/routine content) and flag the
approximation in the ficha entry's notes:

- **ConversationPractice** (dialogue-completion with instructional callouts) — no
  HTML template yet. Closest fit: `ListenAndRepeat` (has a model dialogue area)
  or `SectionTransition` if the source slide is mostly instructional framing.
- **MediaActivity** (video/GIF-centered activity) — the HTML→PPTX pipeline has no
  video/GIF embedding path yet either; even if a template existed, embedding
  motion media into a generated `.pptx` is unproven. Use `Fluency2`/`Fluency3`'s
  photo-placeholder shape as a static stand-in and note in the ficha that the
  original was a motion-media activity now represented as a static placeholder.
- **SectionTransition** — this gap is now filled: `section-transition.html`
  exists (tokens: `BREADCRUMB`, `TAG`, `TITLE`, `SUBTITLE`) and is the default
  landing spot for routine/non-drill beats (roll call, homework check, "assign
  practice", game-instruction slides, generic welcome/wrap-up moments) per the
  1:1 rule — use it rather than omitting these slides.
- Any content needing **word-order scramble**, **multi-person photo + numbered
  dialogue matching**, or **teacher-drawn annotation over a book image** — these
  were already flagged as gaps in the old system and still have no bespoke
  template here either. Closest fits: `CompleteTheChart` or `Exercise1` for
  scramble-style drills (adapt the sentence/answer slots), `GuessFourImages` or
  `MatchVocabImage` for multi-person photo matching, `Fluency2`/`Fluency3` for a
  book-image-centered slide with the annotation instructions moved into the
  instruction text instead of drawn over the image.
When a lesson has content that matches one of these gaps, use the nearest-role
template and say explicitly in the ficha note that it's an approximation —
don't stretch a template silently, and don't drop the slide.
