'use client';

import { useLiveResource } from '@/lib/useLiveResource';

type Tallies = { tallies: Record<string, number>; total: number };

const EMPTY: Tallies = { tallies: {}, total: 0 };

export function usePollTallies(code: string | null): Tallies {
  return useLiveResource<Tallies>(
    code ? `/api/polls/${code}/stream` : null,
    code ? `/api/polls/${code}/tallies` : null,
    EMPTY
  );
}
