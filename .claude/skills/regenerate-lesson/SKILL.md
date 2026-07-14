---
name: regenerate-lesson
description: >
  End-to-end orchestrator: takes a Google Slides URL for an old CCBEU lesson and
  hands back the URL of the newly generated lesson deck. Runs
  `extract-lesson-slides` then `arrange-lessons` in sequence, in a single
  per-lesson folder. Use whenever the user pastes a Google Slides link and wants
  a finished new deck out — "regenera essa aula", "monta a aula a partir desse
  link", "roda o pipeline inteiro pra essa apresentação" — instead of running the
  two skills manually one at a time.
tags: [ccbeu, orchestrator, google-slides, lesson-generation]
---

# Regenerate Lesson

Thin orchestrator over the two skills that already do the real work. It does not
duplicate their logic — it sequences them, fixes where their artifacts live, and
hands the user back one thing: the new deck's URL.

```
Google Slides URL  ──▶  extract-lesson-slides  ──▶  arrange-lessons  ──▶  new Slides URL
                          (content .md)              (ficha .json,
                                                        filled HTML,
                                                        .pptx, upload)
```

## 0. Set up the lesson folder

Before calling either skill, derive a slug from the lesson (ask the user for a
name if the source title is ambiguous, e.g. `basic-1-unit-1-lesson-a-part-2`) and
create `<lesson-slug>/` at the repo root. Every artifact this run produces —
extraction doc, ficha, filled HTML, layout JSON, per-slide pptx, merged pptx —
lives inside this one folder. Nothing from this run should land loose at the
repo root or in `.scripts/html-to-pptx/` (that directory is templates only, never
output).

## 1. Run `extract-lesson-slides`

Invoke the `extract-lesson-slides` skill with the Google Slides URL the user gave
you. Point its output at `<lesson-slug>/<lesson-slug>.md` instead of asking the
user where to save — this orchestrator already decided that in step 0.

This step requires the `google-slides-mcp` MCP tools to be connected. If they're
not available, stop here and tell the user to authorize/connect that MCP server
first — do not attempt the extraction manually by other means.

Do not skip or shortcut this skill's own steps (image transcription, notes,
pedagogical analysis) — it's the only source of truth for lesson content that
`arrange-lessons` will consume next. Read `extract-lesson-slides`'s own SKILL.md
for the full procedure; this orchestrator only fixes *where things are saved*, not
*how the extraction is done*.

## 2. Run `arrange-lessons`

Invoke the `arrange-lessons` skill with `<lesson-slug>/<lesson-slug>.md` as the
lesson content source. Direct all of its outputs into the same `<lesson-slug>/`
folder:
- the ficha as `<lesson-slug>/<lesson-slug>-ficha.json`
- filled HTML and per-slide layout/pptx under `<lesson-slug>/slides/`
- the final merged deck as `<lesson-slug>/<lesson-slug>.pptx`

Follow `arrange-lessons`'s own SKILL.md exactly for classification, generation,
merge, upload, and verification — in particular its hard rule against fabricating
content, and its step 5 verification pass. This orchestrator does not relax or
shortcut any of that; it only tells it where to write files and what to name the
upload.

If `arrange-lessons` flags a content gap (a slide shape with no matching
template) or an ambiguous template choice, surface that to the user the same way
`arrange-lessons` would — don't silently drop the slide or guess past the
ambiguity just to keep the orchestration moving.

## 3. Report back

Once `arrange-lessons` finishes its own verification (step 5 of its SKILL.md),
report to the user:
- The new Google Slides URL.
- The lesson folder path (`<lesson-slug>/`), so the user knows where the ficha
  and intermediate files live if they want to review or correct anything.
- Any flagged gaps or ambiguities from step 2, even if the deck was still
  generated — don't let a successful upload bury an open flag.

## Failure handling

If either skill fails partway (MCP disconnected, a template mismatch with no
resolution, an upload error), stop and report the failure with whatever partial
artifacts already exist in `<lesson-slug>/` — don't retry silently or fall back to
inventing content to force a URL out the other end. A failed run that's clearly
reported is better than a "successful" one that papered over a gap.
