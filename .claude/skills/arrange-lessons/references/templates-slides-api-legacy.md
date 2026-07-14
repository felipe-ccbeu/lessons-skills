# CCBEU Master Deck — Template Catalog

Master deck: `18kFeoPQhftEuMF8SIkAExK6f5uvyOagKBTmnWwY6iuo`
Backup: `17aH-AfAXwS0uvSXdETeGAAEMNsvuPMmeE3bn9hA0vuY`

Each template's slide in the master also carries a speaker note with
`TEMPLATE=<name>` and `CHAVES=[...]` — treat this file as the authoritative,
up-to-date version if the two ever disagree (the notes are documentation for a human
opening the deck, this file is what the skill should actually parse from).

## Brand rules that apply to every template

- **Breadcrumb** — every template except `CoverImage` and `ConversationPractice` has
  a breadcrumb built from three tokens: `{{UNIT}} · {{LESSON}} · {{PART}}` (middle dot,
  U+00B7). Each token's value already includes its own label, e.g. `UNIT` = `"UNIT 1"`,
  `LESSON` = `"LESSON A"`, `PART` = `"PART 2"`. Some templates append a literal,
  non-tokenized suffix after PART that identifies the template's role in the lesson:
  `WarmUpFillBlanks` → `· WARM-UP`, `ObjectivesSlide` → `· OBJECTIVES`, `FluencyIntro`
  and `StepsFluency` → `· FLUENCY`, `LessonRecap` → `· LESSON COMPLETE`,
  `StatementQuestionCompare` and `GrammarByPerson` → `· GRAMMAR`. All other templates
  have a plain breadcrumb with no suffix.
- **Colors** — pink bold `#fd3682` (Poppins bold) usually marks the answer/highlighted
  word or phrase, but it isn't a universal "pink = answer" rule — `StatementQuestionCompare`
  uses blue bold for the statement side and pink bold for the question side specifically
  to contrast the two, not to mark one as correct. Always check the actual color of each
  run in the master slide rather than assuming pink = highlight; dark `#0e1116`
  (near-black) = body text; grey `#9aa1ac` = the fixed "CCBEU English Center" footer,
  which is never a token — leave it as-is.
- **PRE/MID/POST** — whenever a highlight falls in the *middle* of a sentence, the
  sentence is three adjacent tokens: `{{X_PRE}}` (plain) + `{{X_MID}}` (highlight color —
  whatever the lesson wants to highlight, not assumed to be any particular grammar
  form, may need a leading/trailing space baked into its fill value depending on what's
  adjacent) + `{{X_POST}}` (plain). Sometimes MID sits inside other static punctuation
  baked into the same run (e.g. `GrammarByPerson`'s `"{{ROWn_SENTENCE}} (= {{ROWn_MID}})"`
  — the `" (= "` and `")"` around it are fixed, not tokens).
- **Images** — two patterns exist in the master, both use the same `{{IMG_*}}` naming:
  - *Invisible alt-text tokens* (templates 1–15): a real embedded image's alt-text
    `title` field is set to the token, e.g. `{{IMG_1}}`. Read it via the page element's
    `title` field, not from the visible canvas — it's not shown on the slide.
    Fill by calling `replaceImage` on that objectId.
  - *Visible placeholder boxes* (template 17 `GrammarByPerson`, and likely future
    templates): a grey rounded-rectangle with a numbered badge and the token itself as
    visible text (e.g. a box that literally reads `{{IMG_1}}`), no embedded image yet.
    Fill by replacing that text and either overlaying a real image on top of the box
    (then deleting or hiding the box) or converting the shape to an image via
    `replaceImage` if the API allows targeting a non-image shape (verify before relying
    on this — if it doesn't work, delete the placeholder shape and insert a new image
    element at the same `transform`/`size`).
  - Either way, re-resolve the objectId after duplicating a slide — it changes every
    time you duplicate.

---

## 1. CoverImage
**Role:** full-bleed cover photo opening the lesson. No text.
**Master objectId:** `g3f1c87e0de9_2_0`
**CHAVES:** *(none — image only)*
**Images:** `IMG_HERO`

## 2. WarmUpFillBlanks
**Role:** opening warm-up — 3 fill-in-the-blank sentences with the answers shown as
floating pink-bold overlays positioned on top of each blank.
**Master objectId:** `g3f1c87e0de9_0_187`
**CHAVES:** `UNIT, LESSON, PART, TITLE, INSTRUCTION, Q1, A1, Q2, A2, Q3, A3`
**Images:** `IMG_1`
**Note:** A1/A2/A3 are separate shapes positioned to sit exactly over the blank in
Q1/Q2/Q3 respectively — check the answer word's length doesn't visually overrun the
blank when you fill it.

