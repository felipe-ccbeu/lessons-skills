import { NextResponse } from 'next/server';
import { listClassStudents } from '@/lib/students';

type RouteParams = { params: Promise<{ code: string }> };

// The current roster for a class, polled by the teacher's lobby overlay to
// render one name bubble per joined student. Plain request/response (not SSE):
// the overlay runs on the teacher's machine and just polls this every couple
// of seconds, which is enough for a "who's in the room" board.
export async function GET(_req: Request, { params }: RouteParams) {
  const { code } = await params;
  const students = await listClassStudents(code);
  return NextResponse.json({ students });
}
