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

**Exception — templates with a sibling `<name>.render.js`:** 15 templates
(`ChangePlaces`, `WarmupOralTransform`, `GrammarBoxLook`, `GrammarBox2YesNo`,
`PracticeQaBadges`, `CompleteTheChart`, `Exercise1`, `Fluency1`,
`MatchVocabImage`, `MultipleChoice`, `PhotoGridBlank`, `MatchingWithChart`,
`ModelExampleList`, `LessonComplete` — every template in the catalog with a
genuine "list of N repeating items" shape) used to hardcode a fixed row/item
count (`ROW1_*`/`ROW2_*`/`ROW3_*`,
`SENTENCE1`/`SENTENCE2_PRE`/`SENTENCE3_POST`, `KEYWORD1`-`KEYWORD5`, fixed
4-column layout, etc.) directly in the HTML, which meant a lesson with more
items than the template had slots silently lost content, or fewer items than
the template's fixed shape left dead space (`LessonComplete`'s case) — this
happened for real (see the WarmupOralTransform entry below: a 5-sentence
warm-up drill into a template built for 3, found 2026-07-15). For these, fill
by calling the render function with a
`rows`/`questions`/`options`/`items`/`columns`/`keywords`+`answers` array
(the exact shape varies per template — check that template's entry below or
`templates-tokens.json`'s `dynamic` field) of whatever length the source
lesson actually has, not by string-replacing fixed tokens.
`WarmupOralTransform` additionally has optional secondary sections (a CTA
subtitle, a time badge), and `MatchVocabImage`'s `answers` is fully optional
— both drop entirely (not just go text-empty) when the ficha leaves them out,
so a template's section can shrink to just its essential parts instead of
always rendering full copy or a fabricated placeholder.
Templates NOT in this list of 15 don't have a repeating-item shape by design
(e.g. `Comparative` is always exactly 2 sides, `Objectives` is always exactly
3 pedagogical objectives) — growing their item count isn't a gap, it would
change what the slide means. `templates-tokens.json`'s `dynamic` field on
each of the 15 entries documents the function's exact call shape. If you're
adding a new template that has a repeating row/item/card pattern or an
optional secondary section, follow this same convention rather than
hardcoding N slots or always-rendered copy —
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
**File:** `grammar-box-look.html` shell + `grammar-box-look.render.js`
(dynamic renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**,
call the render function instead)
**Role:** "LOOK!" grammar presentation — big "LOOK!" headline, a pill-style
"GRAMMAR BOX" callout, a SUBJECT / VERB-TO-BE reference table (with
pink-bold contraction hints floating over blanks), a pink "TIPS!" panel showing
expansion→contraction pairs (e.g. "I am → I'm"), and two photo-with-caption
examples underneath (each caption has a contracted form highlighted in pink).
**Notable:** richest template in the set — this is the primary "teach the rule"
slide, distinct from `ChangePlaces` and `GrammarBox2YesNo`, which are drills, not
explanations.
**Both the table and the tips box have elastic row counts, independently of
each other** (table default 4 rows, tips default 3 — both used to be
hardcoded). Call:
```js
const { renderGrammarBoxLook } = require('./grammar-box-look.render.js');
const html = renderGrammarBoxLook({
  breadcrumb: '...', topicName: 'VERB TO BE',
  ex1Pre: 'Hi, ', ex1Hl: "I'm", ex1Post: 'Camila.',
  ex2Pre: 'Hi, ', ex2Hl: "I'm", ex2Post: 'Rubén.',
  tableHeader: 'AM / IS / ARE',
  rows: [{ subject: 'I', hl: 'am', text: 'from Brazil.' }, /* ...any length */],
  tips: [{ full: 'I am', short: "I'm" }, /* ...any length */],
});
```
Up to 4 table rows / 3 tips render with the original hand-tuned padding/font;
more of either shrinks that section's own padding/font (the table and tips box
don't affect each other's sizing). This template embeds a hydration
`<script>` in its payload (for the two figure images) — the render function
already escapes `</script>` correctly when re-serializing; don't hand-build
this template's HTML any other way or that escaping gets lost and the file
corrupts (`Unterminated string in JSON` when re-parsed — hit this for real
while building the render function, see the fix in `grammar-box-look.render.js`).

