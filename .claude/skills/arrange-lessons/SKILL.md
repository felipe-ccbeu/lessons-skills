---
name: arrange-lessons
description: >
  Generate a new CCBEU English Center lesson slide deck from lesson content, by
  filling {{TOKEN}} placeholders in the CCBEU HTML template set and rendering the
  result to a real, editable .pptx via the html-to-pptx pipeline, then uploading it
  to Google Drive as Google Slides. Use this whenever the user asks to "montar uma
  aula", "criar slides pra aula", "gerar o deck da aula X", points at a lesson .md
  file (e.g. one produced by /extract-lesson-slides) and wants it turned into
  slides, or asks to rebuild/regenerate an old CCBEU lesson in the new template
  system. Also trigger if the user mentions the CCBEU templates, the html-to-pptx
  pipeline, or asks which template fits a piece of lesson content.
tags: [ccbeu, html-to-pptx, google-slides, lesson-generation]
---

# Arrange Lessons

Turns lesson content into a finished CCBEU lesson deck: one HTML template per slide,
filled with real lesson content, rendered to a `.pptx`, uploaded to Drive as Google
Slides. No Slides API, no live master deck — every slide is generated fresh from a
static HTML template file plus data.

## Two sources of truth — don't blur them

- **Content, order, and coverage** (what the lesson teaches, the actual
  sentences/questions/vocabulary, how many slides it takes, and in what
  sequence): the old lesson, via the `/extract-lesson-slides` output. That
  document is authoritative for *what* gets taught, *how* it was taught
  pedagogically (structure, progression, techniques), *how many slides* there
  were, and *what order* they came in — see step 1.
