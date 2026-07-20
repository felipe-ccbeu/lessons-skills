'use client';

import { useEffect, useState } from 'react';

const SSE_GRACE_MS = 2500;
const POLL_INTERVAL_MS = 1500;

/**
 * Subscribes to a live-updating resource, preferring SSE but falling back to
 * plain polling if no SSE event arrives within a grace window. Some network
 * paths (confirmed: Cloudflare Quick Tunnel) buffer streaming responses
 * indefinitely and never deliver a byte, so a working stream can't be
 * assumed just because the connection opened without an error.
 *
 * Generalized from the poll-tallies-specific hook — same pattern, any JSON
 * payload shape, parameterized by URL rather than a poll `code`.
 */
export function useLiveResource<T>(streamUrl: string | null, pollUrl: string | null, initial: T): T {
  const [data, setData] = useState<T>(initial);

  useEffect(() => {
    if (!streamUrl || !pollUrl) {
      setData(initial);
      return;
    }
    let cancelled = false;
    let usingPolling = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const es = new EventSource(streamUrl);

    const graceTimer = setTimeout(() => {
      if (cancelled || usingPolling) return;
      usingPolling = true;
      es.close();
      startPolling();
    }, SSE_GRACE_MS);

    es.onmessage = (e) => {
      if (cancelled) return;
      clearTimeout(graceTimer);
      setData(JSON.parse(e.data));
    };

    function startPolling() {
      const tick = async () => {
        try {
          const res = await fetch(pollUrl!);
          if (res.ok && !cancelled) setData(await res.json());
        } catch {
          // network hiccup — next tick will retry
        }
      };
      tick();
      pollTimer = setInterval(tick, POLL_INTERVAL_MS);
    }

    return () => {
      cancelled = true;
      clearTimeout(graceTimer);
      es.close();
      if (pollTimer) clearInterval(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, pollUrl]);

  return data;
}