## 3. ObjectivesSlide
**Role:** blue "Today you will be able to…" slide, USE/TO/IN structure, 4 skill icons.
**Master objectId:** `p2`
**CHAVES:** `UNIT, LESSON, PART, HEADLINE, OBJ_USE, OBJ_TO, OBJ_IN, SKILL1, SKILL2, SKILL3, SKILL4`
**Images:** `IMG_HERO, IMG_LISTENING, IMG_SPEAKING, IMG_READING, IMG_WRITING` (pair
with SKILL1–4 in that order)
**Note:** `USE`, `TO`, `IN` are fixed bold labels baked into the master — do not
tokenize them, only the text that follows each.

## 4. ListenPairWork
**Role:** listening exercise done in pairs — "Listen!" title, PAIR WORK tag,
instruction, and a worked-answer sentence with two highlighted names.
**Master objectId:** `p3`
**CHAVES:** `UNIT, LESSON, PART, TITLE, TAG, INSTRUCTION, NAME1, MID, NAME2, POST`
**Images:** `IMG_PERSON1, IMG_PERSON2, IMG_3`
**Note:** NAME1/NAME2 are pink bold; MID/POST are plain black.

## 5. GrammarBox
**Role:** Affirmative/Negative two-column grammar reference, 4 rows. Each row has a
sentence with a blank, a `(= hint)` in parens, and a floating pink-bold contraction
bubble positioned over the blank.
**Master objectId:** `g3f1c35d80d7_0_174`
**CHAVES:** `UNIT, LESSON, PART, TITLE, COL1_HEADER, COL2_HEADER,` and for each row
`n` in 1–4: `ROWn_SENTENCE, ROWn_HINT, ROWn_MID`
**Images:** `IMG_1, IMG_2`
**Note:** the `(= ` and `)` around `ROWn_HINT` are static, fixed punctuation — don't
include them in the hint's fill value. `ROWn_MID` is a separate floating shape, not
inline in `ROWn_SENTENCE` — its value must match whatever word the blank in
`ROWn_SENTENCE` is standing in for.

## 6. DialogueHighlight
**Role:** "LOOK!" — two big example quotes, each with a pink-bold highlight in the
middle.
**Master objectId:** `g3f1c35d80d7_0_212`
**CHAVES:** `UNIT, LESSON, PART, TITLE, Q1_PRE, Q1_MID, Q1_POST, Q2_PRE, Q2_MID, Q2_POST`
**Images:** `IMG_PERSON1, IMG_PERSON2`

## 7. PracticeTransform
**Role:** 5-row sentence transformation drill — source sentence on the left, an arrow,
then the transformed answer with a pink-bold highlighted portion.
**Master objectId:** `p4`
**CHAVES:** `UNIT, LESSON, PART, TITLE, TAG, INSTRUCTION,` and for each row `n` in
1–5: `ROWn_SOURCE, ROWn_ANSWER_HL, ROWn_ANSWER_POST`
**Images:** `IMG_1`
**Known limitation:** `INSTRUCTION` is a single plain token — the master's original
instruction text had a couple of words in black bold mid-sentence (not the pink brand
highlight, just typographic emphasis) that gets lost when filled. Reapply bold
manually via `updateTextStyle` if that emphasis matters for a given lesson.

## 8. DiscussionExample
**Role:** open discussion question plus a worked "Ex." example with a pink-bold
highlighted answer.
**Master objectId:** `p7`
**CHAVES:** `UNIT, LESSON, PART, QUESTION, EX_HL, EX_POST`
**Images:** `IMG_1, IMG_2, IMG_3, IMG_4`
**Note:** the `"Ex. "` label itself is static, not a token.

## 9. MatchingWordBank
**Role:** "Countries"-style matching exercise — title, instruction, and 8 loose
pink-bold word/phrase tags (a word bank) to match against a central image.
**Master objectId:** `p8`
**CHAVES:** `UNIT, LESSON, PART, TITLE, INSTRUCTION, WORD1..WORD8`
**Images:** `IMG_MAP, IMG_2`
**Note:** word order doesn't need to match the numbering in the image.