- **Design only** (how it's laid out, styled, colored, positioned): the 18 HTML
  templates in `c:\Users\felipe.fadel\lessons\.scripts\html-to-pptx\*.html`,
  cataloged in `references/templates.md`. Never invent new positioning, colors, or
  layout — and never let template fit change the lesson's content, order, or slide
  count either (see "1:1 rule" below). The templates are a skin, not a filter.

**The pedagogical content is the point.** A deck that looks right but flattens,
merges, or waters down what the original lesson was actually teaching has failed
at the one thing that matters. When a template's fields don't have an exact slot
for something the old lesson did carefully (a specific hint, a specific
highlighted contrast, a specific worked example), that's worth pausing on rather
than quietly dropping — see "Protect the pedagogy" below.

## The 1:1 rule — read this first, alongside the hard rule below

**This skill only restyles a lesson. It never re-edits it.** Every slide in the
source lesson (the extraction doc) produces exactly one slide in the generated
deck, in the exact same order. The set of HTML templates constrains *which
design* a slide gets, never *whether* a slide exists or *where* it sits in the
sequence.

- **No skipping.** A slide with no clean template match still gets a slide.
  Pick the closest-fitting template and put the content in it — even a rough fit
  (a routine/no-exercise moment, a shape the catalog doesn't have a bespoke
  template for) is closer to the source than an absent slide. For slides that are
  genuinely just a classroom-routine or transition beat with no exercise content
  (roll call, homework check, "assign practice", a game-instruction slide), use
  `SectionTransition` — it's the generic breadcrumb+tag+title+subtitle shell built
  for exactly this case, not a fill-in-the-blank template, so there's no content
  to force. Reserve outright skipping for the rare case where a source "slide" has
  truly zero renderable content even for `SectionTransition` (e.g. a fully blank
  transition slide) — and even then, say so explicitly rather than quietly
  shrinking the deck.
- **No merging.** Two source slides never collapse into one generated slide, even
  if they cover related content and a single template could technically hold
  both. If slides 20 and 21 in the source are two halves of one grammar point,
  they still become two generated slides (in the templates that best match each
  half), not one combined slide.
- **No reordering.** Generated slide order == source slide order, always. Don't
  move a slide earlier or later because a different template "flows better"
  there.
- **Trim within a slide, don't drop the slide.** When a template has fewer slots
  than the source slide has items (e.g. an 8-item matching exercise into a
  4-slot template), keep the slide and fit what you can — see "Don't force
  content into a template that doesn't fit" below for how to trim honestly
  (visible in the ficha's notes, not silently). Trimming items *within* one
  slide is fine and sometimes unavoidable; dropping the *slide itself* is not.

The practical effect: **the ficha (step 2) must have exactly as many entries as
the source lesson has slides**, in source order. If the source lesson document
groups several source slides into one narrative block (e.g. "Slides 6-11" as a
repeated pattern), that's fine to describe together in prose, but the ficha
still needs one ficha entry per underlying slide — use the `instances` array
form (see the PhotoExerciseWhoIsThis example in step 2) so each source slide
still maps to its own generated slide, never a single averaged-together one.

## The hard rule — read this first

**Never fabricate lesson content.** Every token's fill value must trace back to
something actually in the source lesson (the extraction doc, or content the user
gave directly in conversation). If a template has a slot the source lesson doesn't
have content for, leave it honestly flagged (see step 2) rather than inventing a
plausible-sounding sentence, name, dialogue, or example to fill the gap. This
happened before — a generated deck once included an invented dialogue and a
photo pulled from unrelated material — and it's the single worst failure mode
this skill can have, worse than an incomplete deck.

## Workflow

### 1. Get the lesson content

Either:
- A path to a lesson `.md` file (typically produced by the `/extract-lesson-slides`
  flow — per-slide text content plus notes on "how it's treated" from an old lesson
  deck), or
- A lesson topic/name given directly in the conversation, with the content to be
  drafted from scratch (confirm with the user before inventing example sentences —
  see the hard rule above; drafting fresh content when explicitly asked to is fine,
  silently inventing to fill a gap is not).

Read the whole thing before doing anything else. You need to see the full lesson to
make good template choices in the next step — picking templates slide-by-slide as
you read linearly tends to produce awkward fits partway through.

`extract-lesson-slides` output can include sections marked "Transcrito da imagem do
livro:" — text that was read via vision from a textbook-page image embedded in the
source slide, not native Slides text. Treat it with the same weight as native slide
text when classifying content; it's real lesson material, just sourced differently.

### 2. Classify content into templates (the "ficha de preenchimento")

This is the step that needs real judgment, not mechanical matching. For each chunk
of lesson content, decide which of the 19 templates in `references/templates.md`
fits best, then split the text into that template's exact `{{TOKEN}}` fields.

**To check a template's exact token names, read
`c:\Users\felipe.fadel\lessons\.scripts\html-to-pptx\templates-tokens.json`, not the
raw `.html` file.** Each `.html` template is 800KB+ (embedded woff2 fonts in its
bundler manifest) — reading it directly wastes a huge amount of context for the
handful of tokens you actually need. `templates-tokens.json` is a prebuilt index
(one entry per template: its `tokens` array and decoded `body` HTML) kept next to
the templates themselves. If a template file has changed since the index was last
built, regenerate it first: `node build-templates-index.js` from that directory
(also re-run this after adding or editing any template, so the index doesn't go
stale for the next lesson).

**Protect the pedagogy — this is the most important part of this step:**

- **Match the pedagogical role, not just the surface shape.** A fill-in-the-blank
  exercise isn't automatically the first grammar-drill template you find — read
  what role the original slide played in the lesson (warm-up, presentation,
  controlled practice, freer practice, recap) and match that role to the
  template's role. `GrammarBoxLook`/`GrammarBox2YesNo` *present* a rule (LOOK!
  framing); `ChangePlaces`/`CompleteTheChart`/`Exercise1` *drill* it. Putting
  presented content into a drill template (or vice versa) changes what the slide
  is asking a student to do, even if the words on it look similar.
- **Preserve what the original lesson chose to highlight.** Whenever a template
  has a colored/bold highlight span, the highlighted token is whatever the source
  lesson emphasized (bold, colored, underlined in the old deck) — not assumed to
  always be a contraction or any particular grammar form. If the old lesson
  highlighted a full phrase, a number, or something unexpected, carry that choice
  over rather than defaulting to "highlight the contraction."
  - **`ROWn_HINT`-style parenthetical glosses**: if the source only glossed some
    rows (e.g. affirmative rows glossed, questions not), leave the unglossed
    row's hint empty rather than inventing a gloss to avoid an empty `( )`. An
    invented hint is fabricated content even if it's grammatically correct.
- **Pick the closest-fitting template rather than dropping the slide — but say
  so.** Per the 1:1 rule above, every source slide still gets a generated slide.
  If nothing in the 18 templates matches a chunk of content well, choose the
  closest one (or `SectionTransition` for routine/no-exercise beats), trim or
  adapt the content honestly to fit its slots, and write a clear note in the
  ficha entry explaining the mismatch and what was trimmed or approximated —
  don't silently mangle it *or* silently drop it. Check `references/templates.md`'s
  "Known gaps" list for shapes that are already-documented, expected mismatches
  (ConversationPractice, MediaActivity, word-order scramble, multi-person
  photo-dialogue matching, teacher annotation over a book image) — for these,
  pick the nearest-role template anyway (e.g. `SectionTransition` or the closest
  drill template) and flag the approximation in the note, rather than treating
  "known gap" as license to omit the slide.
- **Watch for templates whose token schema assumes a shape the source content
  doesn't have.** E.g. a template expecting one sentence naming two people
  together ("Kelly is a teacher and Rubén is a student.") shouldn't be force-fit
  with two *separate* single-person examples ("Hi, I'm Rubén." / "Hello, I'm
  Harumi.") — that means inventing a composite sentence that doesn't exist in the
  source. If you notice this kind of mismatch, treat it the same as "doesn't fit"
  above: flag it, don't paper over it.
- **Decorative vs. content images is a judgment call, not a rule** — different
  runs on the same lesson can reasonably land on different answers, as long as the
  reasoning is stated. Heuristic: could this image be swapped for a different,
  similarly-toned one without losing anything the lesson teaches or references? If
  yes, it's decorative — any suitable placeholder/stock photo is fine. If the
  image is specifically *addressed* by the slide's text or is itself the
  point (a reaction GIF captioned "Yes! We did it!", a specific person's photo a
  caption names), it's content — it must be the real image, not a generic
  placeholder or stand-in. When genuinely unsure, err toward treating it as
  content; a wrong swap is more likely to feel randomly off than a kept original
  is to feel excessive. **Never substitute an unrelated photo for a named/specific
  person or scene** — this produced a real fabrication failure before (an
  unrelated "Student B" photo lifted from other material).

Write the result as one JSON object per slide to generate:

```json
{
  "template": "GrammarBoxLook",
  "values": {
    "BREADCRUMB": "UNIT 1 · LESSON A · PART 2 · GRAMMAR",
    "TITLE": "LOOK!",
    "ROW1_SUBJECT": "I",
    "ROW1_VERB": "am",
    "ROW1_HL": "'m"
  }
}
```

Save this as a `.json` file next to the source content — it's the artifact a human
can review/correct before slides get generated, and it's what step 3 consumes. Show
it to the user before generating slides if there's any ambiguity in the template
choices, and call out explicitly any field you left empty because the source lesson
didn't have content for it (per the hard rule — don't fill silently).

**Templates with a sibling `<name>.render.js` take structured `values` — a
`rows`/`questions`/`options`/`items`/`columns`/`tips`/`keywords`+`answers`
array of arbitrary length instead of fixed `ROWn_*`/`SENTENCEn_*`/`Qn` keys,
and some also have optional secondary fields that drop the whole section (not
just go text-empty) when omitted.** This is every template in the catalog
with a genuine repeating-item shape — currently `ChangePlaces`,
`WarmupOralTransform`, `GrammarBoxLook`, `GrammarBox2YesNo`,
`PracticeQaBadges`, `CompleteTheChart`, `Exercise1`, `Fluency1`,
`MatchVocabImage`, `MultipleChoice`, `PhotoGridBlank`, `MatchingWithChart`,
`ModelExampleList`, `LessonComplete` (15 total; see `references/templates.md`
for each one's exact call shape and example). Check `templates-tokens.json`
for a
`dynamic` field on the template's entry before assuming a fixed row count or
that every visible slide element has a required token. This exists
specifically so a lesson with more items than the template's original
hand-tuned row count (e.g. 5 sentences into a template drafted around 3)
doesn't lose content — put every item from the source slide into the array,
don't truncate to fit an old fixed count. Templates NOT in this list of 9
don't have a repeating-item shape by design (e.g. `Comparative` is always 2
sides, `Objectives` is always 3 objectives) — that's not a gap, growing their
item count would change what the slide means. **Watch out for near-identical
templates that differ in whether they show a side panel** — `ChangePlaces`
(plain white, Affirmative/Negative/Question table, no side panel) and
`WarmupOralTransform` (50/50 white/blue split, blue Pair-Work CTA panel on
the right) both render numbered sentence lists and are easy to conflate; pick
based on whether the source slide actually has that blue call-to-action
panel, not just on the sentence-list shape. Ficha entry for
`WarmupOralTransform` looks like:

```json
{
  "template": "WarmupOralTransform",
  "values": {
    "breadcrumb": "BASIC 1 · UNIT 1 · LESSON B · PART 1 · WARM-UP",
    "title": "Change to the negative!",
    "instruction": "Change the sentences to the negative!",
    "rows": [
      { "pre": "", "answer": "I'm not", "post": "from China." },
      { "pre": "", "answer": "I'm not", "post": "James." },
      { "pre": "", "answer": "We aren't", "post": "teachers." },
      { "pre": "", "answer": "We aren't", "post": "from California." },
      { "pre": "", "answer": "You aren't", "post": "beautiful." }
    ],
    "ctaTitle": "Work in Pairs!",
    "ctaSubtitle": "",
    "timeBadge": ""
  }
}
```

`ctaSubtitle`/`timeBadge` left empty above because the source lesson only
called for a short "Work in Pairs!" cue, not detailed rules text — only drop
them like this when that's genuinely what the source lesson had; if the
original slide did spell out rules/scoring, keep that text in `ctaSubtitle`
rather than dropping it for a cleaner look (per the hard rule — don't
silently remove real content).

### 3. Generate the deck

For each entry in the ficha, in order:

1. Read the template's HTML file fresh from
   `c:\Users\felipe.fadel\lessons\.scripts\html-to-pptx\<template-file>.html`. This
   step genuinely needs the full 800KB+ file, unlike step 2's token lookup — the
   embedded font manifest has to survive into the filled output, or the rendered
   `.pptx` loses its typography. `templates-tokens.json` is a lookup aid for step 2
   only; don't try to reconstruct the final HTML from it.
   **Exception:** if the ficha entry's template has a sibling `<name>.render.js`
   (per step 2 — currently `ChangePlaces`, `WarmupOralTransform`,
   `GrammarBoxLook`, `GrammarBox2YesNo`, `PracticeQaBadges`,
   `CompleteTheChart`, `Exercise1`, `Fluency1`, `MatchVocabImage`,
   `MultipleChoice`, `PhotoGridBlank`, `MatchingWithChart`,
   `ModelExampleList`, `LessonComplete`), skip the string-replace approach
   entirely — `require()` the render module and call
   its render function with the ficha's `values` (e.g.
   `renderChangePlaces({ breadcrumb, title, rows })` or
   `renderWarmupOralTransform({ breadcrumb, title, instruction, rows, ctaTitle,
   ctaSubtitle, timeBadge })` — check `templates-tokens.json`'s `dynamic`
   field or `references/templates.md` for the exact function name and
   argument shape per template); its return value is the filled HTML, already
   the right shape to hand to `extract.js`.
