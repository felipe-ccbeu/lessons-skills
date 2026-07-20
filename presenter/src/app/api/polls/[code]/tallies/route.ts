import { NextResponse } from 'next/server';
import { getPollSessionByCode, getTallies } from '@/lib/polls';

type RouteParams = { params: Promise<{ code: string }> };

// Plain request/response fallback for environments where SSE doesn't survive
// the network path (e.g. Cloudflare Quick Tunnel buffers streaming bodies
// indefinitely — confirmed via testing, not a bug in our stream route).
export async function GET(_req: Request, { params }: RouteParams) {
  const { code } = await params;
  const session = await getPollSessionByCode(code);
  if (!session) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const tallies = await getTallies(session.id);
  return NextResponse.json(tallies);
}
