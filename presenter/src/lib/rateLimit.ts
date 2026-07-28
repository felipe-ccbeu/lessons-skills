import 'server-only';
import type { NextRequest } from 'next/server';

// In-memory fixed-window rate limiter. This app runs as a single long-lived
// Node process (`next start`, one SQLite file, the global Prisma singleton in
// lib/prisma.ts), so a plain in-process Map is a correct store — every request
// hits the same counters. If this ever moves to a multi-instance / serverless
// deploy, each instance would keep its own Map and the limit would leak; swap
// this store for a shared one (Redis/Upstash) then, without touching callers.

type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  rateLimitBuckets?: Map<string, Bucket>;
};

// Reuse the map across dev hot-reloads so counters aren't wiped on every edit.
const buckets = globalForRateLimit.rateLimitBuckets ?? new Map<string, Bucket>();
if (process.env.NODE_ENV !== 'production') globalForRateLimit.rateLimitBuckets = buckets;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Fixed-window counter. Allows `limit` requests per `windowMs` for a given
 * `key`; the (limit+1)-th within the same window is rejected. When blocked,
 * `retryAfterSec` says how long until the window resets.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    maybeSweep(now);
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterSec: 0 };
}

// Opportunistic cleanup so buckets for clients that never return don't pile up
// forever. Runs at most once a minute, piggy-backing on a request that opens a
// new window, and drops every already-expired entry.
let lastSweep = 0;
function maybeSweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Best-effort client IP for keying anonymous rate limits. The app is reached
 * through a Cloudflare tunnel, which sets `cf-connecting-ip` to the real
 * visitor; `x-forwarded-for` is the standard-proxy fallback. When neither is
 * present (e.g. hit directly over localhost) everyone shares one bucket, which
 * is acceptable for that path.
 *
 * NOTE: a whole classroom on the same school Wi-Fi shares one public IP, so
 * per-IP limits keyed on this must be generous enough to fit a full room —
 * they exist to stop scripted floods, not to cap normal use.
 */
export function getClientIp(req: NextRequest): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
