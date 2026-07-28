import { NextRequest, NextResponse } from 'next/server';
import { getClassSessionByCode, setCurrentSlide, setRevealed, broadcastClassSessionState } from '@/lib/classSessions';
import { requireRoleApi } from '@/lib/dal';

type RouteParams = { params: Promise<{ code: string }> };

// Fire-and-forget from the teacher's PresentationOverlay — the teacher's
// browser is the only writer, students are read-only subscribers via the
// stream/state routes below. Two kinds of write share this route:
//   • `slideId`  — the teacher moved to a new slide (also re-hides answers).
//   • `revealed` — the teacher revealed/hid the *current* slide's answers.
// A slide change and a reveal are separate gestures, so they arrive as
// separate requests; each broadcasts the fresh state to joined phones.
export async function POST(req: NextRequest, { params }: RouteParams) {
  const guard = await requireRoleApi(['ADMIN', 'COORDINATOR', 'TEACHER']);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { code } = await params;
  const body = await req.json();
  const { slideId, revealed } = body as { slideId?: string; revealed?: boolean };

  if (!slideId && typeof revealed !== 'boolean') {
    return NextResponse.json({ error: 'slideId or revealed is required' }, { status: 400 });
  }

  const session = await getClassSessionByCode(code);
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (slideId) {
    await setCurrentSlide(session.partId, slideId);
  } else if (typeof revealed === 'boolean') {
    await setRevealed(session.partId, revealed);
  }
  await broadcastClassSessionState(code);

  return NextResponse.json({ ok: true });
}
