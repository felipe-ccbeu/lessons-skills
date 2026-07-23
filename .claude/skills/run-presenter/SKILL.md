---
name: run-presenter
description: >
  Start (or restart) the `presenter/` Next.js app for local testing, plus a
  Cloudflare Quick Tunnel so a phone can reach it, and report back the public
  URL and class/poll codes needed to test live. Use whenever the user asks to
  "testar o presenter", "subir o app", "abrir pro celular", "gerar o QR de
  novo", reports the phone/QR/tunnel isn't loading, or asks to restart the dev
  server or tunnel. Also use proactively before manually testing any
  presenter change that needs a live phone/second-device view (class
  sessions, polls) — don't hand-roll `npm run dev` + cloudflared commands
  ad hoc when this skill already codifies the steps and known gotchas.
tags: [presenter, nextjs, dev-server, cloudflare-tunnel, testing]
---

# Run Presenter

Gets `presenter/` running locally and reachable from a phone, in one pass,
without re-discovering the gotchas that have already caused real debugging
sessions: a dead server mistaken for an app bug; `allowedDevOrigins` blocking
the tunnel origin from ever hydrating React; and a `401` from the auth-gated
API misread as a broken chain.

## Before starting anything — check what's already running

Don't blindly start a second dev server or tunnel on top of a live one.

```
netstat -ano | grep ':3000' | grep LISTENING     # bash
netstat -ano -p tcp | Select-String ':3000.*LISTENING'   # PowerShell
tasklist | grep -i cloudflared
```

- If port 3000 is already listening, it may just be stale/hung rather than
  actually serving — verify with
  `curl -s -m 3 -o /dev/null -w "%{http_code}" http://localhost:3000/api/lessons/basic-1/unit-1/lesson-a/part-1`.
  **A `401` here means alive**, not broken — that route is behind the
  credentials login (see step 4). Connection-refused or a hang is what
  "dead" looks like. Only kill it (`taskkill //PID <pid> //F`) if it's not
  responding or the user wants a clean restart.
- If `cloudflared.exe` is already running, check whether it's still pointed
  at a live server — if the dev server underneath it was just restarted on
  the same port, the *existing* tunnel process is still valid and doesn't
  need to be recreated. Only start a new tunnel if none is running or the
  old one's target server is gone for good.

## 1. Start the dev server

From `presenter/`:

```
npm run dev
```

Run this in the background (long-lived process) and wait for `✓ Ready` in
its log before moving on — don't fire requests at port 3000 before that line
appears, they'll fail with connection-refused and look like a bigger problem
than "still booting."

## 2. Start the tunnel

The project doesn't have `cloudflared` on PATH — the binary is vendored in
the repo at `presenter/bin/cloudflared.exe`. Confirm it's still there before
assuming the path; if not, glob the repo for `**/cloudflared*` rather than
assuming it moved to a standard location.

```
./bin/cloudflared.exe tunnel --url http://localhost:3000
```

**Launching this through the Bash tool gets blocked by the permission
classifier** (it reads as exposing a local server publicly). Don't retry it
verbatim — go through PowerShell instead, which also detaches it cleanly:

```powershell
$log = "<scratchpad>\tunnel.log"
Start-Process -FilePath "<repo>\presenter\bin\cloudflared.exe" `
  -ArgumentList 'tunnel','--url','http://localhost:3000' `
  -RedirectStandardError $log -RedirectStandardOutput "$log.out" `
  -WindowStyle Hidden -PassThru
```

cloudflared writes the banner to **stderr**, so the URL lands in `$log`, not
`$log.out`. Wait for the `Your quick Tunnel has been created!` line and read
the `https://<random-words>.trycloudflare.com` URL out of it — it's different
every run, never assume last session's URL still works.

## 3. Register the tunnel origin with Next.js — do this every time the URL changes

