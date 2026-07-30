'use client';

import { useLiveResource } from '@/lib/useLiveResource';
import { ClassSessionState } from '@/lib/classSessionEvents';

export function useClassSession(code: string | null): ClassSessionState | null {
  return useLiveResource<ClassSessionState | null>(
    code ? `/api/class/${code}/stream` : null,
    code ? `/api/class/${code}/state` : null,
    null
  );
}
