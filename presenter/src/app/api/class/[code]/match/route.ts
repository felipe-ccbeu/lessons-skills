import { NextRequest, NextResponse } from 'next/server';
import { getClassSessionByCode, broadcastClassSessionState } from '@/lib/classSessions';
import { setMatchChoice } from '@/lib/matchEvents';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ code: string }> };

// One POST per drop (not per pointermove, unlike /drag), so a much lower cap
// than DRAG_LIMIT_PER_MIN comfortably covers even a student changing their
// mind repeatedly.
const MATCH_LIMIT_PER_MIN = 120;

// Student's phone reports "I dropped option N onto prompt M" — fire-and-forget,
// same as a poll vote, but keyed by voterKey instead of optionId since each
// student can hold their own set of choices. No auth check: students aren't
// logged in, same as /api/polls/[code]/vote and /api/class/[code]/drag.
export async function POST(req: NextRequest, { params }: RouteParams) {
  const rl = rateLimit(`match:${getClientIp(req)}`, MATCH_LIMIT_PER_MIN, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } });
  }

  const { code } = await params;
  const body = await req.json();
  const { voterKey, promptIndex, optionIndex } = body as { voterKey: string; promptIndex: number; optionIndex: number };

  if (!voterKey || typeof promptIndex !== 'number' || typeof optionIndex !== 'number') {
    return NextResponse.json({ error: 'voterKey, promptIndex and optionIndex are required' }, { status: 400 });
  }

  const session = await getClassSessionByCode(code);
  if (!session || !session.currentSlideId) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  setMatchChoice(session.partId, session.currentSlideId, voterKey, promptIndex, optionIndex);
  await broadcastClassSessionState(code);

  return NextResponse.json({ ok: true });
}