2. Replace every `{{TOKEN}}` occurrence with its fill value from the ficha (plain
   string replace — tokens are unique literal strings like `{{ROW1_SENTENCE}}`, no
   regex needed). Any token the ficha intentionally left empty becomes an empty
   string, not a placeholder sentence.
3. **Never edit anything else in the file** — CSS, structure, class names,
   positioning stay exactly as shipped. If the filled text is dramatically longer
   or shorter than the template's example content, that's a fit problem to flag,
   not something to fix by changing the template's font-size or box width inline.
4. Write the filled HTML to a working file (e.g.
   `<lesson-slug>/<NN>-<template-name>.html` in a scratch/output directory — don't
   overwrite the original template file in the pipeline directory).
5. Run the pipeline on that file, from
   `c:\Users\felipe.fadel\lessons\.scripts\html-to-pptx`:
   ```
   node extract.js <path-to-filled-html> --out <path>-layout.json
   node build.js <path>-layout.json --out <path>.pptx
   ```
6. Repeat for every slide in the ficha. Each slide produces its own single-slide
   `.pptx` at this stage — merging into one multi-slide deck is the next step, not
   part of the per-template build.

### 4. Merge into one deck and upload

- `build.js` accepts multiple `layout.json` files in one call and emits a single
  multi-slide `.pptx`, one slide per file, in the order given:
  ```
  node build.js <01>-layout.json <02>-layout.json <03>-layout.json ... --out <lesson-slug>.pptx
  ```
  Pass the layout.json files in the ficha's lesson order (step 2) — that's the
  final slide order, there's no separate reordering step.
