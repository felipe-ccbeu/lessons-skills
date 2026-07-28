import { NextRequest, NextResponse } from 'next/server';
import { joinClass, getStudentByDevice } from '@/lib/students';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

type RouteParams = { params: Promise<{ code: string }> };

// Generous per-IP cap on joins: a whole classroom shares one public IP, so this
// must fit a full room signing in at once — it only exists to cut scripted
// floods that would bloat the students table.
const JOIN_LIMIT_PER_MIN = 60;

// GET ?deviceKey=… — rehydrate the name already registered for this device in
// this class, so a returning phone can skip the login screen.
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const deviceKey = req.nextUrl.searchParams.get('deviceKey');
  if (!deviceKey) return NextResponse.json({ student: null });

  const student = await getStudentByDevice(code, deviceKey);
  return NextResponse.json({ student: student ? { id: student.id, name: student.name } : null });
}

// POST { deviceKey, name } — join the class with a name, or update the name of
// an already-joined device (same call, the upsert handles both).
export async function POST(req: NextRequest, { params }: RouteParams) {
  const rl = rateLimit(`join:${getClientIp(req)}`, JOIN_LIMIT_PER_MIN, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  const { code } = await params;
  const body = await req.json();
  const { deviceKey, name } = body as { deviceKey?: string; name?: string };

  if (!deviceKey || typeof name !== 'string') {
    return NextResponse.json({ error: 'deviceKey and name are required' }, { status: 400 });
  }

  const result = await joinClass(code, deviceKey, name);
  if (!result.ok) {
    const status = result.reason === 'not_found' ? 404 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ student: result.student });
}
