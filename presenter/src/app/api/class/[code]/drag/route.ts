import { NextRequest, NextResponse } from 'next/server';
import { getClassSessionByCode, broadcastClassSessionState } from '@/lib/classSessions';
import { setDragPosition } from '@/lib/dragEvents';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ code: string }> };

// Higher than the vote-route cap: a drag gesture can fire several position
// updates per second (per student) as it moves, not one tap per question.
const DRAG_LIMIT_PER_MIN = 600;

// Student's phone reports "I placed keyword N at (x, y)" — fire-and-forget,
// same as a poll vote, but keyed by voterKey instead of optionId since there's
// no fixed set of answers to choose from (see dragEvents.ts). No auth check:
// students aren't logged in, same as /api/polls/[code]/vote.
export async function POST(req: NextRequest, { params }: RouteParams) {
  const rl = rateLimit(`drag:${getClientIp(req)}`, DRAG_LIMIT_PER_MIN, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } });
  }

  const { code } = await params;
  const body = await req.json();
  const { voterKey, keywordIndex, x, y } = body as { voterKey: string; keywordIndex: number; x: number; y: number };

  if (!voterKey || typeof keywordIndex !== 'number' || typeof x !== 'number' || typeof y !== 'number') {
    return NextResponse.json({ error: 'voterKey, keywordIndex, x and y are required' }, { status: 400 });
  }

  const session = await getClassSessionByCode(code);
  if (!session || !session.currentSlideId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  setDragPosition(session.partId, session.currentSlideId, voterKey, keywordIndex, {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  });
  await broadcastClassSessionState(code);

  return NextResponse.json({ ok: true });
}