- Upload the final merged `.pptx` with
  `c:\Users\felipe.fadel\lessons\.scripts\gdrive_upload\upload.py <path>.pptx --name "<lesson title>"`.
  This streams the file straight from disk to Drive's upload endpoint and converts
  it to Google Slides — no file bytes pass through the conversation, so this stays
  cheap regardless of deck size.
- Report the resulting Google Slides URL to the user.

### 5. Verify

Open the uploaded deck (or inspect the merged `.pptx` structure) and confirm:
- No literal `{{TOKEN}}` text remains anywhere in the deck — a leftover token means
  a fill value was missing or a token name in the HTML didn't match the ficha.
- No content looks fabricated or out of place (cross-check against the ficha and,
  where in doubt, the original source lesson) — this is the check that catches the
  failure mode the hard rule exists for.
- **Slide count matches the source lesson's slide count, and slide order matches
  the source lesson's slide order** — this is the check that catches the 1:1 rule
  failure mode. If the generated deck has fewer slides than the source, that's a
  bug in this run (a slide got dropped somewhere), not an acceptable outcome — go
  back and find which source slide has no corresponding ficha entry.
- Image placeholders that were meant to carry real content (per step 2's
  decorative-vs-content judgment) actually have real images, not the gray
  "IMAGE"/"PHOTO" placeholder box left unfilled.

## Reference

See `references/templates.md` for the full 19-template catalog: role, HTML
filename, token list, and notes on brand rules (breadcrumb format, highlight
color conventions, PRE/MID/POST-style split tokens). It also lists known gaps —
lesson content shapes with no template yet, inherited from the old system and
still unfilled.

`references/templates-slides-api-legacy.md` is the previous Google-Slides-API-based
catalog (20 templates, master deck `18kFeoPQhftEuMF8SIkAExK6f5uvyOagKBTmnWwY6iuo`).
Kept for historical reference and because it documents some brand/pedagogy
conventions (PRE/MID/POST highlight splitting, image decorative-vs-content
judgment) that still apply conceptually even though the mechanism changed — it is
**not** used by the current workflow and its master-deck IDs, `duplicateObject`/
`replaceAllText` mechanics, and objectId-based instructions no longer apply.
