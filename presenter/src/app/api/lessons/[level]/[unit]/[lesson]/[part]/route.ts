import { NextRequest, NextResponse } from 'next/server';
import { getPartBySlug, updatePartSlides } from '@/lib/lessons';
import { requireRoleApi } from '@/lib/dal';
import { Slide } from '@/lib/types';

type RouteParams = { params: Promise<{ level: string; unit: string; lesson: string; part: string }> };

const TEACHER_OR_ABOVE = ['ADMIN', 'COORDINATOR', 'TEACHER'] as const;

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const guard = await requireRoleApi([...TEACHER_OR_ABOVE]);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { level, unit, lesson, part } = await params;
  const found = await getPartBySlug(level, unit, lesson, part);
  if (!found) return NextResponse.json({ error: 'Part not found' }, { status: 404 });

  return NextResponse.json({
    id: found.part.id,
    title: found.part.title,
    slides: found.part.slides as Slide[],
  });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const guard = await requireRoleApi([...TEACHER_OR_ABOVE]);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { level, unit, lesson, part } = await params;
  const found = await getPartBySlug(level, unit, lesson, part);
  if (!found) return NextResponse.json({ error: 'Part not found' }, { status: 404 });

  const body = await req.json();
  const slides = body.slides as Slide[];
  if (!Array.isArray(slides)) {
    return NextResponse.json({ error: 'Body must include a "slides" array' }, { status: 400 });
  }

  const updated = await updatePartSlides(found.part.id, slides);
  return NextResponse.json({ id: updated.id, title: updated.title, slides: updated.slides as Slide[] });
}