## 10. ListenCompleteWordBank
**Role:** same shape as MatchingWordBank but framed as a listening-completion
exercise, also with 8 word tags.
**Master objectId:** `p9`
**CHAVES:** `UNIT, LESSON, PART, TITLE, INSTRUCTION, WORD1..WORD8`
**Images:** `IMG_1, IMG_2, IMG_3, IMG_4`

## 11. PersonalizeExample
**Role:** "make it true for you" personalization prompt with a fully-bold (no pink)
worked example sentence naming a person, city, and country.
**Master objectId:** `g3f1c87e0de9_0_75`
**CHAVES:** `UNIT, LESSON, PART, TITLE, INSTRUCTION, EX_PRE, EX_NAME, EX_MID, EX_CITY, EX_MID2, EX_COUNTRY`
**Images:** `IMG_1, IMG_2, IMG_3`

## 12. FluencyIntro
**Role:** section-divider slide opening the fluency/speaking practice block of the
lesson, two portrait photos.
**Master objectId:** `g3f1c87e0de9_0_129`
**CHAVES:** `UNIT, LESSON, PART, TITLE, INSTRUCTION`
**Images:** `IMG_ICON, IMG_PERSON1, IMG_PERSON2`

## 13. ConversationPractice
**Role:** dialogue-completion practice with two pink-tinted round-rect instructional
callouts.
**Master objectId:** `p12`
**CHAVES:** `INSTRUCTION, CALLOUT1, CALLOUT2`
**Images:** `IMG_ICON, IMG_PERSON1, IMG_PERSON2`
**Note:** no breadcrumb or footer on this template — it's blank, inherited from the
layout. Don't add one.

## 14. StepsFluency
**Role:** numbered 1-2-3 fluency instructions, each step with a pink-bold highlighted
keyword.
**Master objectId:** `p13`
**CHAVES:** `UNIT, LESSON, PART, TITLE, FOOTER_INSTRUCTION, STEP1_PRE, STEP1_HL, STEP2_HL, STEP3_PRE, STEP3_HL1, STEP3_MID, STEP3_HL2`
**Images:** `IMG_1`
**Note:** step 1 and step 2 share the exact same lead-in phrase (`STEP1_PRE`, e.g.
`"Ask their "`) — there is no separate `STEP2_PRE`. Step 2 only has its own `STEP2_HL`.

## 15. LessonRecap
**Role:** blue closing "Lesson Complete!" slide — vocabulary/grammar recap across 4
labeled columns.
**Master objectId:** `p14`
**CHAVES:** `UNIT, LESSON, PART, TITLE, COL1_HEADER, COL1_I1..COL1_I3, COL2_HEADER, COL2_I1..COL2_I3, COL3_HEADER, COL3_I1..COL3_I8, COL4_HEADER, COL4_I1..COL4_I3`
**Images:** `IMG_HERO`
**Note:** column item counts (3/3/8/3) match the current master exactly. If a lesson
has more or fewer recap items than a column has slots, add/remove shapes in the
duplicated slide rather than cramming multiple items into one token — confirmed by a
blind QA run that this gets skipped under time pressure if left as general advice, so
here's the concrete recipe: to add a slot, `duplicateObject` an existing `COLn_Ix`
text shape in the *target* (not the master) slide, then `updatePageElementTransform`
it to `translateY` = the previous item's `translateY` + the fixed row spacing (read
two consecutive existing items' `translateY` via `get_page` to get that delta for
this specific column — it differs slightly between columns), then fill it with
`replaceAllText` like any other token. To remove a slot, `deleteObject` it — don't
leave it with an empty string, the shape's background/spacing still renders. Do not
compress multiple recap items into one line ("Hi / Hello") as a workaround — it reads
as an editorial choice a teacher didn't make, not a template limitation.

