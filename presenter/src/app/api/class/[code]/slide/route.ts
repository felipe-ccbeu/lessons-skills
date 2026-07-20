import { NextRequest, NextResponse } from 'next/server';
import { getClassSessionByCode, setCurrentSlide, broadcastClassSessionState } from '@/lib/classSessions';
import { requireRoleApi } from '@/lib/dal';

type RouteParams = { params: Promise<{ code: string }> };

// Fire-and-forget from the teacher's PresentationOverlay on every slide
// change — the teacher's browser is the only writer, students are read-only
// subscribers via the stream/state routes below.
export async function POST(req: NextRequest, { params }: RouteParams) {
  const guard = await requireRoleApi(['ADMIN', 'COORDINATOR', 'TEACHER']);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { code } = await params;
  const body = await req.json();
  const { slideId } = body as { slideId: string };

  if (!slideId) {
    return NextResponse.json({ error: 'slideId is required' }, { status: 400 });
  }

  const session = await getClassSessionByCode(code);
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await setCurrentSlide(session.partId, slideId);
  await broadcastClassSessionState(code);

  return NextResponse.json({ ok: true });
}