## 5. GrammarBox2YesNo
**File:** `grammar-box-2-yesno.html` shell + `grammar-box-2-yesno.render.js`
(dynamic renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**,
call the render function instead)
**Role:** "LOOK!" yes/no-question reference — SUBJECT / YES-NO-QUESTION /
SHORT-ANSWER table, two photo-with-quote-caption examples above the table (each
captioned with a question in quotes, e.g. `"Are you students?"`).
**Notable:** same visual family as `GrammarBoxLook` but the table schema is
question+short-answer, not affirmative statement — don't merge the two, they
teach different grammar shapes.
**Row count is elastic, not fixed to 4.** Call:
```js
const { renderGrammarBox2YesNo } = require('./grammar-box-2-yesno.render.js');
const html = renderGrammarBox2YesNo({
  breadcrumb: '...', photo1Caption: '"Are you students?"', photo2Caption: '"Is she a teacher?"',
  col2Header: 'YES/NO QUESTION', col3Header: 'SHORT ANSWER',
  rows: [{ subject: 'you', qHl: 'Are', qPost: 'a student?', aPre: 'Yes, I', aYes: 'am', aMid: 'No, I', aNo: "'m not" }, /* ...any length */],
});
```
Up to 4 rows render with the original hand-tuned padding/font; more rows
shrinks padding/font to fit the full-width table.

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
**File:** `complete-the-chart.html` shell + `complete-the-chart.render.js`
(dynamic renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**,
call the render function instead)
**Role:** 2-group fill-in-the-blank grammar chart ("I/We" and "You"
groups so far), each row a sentence with a blank + `(= hint)`, pink-bold answer
overlay, plus 3 numbered photo placeholders on the right (one per example
person/context).
**Notable:** `(= )` parens are fixed decoration around the hint span — token only
the hint word itself, not the parens.
**Only the number of ROWS per group is elastic — the number of GROUPS stays
fixed at exactly 2.** Each group is tied to its own fixed-position reference
image; growing the group count would require re-deriving image/numbering
positions the source design never specified (the shipped template even has an
unused, incomplete "Group 3" image+number slot with no table — a known rough
edge, not a usable third group). Call:
```js
const { renderCompleteTheChart } = require('./complete-the-chart.render.js');
const html = renderCompleteTheChart({
  breadcrumb: '...', title: 'Complete the chart',
  group1: { label: 'CONTRACTIONS', rows: [{ sentence: 'I am', answer: "I'm" }, /* ...any length */] },
  group2: { label: 'NEGATIVES', rows: [{ sentence: 'I am not', answer: "I'm not" }, /* ...any length */] },
});
```
Up to 2 rows per group render with the original hand-tuned row height; more
shrinks that group's own row height/font to stay clear of the other group's
box and its image.

## 9. Exercise1
**File:** `exercise-1.html` shell + `exercise-1.render.js` (dynamic renderer
— **do not fill this one by string-replacing `{{TOKEN}}`s**, call the render
function instead)
**Role:** "Rewrite using contractions" drill — numbered list, each row:
original sentence → arrow → rewritten sentence with the contraction highlighted
pink-bold at the start.
**Notable:** the instruction line has a pink-highlighted key term ("short form")
mid-sentence — token that separately from the surrounding plain instruction text.
**Row count is elastic, not fixed to 5.** Call:
```js
const { renderExercise1 } = require('./exercise-1.render.js');
const html = renderExercise1({
  breadcrumb: '...', title: 'Transform the sentences',
  instructionPre: 'Rewrite each sentence using the', instructionHl: 'short form', instructionPost: '.',
  rows: [{ orig: 'I am a teacher.', hl: "I'm", post: 'a teacher.' }, /* ...any length */],
});
```
Up to 5 rows render with the original hand-tuned row height/font (rows stack
via normal document flow, no per-row position math needed); 6+ rows shrinks
row height/font to fit the content band.

