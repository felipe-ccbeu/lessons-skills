# CCBEU Template Catalog — HTML → PPTX pipeline

Source of truth for **design**: the 18 HTML templates in
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

Every template except `ChangePlaces` has a footer text "CCBEU English Center" —
always fixed, never a token, never touched.

---

## 1. Objectives
**File:** `objectives.html`
**Role:** blue full-bleed opening slide — "Today you will be able to…" — lists 3
skill objectives (USE/ASK/TALK-style bold lead-in + sentence) plus 4 skill pills
(Listening/Speaking/Reading/Writing) at the bottom.
**Background:** solid blue (`#0448DF`), all text white.
**Notable:** the 4 skill pills use a translucent white fill (16% opacity "glass"
effect over the blue) — this is already handled correctly by the pipeline's alpha
capture, don't flatten it to solid white when editing.

## 2. GettingStarted
**File:** `getting-started.html`
**Role:** lesson-opener title card — big "01"-style unit number, title, one-line
description, right half of the slide is a full-height photo placeholder.
**Background:** white, with a light-gray (`#EEF1F8`) photo panel on the right half.

## 3. WarmupOralTransform
**File:** `warmup-oral-transform.html`
**Role:** opening warm-up — numbered list (currently 4 rows) of plain sentences
students transform aloud with a partner (e.g. make negative, make a question). No
answers shown on the slide — it's oral/live, not a written drill.

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
**File:** `changeplaces.html`
**Role:** compact 3-row Affirmative/Negative/Question transform reference — one
sentence per row, no fill-in-the-blank, no hint parens. Simplest grammar-shape
template in the set.
**Background:** white. **No breadcrumb UNIT/LESSON/PART split** — uses a single
free-text `{{BREADCRUMB}}` line instead (e.g. "LESSON 1 · PRACTICE THE GRAMMAR").
**Tokens:** `{{BREADCRUMB}}, {{TITLE}}, {{ROW1_LABEL}}, {{ROW1_SENTENCE}},
{{ROW2_LABEL}}, {{ROW2_SENTENCE}}, {{ROW3_LABEL}}, {{ROW3_SENTENCE}}`

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

---

## Known gaps (roles from the old 20-template catalog with no HTML template yet)

Don't force content into a template whose shape doesn't fit — flag these as gaps
instead, same discipline as before:

- **ConversationPractice** (dialogue-completion with instructional callouts) — no
  HTML template yet.
- **MediaActivity** (video/GIF-centered activity) — the HTML→PPTX pipeline has no
  video/GIF embedding path yet either; even if a template existed, embedding
  motion media into a generated `.pptx` is unproven.
- **SectionTransition** (generic non-drill title/transition card: welcome,
  ice-breaker, celebration, wrap-up) — `GettingStarted` covers the lesson-opening
  case specifically; a mid-lesson or closing transition card with a free-text
  `{{TAG}}` role label (as the old catalog had) has no equivalent yet.
- **CoverImage** (full-bleed photo, no text) — not yet built as an HTML template.
- Any content needing **word-order scramble**, **multi-person photo + numbered
  dialogue matching**, or **teacher-drawn annotation over a book image** — these
  were already flagged as gaps in the old system and still have no template here
  either.

When a lesson has content that matches one of these gaps, say so explicitly
rather than stretching `GrammarBoxLook`, `PracticeQaBadges`, etc. to cover it.
