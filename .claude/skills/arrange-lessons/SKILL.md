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

- **Content** (what the lesson teaches, the actual sentences/questions/vocabulary):
  the old lesson, via the `/extract-lesson-slides` output. That document is
  authoritative for *what* gets taught and *how* it was taught pedagogically
  (structure, progression, techniques) — see step 1.
- **Design** (how it's laid out, styled, colored, positioned): the 18 HTML
  templates in `c:\Users\felipe.fadel\lessons\.scripts\html-to-pptx\*.html`,
  cataloged in `references/templates.md`. Never invent new positioning, colors, or
  layout — if a template's shape doesn't fit the content, that's a gap to flag
  (see the catalog's "Known gaps" section), not a reason to freehand new CSS.

**The pedagogical content is the point.** A deck that looks right but flattens,
merges, or waters down what the original lesson was actually teaching has failed
at the one thing that matters. When a template's fields don't have an exact slot
for something the old lesson did carefully (a specific hint, a specific
highlighted contrast, a specific worked example), that's worth pausing on rather
than quietly dropping — see "Protect the pedagogy" below.

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
- **Don't force content into a template that doesn't fit.** If nothing in the 18
  templates matches a chunk of content well, say so rather than mangling it into
  the closest one. It's fine for a generated deck to have fewer slides than the
  source lesson, or to leave a gap flagged for a human to design a new template
  later — check `references/templates.md`'s "Known gaps" list first, since some
  mismatches are already-documented, expected holes (ConversationPractice,
  MediaActivity, SectionTransition, CoverImage, word-order scramble, multi-person
  photo-dialogue matching, teacher annotation over a book image).
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

### 3. Generate the deck

For each entry in the ficha, in order:

1. Read the template's HTML file fresh from
   `c:\Users\felipe.fadel\lessons\.scripts\html-to-pptx\<template-file>.html`.
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
- Slide order matches the ficha.
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
