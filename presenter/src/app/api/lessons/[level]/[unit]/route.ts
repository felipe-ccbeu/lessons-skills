import { NextRequest, NextResponse } from 'next/server';
import { getLessons } from '@/lib/lessons';
import { requireRoleApi } from '@/lib/dal';

type RouteParams = { params: Promise<{ level: string; unit: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const guard = await requireRoleApi(['ADMIN', 'COORDINATOR', 'TEACHER']);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { level, unit } = await params;
  const found = await getLessons(level, unit);
  if (!found) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });

  return NextResponse.json({
    lessons: found.lessons.map((l) => ({ slug: l.slug, title: l.title })),
  });
}