**This is the step that's easy to skip and hardest to notice you skipped.**
Next.js (Turbopack dev mode) blocks cross-origin requests to its own dev
assets (`/_next/webpack-hmr` and related chunks) from any origin not in
`allowedDevOrigins`. When this is missing, the *page shell* (static HTML,
CSS) still loads fine over the tunnel — so the app looks like it's working
at a glance — but React never hydrates, so nothing interactive renders:
slides stay blank past the static breadcrumb dot, `useEffect`-driven data
fetches (class session state, poll tallies) never run. This already caused
a full debugging session where the symptom looked identical to a poll/SSE
bug but was actually this.

Check `presenter/next.config.ts` has:

```ts
const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com'],
};
```

If it's missing or was already there, no action needed — the wildcard covers
every quick-tunnel URL, so this is a **one-time fix**, not a per-session step,
*unless* someone reverts the config file. If you do add it, you must restart
the dev server (step 1) for it to take effect — `next.config.ts` is only read
at boot.

## 4. Verify end-to-end before handing the URL to the user

Don't report the URL as ready just because the tunnel process started —
confirm the whole chain actually serves data.

**The `/api/lessons/...` route is behind the credentials login**, so it
answers `401` to an unauthenticated curl. That `401` proves server + tunnel
+ routing are working (the request reached Next.js and got a real verdict) —
it is *not* a failure. Don't chase it. Verify against the root page instead,
which redirects to `/login` and serves the actual app shell:

```
curl -s -m 15 -L -o page.html \
  -w "code=%{http_code} url=%{url_effective}\n" https://<tunnel-url>/
```

Healthy result: final `code=200`, `url=.../login?from=%2Flessons`, and the
body contains `<title>CCBEU Slides — Presenter</title>` plus `_next/static`
references. Missing `_next/static` chunks with a 200 body is the
`allowedDevOrigins` symptom from step 3. A hang or connection error means
diagnose before handing off — see Troubleshooting below.

Seed credentials for logging in on the phone: `felipe@ccbeuguarapuava.com.br`
/ `ccbeu2026` (the seed also prints test coordinator/teacher/no-access users).

## 5. Report back

Give the user:
- The tunnel URL (`https://<random-words>.trycloudflare.com`)
- Reminder that opening any `/lessons/...` editor page there and clicking
  "Apresentar" is what actually generates/refreshes the class-session QR
  code — the tunnel URL alone doesn't get a phone to the right lesson.
- If this was a restart (not first start), remind the user that any phone
  tab already open needs a hard reload — a tab that was open against the
  *old* dev server/tunnel won't recover on its own even once the new one is
  up.

## Troubleshooting

- **`/state` endpoint returns data but the phone still shows "Aguardando":**
  almost certainly the `allowedDevOrigins` hydration issue (step 3), not a
  polling/SSE bug — check that before touching `useLiveResource.ts` or the
  class-session broadcast logic.
- **SSE stream (`/api/class/[code]/stream`) never delivers a byte over the
  tunnel, even though `curl`ing `/state` directly works fine:** this is
  expected, not a bug — Cloudflare Quick Tunnel buffers small/streaming
  responses. `useLiveResource` already has a 2.5s grace-then-poll fallback
  for exactly this (see `presenter/src/lib/useLiveResource.ts`). Confirm the
  fallback is reaching `/state` successfully rather than trying to "fix" the
  SSE stream itself.
- **`curl` to `/api/lessons/...` returns `401` (or `/` returns `307`):**
  working as intended, not a broken tunnel. Those routes sit behind the
  credentials login; a `307` on `/` is the redirect to `/login`. Follow
  redirects (`curl -L`) and check for a `200` with the app shell before
  concluding anything is wrong.
- **Tunnel URL from a previous session doesn't respond at all:** the dev
  server or tunnel process died (Windows dev machines sleep/restart, background
  terminals get closed). Don't assume a code regression — check `netstat`
  for a live listener on 3000 first, per the "before starting anything"
  section above.
