import { NextRequest, NextResponse } from 'next/server';
import { createPollSession } from '@/lib/polls';
import { requireRoleApi } from '@/lib/dal';

export async function POST(req: NextRequest) {
  const guard = await requireRoleApi(['ADMIN', 'COORDINATOR', 'TEACHER']);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json();
  const { partId, slideId, question, options, rowIndex } = body as {
    partId: string;
    slideId: string;
    question: string;
    options: string[];
    // Optional: present when opening a per-question round on a multi-question
    // slide (practiceQaBadges). Omitted/undefined for a standalone poll slide.
    rowIndex?: number;
  };

  if (!partId || !slideId || !question || !Array.isArray(options) || options.length < 2 || options.length > 4) {
    return NextResponse.json(
      { error: 'partId, slideId, question and 2-4 options are required' },
      { status: 400 }
    );
  }

  const session = await createPollSession(
    partId,
    slideId,
    question,
    options,
    typeof rowIndex === 'number' ? rowIndex : null
  );
  return NextResponse.json({
    code: session.code,
    options: session.options.map((o) => ({ id: o.id, label: o.label })),
  });
}
