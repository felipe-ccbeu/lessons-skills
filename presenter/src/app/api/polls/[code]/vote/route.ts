import { NextRequest, NextResponse } from 'next/server';
import { castVote, getTallies, getPollSessionByCode } from '@/lib/polls';
import { emitPollUpdate } from '@/lib/pollEvents';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ code: string }> };

// Generous per-IP cap: a whole classroom shares one public IP, so this must fit
// a full room voting at once — it only exists to cut scripted floods. Votes are
// also deduped by voterKey downstream, so this is a coarse safety net.
const VOTE_LIMIT_PER_MIN = 120;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const rl = rateLimit(`vote:${getClientIp(req)}`, VOTE_LIMIT_PER_MIN, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  const { code } = await params;
  const body = await req.json();
  const { optionId, voterKey } = body as { optionId: string; voterKey: string };

  if (!optionId || !voterKey) {
    return NextResponse.json({ error: 'optionId and voterKey are required' }, { status: 400 });
  }

  const result = await castVote(code, optionId, voterKey);
  if (!result.ok) {
    const status = result.reason === 'not_found' ? 404 : result.reason === 'already_voted' ? 409 : 410;
    return NextResponse.json({ error: result.reason }, { status });
  }

  const session = await getPollSessionByCode(code);
  if (session) {
    const tallies = await getTallies(session.id);
    emitPollUpdate(code, tallies);
  }

  return NextResponse.json({ ok: true });
}
