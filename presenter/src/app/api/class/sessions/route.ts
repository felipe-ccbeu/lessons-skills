import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateClassSession } from '@/lib/classSessions';
import { requireRoleApi } from '@/lib/dal';

export async function POST(req: NextRequest) {
  const guard = await requireRoleApi(['ADMIN', 'COORDINATOR', 'TEACHER']);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json();
  const { partId } = body as { partId: string };

  if (!partId) {
    return NextResponse.json({ error: 'partId is required' }, { status: 400 });
  }

  const session = await getOrCreateClassSession(partId);
  return NextResponse.json({ code: session.code });
}
