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

Before calling either skill, derive the lesson's coordinates (ask the user if
the source title is ambiguous about which level/unit/lesson/part it maps to)
and create `lessons-output/<level>/<unit>/<lesson>/<part>/` at the repo root —
same nesting as the presenter's own `/lessons/[level]/[unit]/[lesson]/[part]`
URL and its `Level→Unit→Lesson→Part` data model (see `presenter/CLAUDE.md`),
e.g. `lessons-output/basic-1/unit-1/lesson-a/part-2/`. Every artifact this run
produces — extraction doc, ficha, filled HTML, layout JSON, per-slide pptx,
merged pptx — lives inside this one folder. Nothing from this run should land
loose at the repo root or in `.scripts/html-to-pptx/` (that directory is
templates only, never output). `lessons-output/` is where every past and
future generation run lives — this keeps the repo root free of one-off lesson
artifacts that would otherwise accumulate there and make it unclear what's
current vs. historical.

Name the files inside that folder with the flat slug for readability (e.g.
`basic-1-unit-1-lesson-a-part-2.md`), even though the slug is now redundant
with the directory path — this matches what `extract-lesson-slides` and
`arrange-lessons` already produce and keeps filenames self-describing if
copied out of context.

**Re-running the same lesson (a second pass, a correction, a template
update):** don't overwrite the existing content in place and don't invent a
new `-v2`/`-v3` suffix on the folder name — that produces exactly the flat,
hard-to-read sprawl this structure exists to avoid. Instead, move whatever
was previously the "current" content into a dated `runs/` subfolder first
(`runs/<YYYY-MM-DD>-<short-reason>/`, e.g. `runs/2026-07-16-template-fix/`),
then write the new run's output as the folder's top-level content (no
suffix). The top level of `<part>/` is always "the current version"; `runs/`
is where every superseded version lives, oldest to newest by date. If asked
to compare or recover an older version, look in `runs/`.

## 1. Run `extract-lesson-slides`

Invoke the `extract-lesson-slides` skill with the Google Slides URL the user gave
you. Point its output at `lessons-output/<level>/<unit>/<lesson>/<part>/<slug>.md`
instead of asking the user where to save — this orchestrator already decided
that in step 0.

This step requires the `google-slides-mcp` MCP tools to be connected. If they're
not available, stop here and tell the user to authorize/connect that MCP server
first — do not attempt the extraction manually by other means.

Do not skip or shortcut this skill's own steps (image transcription, notes,
pedagogical analysis) — it's the only source of truth for lesson content that
`arrange-lessons` will consume next. Read `extract-lesson-slides`'s own SKILL.md
for the full procedure; this orchestrator only fixes *where things are saved*, not
*how the extraction is done*.

## 2. Run `arrange-lessons`

Invoke the `arrange-lessons` skill with `lessons-output/<level>/<unit>/<lesson>/<part>/<slug>.md` as the
lesson content source. Direct all of its outputs into the same `lessons-output/<level>/<unit>/<lesson>/<part>/`
folder:
- the ficha as `lessons-output/<level>/<unit>/<lesson>/<part>/<slug>-ficha.json`
- filled HTML and per-slide layout/pptx under `lessons-output/<level>/<unit>/<lesson>/<part>/slides/`
- the final merged deck as `lessons-output/<level>/<unit>/<lesson>/<part>/<slug>.pptx`

Follow `arrange-lessons`'s own SKILL.md exactly for classification, generation,
merge, upload, and verification — in particular its hard rule against fabricating
content, and its step 5 verification pass. This orchestrator does not relax or
shortcut any of that; it only tells it where to write files and what to name the
upload.

`arrange-lessons` follows a 1:1 rule (see its own SKILL.md): every slide in the
source lesson gets a generated slide, same order, no skipping, no merging — a
missing template match is resolved by picking the closest-fitting template (or
`SectionTransition` for routine/non-drill beats), never by dropping the slide.
This orchestrator does not relax that rule. If `arrange-lessons` flags a content
gap (a slide shape with no purpose-built template) or an ambiguous template
choice, surface that to the user the same way `arrange-lessons` would — the
slide still gets generated with the closest template either way, the flag is
informational (so the user can review/correct later), not a request for
permission to omit it.

## 3. Report back

Once `arrange-lessons` finishes its own verification (step 5 of its SKILL.md),
report to the user:
- The new Google Slides URL.
- The lesson folder path (`lessons-output/<level>/<unit>/<lesson>/<part>/`), so the user knows where the ficha
  and intermediate files live if they want to review or correct anything.
- Confirmation that the generated slide count matches the source lesson's slide
  count (the 1:1 rule's own success check) — if it doesn't, that's a bug in the
  run, not a quiet omission to gloss over; say so plainly.
- Any flagged gaps or approximated template choices from step 2, even if the
  deck was still generated — don't let a successful upload bury an open flag.

## Failure handling

If either skill fails partway (MCP disconnected, a template mismatch with no
resolution, an upload error), stop and report the failure with whatever partial
artifacts already exist in `lessons-output/<level>/<unit>/<lesson>/<part>/` — don't retry silently or fall back to
inventing content to force a URL out the other end. A failed run that's clearly
reported is better than a "successful" one that papered over a gap.