## 16. StatementQuestionCompare
**Role:** side-by-side comparison of a statement and its matching yes/no question —
left box (light blue-grey background) shows the statement, right box (light pink
background) shows the question.
**Master objectId:** `g3f2039f718c_2_0`
**CHAVES:** `UNIT, LESSON, PART, TITLE, STATEMENT_HL, STATEMENT_POST, QUESTION_HL, QUESTION_POST`
**Images:** *(none)*
**Note:** color here contrasts the two sides, not "answer vs. not" — `STATEMENT_HL` is
blue bold (matches the left box's blue accent bar), `QUESTION_HL` is pink bold (matches
the right box's pink accent bar). Both `_HL` tokens are the verb/contraction at the
start of their sentence (`"He's"` / `"Is"` in the master); both `_POST` tokens are the
rest of the sentence in plain body text.

## 17. GrammarByPerson
**Role:** grammar reference grouped by grammatical person rather than by
affirmative/negative — two labeled groups (e.g. "I / We" and "You"), each with two
example sentences with a blank and a pink-bold `(= answer)` hint, plus a column of 3
numbered image placeholders on the right.
**Master objectId:** `g3f2039f718c_4_0`
**CHAVES:** `UNIT, LESSON, PART, TITLE, GROUP1_HEADER, GROUP2_HEADER,` and for each row
`n` in 1–4: `ROWn_SENTENCE, ROWn_MID`
**Images:** `IMG_1, IMG_2, IMG_3` (visible placeholder boxes — see the general Images
rule above, not invisible alt-text)
**Note:** `GROUP1_HEADER` groups `ROW1` + `ROW2`, `GROUP2_HEADER` groups `ROW3` +
`ROW4`. Each row's rendered text is `"{{ROWn_SENTENCE}} (= {{ROWn_MID}})"` — the
`" (= "` and closing `")"` are static punctuation baked into the same shape, not
separate tokens, so don't include them in either value.

## 18. SectionTransition
**Role:** generic title/transition slide for content that isn't a teaching exercise —
welcome, ice-breaker intro, course/book orientation, celebration, wrap-up. Added after
testing the skill on a real lesson and finding no template covered these (roughly half
of a typical lesson's slides are this kind of connective tissue, not drills).
**Master objectId:** `SLIDES_API1514261605_0`
**CHAVES:** `UNIT, LESSON, PART, TAG, TITLE, INSTRUCTION`
**Images:** *(none)*
**Note:** unlike every other template, `TAG` (the breadcrumb's suffix after PART) is a
real token here, not static text — set it to whatever names the slide's role
(`"WELCOME"`, `"ICE BREAKER"`, `"CELEBRATION"`, `"WRAP-UP"`...). `INSTRUCTION` is
optional — leave it blank for a pure title card.

## 19. MultiQAPractice
**Role:** 4-row question/model-answer drill for freer speaking practice — each row is
one question with a highlighted model answer, e.g. `"What's your name? {{ANSWER}}"`.
Fills the gap between `StepsFluency` (3 steps, one highlighted word each, not a full
Q+A pair) and `GrammarByPerson` (4 rows, but framed as grammar reference not
conversation practice).
**Master objectId:** `SLIDES_API1514261605_12`
**CHAVES:** `UNIT, LESSON, PART, TITLE, INSTRUCTION,` and for each row `n` in 1–4:
`ROWn_QUESTION, ROWn_ANSWER`
**Images:** `IMG_1` (optional)
**Note:** each row's rendered text is `"{{ROWn_QUESTION}} {{ROWn_ANSWER}}"` in a
single shape — `QUESTION` plain, `ANSWER` pink bold, one space between them baked
into the template (don't add another in either value). If a lesson has more than 4
Q+A pairs, split across two `MultiQAPractice` slides rather than cramming a 5th row
into one token.

## 20. MediaActivity
**Role:** an activity built around an embedded video or GIF (e.g. a timed group
activity, an assign-homework slide with a reaction GIF) — content none of the other 19
templates can hold, since they only ever place static images.
**Master objectId:** `SLIDES_API583423190_0`
**CHAVES:** `UNIT, LESSON, PART, TAG, TITLE, INSTRUCTION, MEDIA_1`
**Images:** *(none — `MEDIA_1` is video/GIF, not a static image, see below)*
**Note:** `MEDIA_1` is a *visible* grey placeholder box (like `GrammarByPerson`'s
`IMG_n` boxes), not invisible alt-text — it literally reads `"▶ {{MEDIA_1}}"` on the
canvas. There's no single mechanical fill step for it because video and GIF need
different API calls:
- **YouTube video:** delete the placeholder box and issue a `createVideo` request
  (`source: "YOUTUBE"`, the video's ID or URL) at the same `transform`/`size` the box
  occupied.
- **Animated GIF:** delete the placeholder box and insert a real image element whose
  `contentUrl` is a `.gif` — Google Slides plays GIF animation during Present mode,
  so this doesn't need any special video handling, just a normal image insert.
Whichever path you take, grab the box's `transform`/`size` *before* deleting it so the
replacement lands in the same spot.
