import { NextRequest, NextResponse } from 'next/server';
import { castVote, getTallies, getPollSessionByCode } from '@/lib/polls';
import { emitPollUpdate } from '@/lib/pollEvents';

type RouteParams = { params: Promise<{ code: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
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
