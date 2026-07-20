import { NextResponse } from 'next/server';
import { computeClassSessionState } from '@/lib/classSessions';

type RouteParams = { params: Promise<{ code: string }> };

// Plain request/response fallback for environments where SSE doesn't survive
// the network path (see the poll tallies route for the same rationale).
export async function GET(_req: Request, { params }: RouteParams) {
  const { code } = await params;
  const state = await computeClassSessionState(code);
  if (!state) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(state);
}