## 10. Fluency1
**File:** `fluency-1.html` shell + `fluency-1.render.js` (dynamic renderer —
**do not fill this one by string-replacing `{{TOKEN}}`s**, call the render
function instead)
**Role:** "Ask your partner" fluency drill — two columns of question prompts,
one prompt can have a pink-underlined gap for a personal answer ("My name is
___________.").
**Question count is elastic, not fixed to 8 (4+4).** Questions are one flat
array, auto-split evenly across the two columns (left gets the extra one on
an odd count) — there's no separate left/right input. Call:
```js
const { renderFluency1 } = require('./fluency-1.render.js');
const html = renderFluency1({
  breadcrumb: '...', title: 'Fluency practice', instruction: 'Ask and answer with a partner.',
  questions: [
    'What is your name?',
    { pre: 'My favorite color is' }, // renders with a trailing "___________." blank
    // ...any length
  ],
});
```
Up to 4 questions per column render with the original hand-tuned spacing/font;
more per column shrinks gap/font to fit.

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
**File:** `match-vocab-image.html` shell + `match-vocab-image.render.js`
(dynamic renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**,
call the render function instead)
**Role:** "Match the countries" — one large map/diagram placeholder, pink-bold
vocabulary tags above it, numbered answer chips floating on the right edge of
the map area (word bank matched by number, not by position).
**Both `keywords` and `answers` are independently elastic lists — they don't
have to be the same length** (the shipped template already had 5 keywords but
only 4 answer chips, so unequal counts are the normal case). Call:
```js
const { renderMatchVocabImage } = require('./match-vocab-image.render.js');
const html = renderMatchVocabImage({
  breadcrumb: '...', title: 'Match the vocabulary', instruction: 'Look at the map and match each word to the picture.',
  keywords: ['park', 'school', 'hospital', /* ...any length */],
  answers: ['park', 'school', /* ...any length, independent of keywords.length */],
});
```
The keyword row switches the shipped template's `justify-content:
space-between` for an explicit gap once rendered, since space-between's
spacing is a function of item count and would otherwise vary unpredictably at
counts other than 5.
**`answers` is optional** (added 2026-07-15) — omit it or pass an empty array
for a plain "keyword list + central image" slide with no matching/answer
step at all (e.g. a pronunciation-practice slide: a list of countries next
to a decorative map, nothing to match). When omitted, the whole numbered-chip
column is dropped entirely, not left as an empty column. Don't fabricate an
answers list just to satisfy this template when the source lesson genuinely
has no answer step — that would be inventing content (per the hard rule in
`../SKILL.md`).

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
**File:** `practice-qa-badges.html` shell + `practice-qa-badges.render.js`
(dynamic renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**,
call the render function instead)
**Role:** "Answer the questions — both ways" — Q&A drill, each row: numbered
question (pink title), a green "Yes, ..." answer and a red "No, ..." answer side
by side (both answers shown, not just one model answer — distinct from the old
catalog's `MultiQAPractice`, which only shows one answer per question).
**Row count is elastic, not fixed to 4.** Call:
```js
const { renderPracticeQaBadges } = require('./practice-qa-badges.render.js');
const html = renderPracticeQaBadges({
  breadcrumb: '...', title: 'Ask and answer!',
  rows: [{ question: 'Are you a student?', yes: 'Yes, I am.', no: "No, I'm not." }, /* ...any length */],
});
```
Up to 4 rows render with the original hand-tuned row height/font (rows stack
via normal document flow); 5+ rows shrinks row height/font to fit.

## 18. LessonComplete
**File:** `lesson-complete.html` shell + `lesson-complete.render.js` (dynamic
renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**, call
the render function instead)
**Role:** blue closing "Lesson Complete!" recap slide — N labeled columns
(e.g. Affirmatives, Negatives, Questions, Wh-Questions — whatever categories
the lesson actually recapped), each column a short vocabulary/grammar list of
bold-term + plain-gloss pairs.
**Background:** solid blue (`#0448DF`), all text white/near-white.
**Column count is elastic, 1 to 4 — as is each column's own term count.**
This was a real gap found 2026-07-15: the old template hardcoded exactly 4
fixed-position columns (asymmetric: column 1 had 4 term slots, columns 2-4
had 3 each), so a lesson that only recapped 2 categories left 2 columns
completely empty, wasting half the slide. Call:
```js
const { renderLessonComplete } = require('./lesson-complete.render.js');
const html = renderLessonComplete({
  breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1',
  columns: [
    { header: 'AFFIRMATIVES', terms: [{ t: "She's", d: 'Spanish.' }, /* ...any length */] },
    { header: 'NEGATIVES', terms: [{ t: "She's not", d: 'Japanese.' }, /* ...any length */] },
    // ...1 to 4 columns total
  ],
});
```
Columns spread evenly across the same content band the old template used
(don't pass more than 4 — the band can't fit a 5th without overlapping the
title); font size is shared across all columns, computed from whichever
column has the most terms. Only fill in categories the source lesson
actually recapped — don't invent a Questions/Wh-Questions column just to
reach 4 (per the hard rule in `../SKILL.md`, don't fabricate content to fill
a template's shape).

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

## 20. MultipleChoice
**File:** `multiple-choice.html` shell + `multiple-choice.render.js` (dynamic
renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**, call
the render function instead)
**Role:** "Books closed! Do you remember?"-style recall quiz — small pink
eyebrow tag, a large blue question, and a lettered list (A, B, C, ...) of
free-form alternatives underneath. No option is marked correct on the slide
— this is a question the class answers aloud, not an answer key (matches how
the source lesson used it: the teacher knew the answer, the slide didn't
show it).
**Background:** white.
**Added 2026-07-15**, filling a real gap found while regenerating
`basic-1-unit-1-lesson-b-part-1-v2/`: a 3-option recall quiz ("Is Heather
Watson a _______? / Baseball player. / Tennis player. / Basketball player.")
had no matching template — `PracticeQaBadges` is Yes/No binary only, doesn't
fit N free-form alternatives.
**Option count is elastic, not fixed to 3.** Call:
```js
const { renderMultipleChoice } = require('./multiple-choice.render.js');
const html = renderMultipleChoice({
  breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · RECAP',
  tag: 'Books closed! Do you remember?',
  question: 'Is Heather Watson a _______?',
  options: ['Baseball player.', 'Tennis player.', 'Basketball player.'],
});
```
Up to 3 options render with the original hand-tuned row height/font (options
stack via normal document flow, same shape as `Exercise1`/`PracticeQaBadges`);
4+ options shrinks row height/font to fit the content band. Supports at most
26 options (A-Z).

## 21. PhotoGridBlank
**File:** `photo-grid-blank.html` shell + `photo-grid-blank.render.js`
(dynamic renderer — **do not fill this one by string-replacing
`{{TOKEN}}`s**, call the render function instead)
**Role:** a grid of N anonymous photos (no names), each captioned with a
fill-in-the-blank sentence — e.g. "Complete the sentences with he's, she's,
or they're." with 6 photos captioned "___ Italian.", "___ Chinese.", etc.
**Not the same role as `PhotoExerciseWhoIsThis`**, which is built for exactly
ONE *named* person per slide (`PERSON_NAME`/`PERSON_ROLE`) — don't use
`PhotoGridBlank` for a single named celebrity slide, and don't force
`PhotoExerciseWhoIsThis` onto a multi-photo anonymous grid (that would mean
either fabricating N slides out of 1 source slide, breaking the 1:1 rule, or
leaving `PERSON_NAME` empty, which is template misuse).
**Background:** white.
**Added 2026-07-15**, filling a real gap found the same run as
`MultipleChoice` above: Exercise 1B(a) had 6 anonymous photos in one source
slide, each with a blank to complete — no template fit a multi-photo grid
with per-photo captions.
**Item count is elastic, not fixed to 4.** Call:
```js
const { renderPhotoGridBlank } = require('./photo-grid-blank.render.js');
const html = renderPhotoGridBlank({
  breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · BOOK',
  title: "Complete the sentences with he's, she's, or they're.",
  items: [
    { answer: "He's", text: 'Italian.' },
    { answer: "She's", text: 'Chinese.' },
    // ...any length
  ],
});
```
Unlike the row-stacking elastic templates (`Exercise1`, `PracticeQaBadges`),
this is a genuine 2D grid — the render function picks a column count (up to 4
for ≤4 items, 3 for 5-6, 4 for 7-8, 5 for 9+) and computes photo size and
caption font from both column count and row count together, not just one
dimension.

## 22. MatchingWithChart
**File:** `matching-with-chart.html` shell + `matching-with-chart.render.js`
(dynamic renderer — **do not fill this one by string-replacing
`{{TOKEN}}`s**, call the render function instead)
**Role:** a combined two-part exercise in one slide — a numbered matching
drill (N numbered prompts matched to M lettered options, with an optional
answer key line) on the left, a small fill-in-the-blank chart on the right,
separated by a vertical divider. Matches the shape of Cambridge-style
"Exercise 2A+2B" pages: "Match 1-3 with a-c. Listen and check." followed by
"Complete the chart" (he is → he's, they are → they're).
**Background:** white.
**Added 2026-07-15**, filling a real gap: no existing template covers two
different drill shapes stacked in one slide — forcing this into any
single-purpose template would mean dropping either the matching drill or the
chart.
**Both halves have elastic row counts.** Call:
```js
const { renderMatchingWithChart } = require('./matching-with-chart.render.js');
const html = renderMatchingWithChart({
  breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · BOOK',
  title: 'Match 1-3 with a-c. Listen and check.',
  matchLabel: 'Match 1-3 with a-c',
  matchPrompts: ['Heather Watson is a tennis player.', 'Shohei Ohtani is a baseball player.', 'Serena and Venus Williams are tennis players.'],
  matchOptions: ["He's Japanese.", "They're American.", "She's British."],
  matchAnswerKey: 'Answers: 1-c, 2-a, 3-b',
  chartLabel: 'Complete the chart',
  chartRows: [{ label: 'he is', answer: "he's" }, { label: 'they are', answer: "they're" }],
});
```
This is inherently a dense two-column layout by design (sharing the slide
width between two exercises) — it does not aggressively auto-shrink font the
way single-purpose full-width templates do, so keep each half reasonably
short rather than relying on the template to rescue an overloaded slide.
Supports at most 26 match options (a-z).

## 23. ModelExampleList
**File:** `model-example-list.html` shell + `model-example-list.render.js`
(dynamic renderer — **do not fill this one by string-replacing
`{{TOKEN}}`s**, call the render function instead)
**Role:** a worked example (shown in a highlighted pink "Example" pill) plus
N more practice items in the same shape — e.g. a notebook-exercise
instruction slide: "Example: Neymar is brazilian, he is a soccer player."
followed by 3 more names/nationalities/jobs for the student to produce in
the same pattern.
**Distinct from `Exercise1`** (which pairs an original sentence with its
arrow-transformed rewrite — a transformation, not a flat list) **and from
`MultipleChoice`/`PracticeQaBadges`** (which are question-driven, this is
not a question at all, just a modeled pattern to imitate).
**Background:** white.
**Added 2026-07-15**, filling a real gap: a notebook-exercise instruction
slide (1 worked example + 3 practice items, all same-shape statements) had
no matching template — none of the existing list templates fit "flat list of
same-shape statements with one flagged as the model."
**Item count is elastic, not fixed to 3.** Call:
```js
const { renderModelExampleList } = require('./model-example-list.render.js');
const html = renderModelExampleList({
  breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · NOTEBOOK',
  title: 'Talk about nationalities and jobs',
  example: 'Neymar is brazilian, he is a soccer player.',
  items: [
    'Zhu Ting is chinese, she is a volleyball player.',
    'Ricky Rubio is spanish, he is a basketball player.',
    'Javier and Guillermo are soccer players, they are mexican.',
  ],
});
```
Up to 3 items render with the original hand-tuned row height/font (items
stack via document flow, same shape as `Exercise1`); 4+ items shrinks row
height/font to fit the content band.

---

## 24. MatchLetters
**File:** `match-letters.html` shell + `match-letters.render.js` (dynamic
renderer — **do not fill this one by string-replacing `{{TOKEN}}`s**, call
the render function instead)
**Role:** letter-matching WITH a photo grid — a pre-built grid image (the
actual photos/flags/captions from the source lesson, e.g. 8 athletes each
labeled a-h) on the left, paired with an elastic term↔letter list (e.g.
nationality → its matching letter) on the right. Fills the "letter-matching
without a central image" gap noted below in Known gaps — distinct from
`MatchVocabImage`, which assumes one central image/map with numbered answer
chips anchored to it (this template's image is a full N-photo grid, not a
single map).
**Background:** white.
**Added 2026-07-16**, for a real case: "Books p. 10 - Exercise 1B - Match the
nationalities" in `basic-1-unit-1-lesson-b-part-1-v3/`. **Corrected the same
day**: the first version of this template dropped the photo grid entirely and
rendered text-only (term↔letter list, no image) — this lost the actual
content of the exercise, since the grid of real photos (each captioned with
flag + name + role) *is* the matching puzzle, not decoration around it. Fixed
by cropping the grid region directly out of the original slide's own
screenshot (same `export/png` mechanism `extract-lesson-slides` already uses)
into a single PNG, so the photos, flags, and captions are guaranteed to be the
real ones from the source lesson — never fabricated or swapped for generic
placeholders (per the hard rule in `../SKILL.md`).
**The `gridImage` is a single pre-built image path, not N separate photos
this template lays out itself.** This template composites one already-correct
grid image with the elastic term/letter list beside it — it does not attempt
to place N individual photos into a grid (that's `PhotoGridBlank`'s job for
anonymous/blank-caption photos; this one assumes the grid arrives pre-built
because its captions/flags are real book-page content, not something to
regenerate token by token).
**Only use the term↔letter pairing when that mapping is already resolved in
the source content.** If the mapping itself was never captured clearly (e.g.
flag images that were never transcribed with clear correspondence), this
template doesn't fix that — that's a re-extraction problem, not a template
gap. Fall back to `SectionTransition` with the vocabulary list in the
subtitle in that case, same guidance as before this template existed.
**Row count is elastic, not fixed to 8.** Call:
```js
const { renderMatchLetters } = require('./match-letters.render.js');
const html = renderMatchLetters({
  breadcrumb: 'BASIC 1 · UNIT 1 · LESSON B · PART 1 · BOOK',
  title: 'Match the nationalities',
  gridImage: 'data:image/png;base64,iVBORw0KG...', // MUST be a data: URI, not a relative/file path — see "Pipeline capabilities" note on file:// + fetch() below
  rows: [
    { term: 'American', letter: 'C' },
    { term: 'Chinese', letter: 'G' },
    // ...any length
  ],
});
```
Up to 8 rows render with the original hand-tuned row height/font; 9+ rows
shrinks row height/font (floor ~12pt) to fit the same content band.
**`gridImage` must already be a `data:` URI by the time it reaches this
function** — pass a relative path like `'./nationality-grid.png'` and the
image will render fine in a visual preview but silently vanish from the
final `.pptx` (see the `file://` + `fetch()` failure mode documented under
"Pipeline capabilities" below). Read the PNG with `fs.readFileSync` and
base64-encode it into the `gridImage` string yourself before calling
`renderMatchLetters`, in whatever script drives the ficha → HTML generation
step.

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
- **A local `<img src="./file.png">` (a plain relative/file path, not a data:
  URI or a bundler manifest ref) silently loses its image in the final
  `.pptx` even though it renders perfectly in every visual preview —
  `extract.js`'s own resolution step converts each `<img>`'s `src` to a data
  URI by doing an in-page `fetch(img.currentSrc)`, and Chromium's `fetch()`
  refuses `file://` URLs outright ("URL scheme 'file' is not supported"),
  while the same file loads completely normally as an `<img>` for on-screen
  rendering. The two code paths (visual render vs. the fetch-based data-URI
  resolution `extract.js` needs before handing off to `build.js`) diverge
  silently — `extract.js`'s own `catch` swallows the fetch failure into a
  `console.warn` inside the *page's* console, which never surfaces to your
  terminal unless you attach a `page.on('console', ...)` listener yourself.
  Net effect: a screenshot check of the filled HTML looks completely correct,
  the pipeline logs "N images" with no error, and the image is still just
  gone from the uploaded deck — found for real 2026-07-16 in
  `basic-1-unit-1-lesson-b-part-1-v3/` (a custom `MatchLetters` template's
  photo grid, and a `Fluency2` slide's real game-board photo, both went
  missing this exact way). **The fix**: never leave a locally-sourced image as
  a relative/file path in the HTML you hand to `extract.js` — inline it as a
  `data:image/png;base64,...` URI yourself first (read the file with `fs`,
  base64-encode it, put that directly in the `src` attribute). `extract.js`'s
  fetch step already early-returns for any `src` that starts with `data:`
  (see its own comment: "if data:, use directly"), so this sidesteps the
  broken fetch path entirely rather than working around it. When you have
  ficha values with a filesystem path (e.g. `MatchLetters`'s `gridImage`),
  convert it to a data URI in the generation script *before* calling the
  template's render function — don't pass the raw path through and assume the
  template or the pipeline will resolve it later.
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
  scramble-style drills (adapt the sentence/answer slots), `GuessFourImages`,
  `MatchVocabImage`, or `PhotoGridBlank` for multi-person photo matching
  (`PhotoGridBlank` if the photos are anonymous with per-photo captions,
  `PhotoExerciseWhoIsThis` — called once per source slide — if each photo is a
  single named person on its own source slide), `Fluency2`/`Fluency3` for a
  book-image-centered slide with the annotation instructions moved into the
  instruction text instead of drawn over the image.
- **MultipleChoice**, **PhotoGridBlank**, **MatchingWithChart**, and
  **ModelExampleList** — these gaps are now filled (see entries 20-23
  above), added 2026-07-15 after all four showed up for real in
  `basic-1-unit-1-lesson-b-part-1-v2/`. The `LessonComplete` fixed-4-column
  imbalance (a 2-category recap leaving 2 columns empty) is also fixed —
  `LessonComplete` is now elastic (1-4 columns), see entry 18.
- **Letter-matching without a central image** — this gap is now filled:
  `match-letters.html` / `match-letters.render.js` (entry 24 below), added
  2026-07-16 for the "Match the nationalities" slide in
  `basic-1-unit-1-lesson-b-part-1-v3/`, where the extraction had already
  resolved every letter to its nationality via `summarize_presentation`'s own
  text output. Only use this template when the letter↔term mapping is
  actually known — if it isn't (e.g. flag images never transcribed with clear
  correspondence), that's still a re-extraction problem, not something this
  template papers over; fall back to `SectionTransition` with the vocabulary
  list in the subtitle in that case, same as before.
When a lesson has content that matches this gap, use the nearest-role
template and say explicitly in the ficha note that it's an approximation —
don't stretch a template silently, and don't drop the slide.
