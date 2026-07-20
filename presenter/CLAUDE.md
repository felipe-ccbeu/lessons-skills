@AGENTS.md

# presenter/ — architecture notes

Next.js app (App Router, Turbopack) that's both the lesson-deck editor and
the live-presentation tool: a teacher edits/presents slides here, and
students follow along or vote from their phones through the same app.

See `docs/PLANO_ENQUETES_AO_VIVO.md` for the original design rationale behind
the live-polling feature (why Cloudflare Quick Tunnel over local-network IP,
the SSE-buffering discovery, the fallback design) — the sections below
summarize the parts that matter for day-to-day work on this code.

## Data model (`prisma/schema.prisma`)

`Level → Unit → Lesson → Part`, where **Part is the actual slide deck**
(`Part.slides` is a JSON array matching `src/lib/types.ts`'s `Slide[]`).
Editor routes are `/lessons/[level]/[unit]/[lesson]/[part]`.

Two live-session models hang off `Part`, and they're easy to conflate but
serve different lifecycles:

- **`ClassSession`** — one per `Part`, **get-or-create, never recreated**.
  Same join code today, tomorrow, next semester for that deck. Tracks
  `currentSlideId` (whatever the teacher is presently showing). This is what
  a student's phone actually subscribes to at `/class/[code]`.
- **`PollSession`** — a **fresh row every time** the teacher (re-)opens
  voting on a poll slide. Old rounds stay around as history; re-visiting a
  poll slide always starts a new round rather than resuming the last one
  (see the `useEffect` resetting `pollSession` on slide-index change in
  `PresentationOverlay.tsx`).

`computeClassSessionState` (`src/lib/classSessions.ts`) is the single place
that stitches these together: given a `ClassSession.code`, it looks up the
current slide and, if that slide is a poll, re-queries for an open
`PollSession` on that exact `(partId, slideId)` pair. This re-query is what
makes a newly-opened poll round show up on already-connected phones without
any separate "poll opened" event type — it's just a slide-state recompute
that happens to also check "is there an open poll right now."

## Live delivery: SSE with a polling fallback, not SSE alone

Every live view (`/class/[code]`, poll tallies) is fed by
`src/lib/useLiveResource.ts` — a from-scratch hook, not `swr`/`react-query`.
It opens an `EventSource` against a `/stream` route, but starts a **2.5s
grace timer**; if no `onmessage` fires by then, it closes the SSE connection
and switches to plain polling (`setInterval` hitting a `/state` or
`/tallies` route) for the rest of that mount.

This exists because **Cloudflare Quick Tunnel silently buffers small/
streaming HTTP responses and never flushes them** — confirmed by direct
testing (a raw `fetch` reader against the tunnel received zero bytes over 8s
on a route that responds instantly over plain `localhost`). The SSE routes
also emit a 2KB padding comment as their first chunk for the same reason (some
proxies buffer small initial chunks specifically). Do not "fix" a stuck
live view by chasing the SSE code path — check whether the polling fallback
is actually being reached first; if `/state`/`/tallies` respond correctly
over curl, the delivery layer is not the bug.

**Every `/stream` route re-broadcasts on writes it's responsible for** —
`/api/class/[code]/slide` (slide navigation) and `/api/polls/sessions`
(poll opened) both call the relevant `broadcast*` function after writing.
If you add a new kind of live-visible state change, it needs the same
explicit broadcast call; there's no automatic "any DB write invalidates
subscribers" mechanism.

## Local dev + phone testing

Use the `run-presenter` skill (`.claude/skills/run-presenter/`) rather than
hand-starting `npm run dev` + a Cloudflare tunnel — it codifies two gotchas
that have already cost real debugging time:

1. The dev server/tunnel can die silently between sessions (Windows sleep,
   closed terminal) and look identical to an app bug from the phone side.
2. `next.config.ts` needs `allowedDevOrigins: ['*.trycloudflare.com']` or
   Turbopack blocks the tunnel origin's HMR/asset requests — the page shell
   still loads (looks fine at a glance) but React never hydrates, so nothing
   interactive works. This is a one-time config fix, already applied.

## Prisma client

Generated to a non-default path: `src/generated/prisma` (not
`node_modules/@prisma/client`), using the better-sqlite3 driver adapter —
see `src/lib/prisma.ts`. Import from `@/generated/prisma/client`, not
`@prisma/client` directly, when writing one-off scripts against this DB.
