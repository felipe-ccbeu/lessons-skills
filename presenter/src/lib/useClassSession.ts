'use client';

import { useLiveResource } from '@/lib/useLiveResource';
import { ClassSessionState } from '@/lib/classSessionEvents';

export function useClassSession(code: string): ClassSessionState | null {
  return useLiveResource<ClassSessionState | null>(
    `/api/class/${code}/stream`,
    `/api/class/${code}/state`,
    null
  );
}
