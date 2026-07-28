import { prisma } from '@/lib/prisma';
import { PollTallies } from '@/lib/pollEvents';

function randomCode(): string {
  // Short, human-typeable, avoids visually ambiguous chars (0/O, 1/I/l).
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export async function createPollSession(
  partId: string,
  slideId: string,
  question: string,
  optionLabels: string[],
  // null for a standalone `poll` slide (one question); 0,1,2… to tie this
  // round to a specific question row on a multi-question slide like
  // `practiceQaBadges`.
  rowIndex: number | null = null
) {
  let code = randomCode();
  // Extremely unlikely to collide at this scale, but cheap to guard against.
  while (await prisma.pollSession.findUnique({ where: { code } })) code = randomCode();

  return prisma.pollSession.create({
    data: {
      code,
      partId,
      slideId,
      rowIndex,
      question,
      options: { create: optionLabels.map((label, order) => ({ label, order })) },
    },
    include: { options: true },
  });
}

export async function getPollSessionByCode(code: string) {
  return prisma.pollSession.findUnique({
    where: { code },
    include: { options: { orderBy: { order: 'asc' } } },
  });
}

export async function getOpenPollSessionForSlide(partId: string, slideId: string) {
  // A standalone `poll` slide's round always has rowIndex null. Filtering on it
  // keeps a per-row round from a multi-question slide (should they ever share a
  // slideId) from being mistaken for the whole-slide poll.
  return prisma.pollSession.findFirst({
    where: { partId, slideId, rowIndex: null, status: 'open' },
    orderBy: { createdAt: 'desc' },
    include: { options: { orderBy: { order: 'asc' } } },
  });
}

/**
 * All currently-open rounds for a multi-question slide (e.g. practiceQaBadges),
 * one per question row, keyed by rowIndex for the caller. Only rows the teacher
 * actually opened a round for appear here.
 */
export async function getOpenPollSessionsByRow(partId: string, slideId: string) {
  const sessions = await prisma.pollSession.findMany({
    where: { partId, slideId, rowIndex: { not: null }, status: 'open' },
    orderBy: { createdAt: 'desc' },
    include: { options: { orderBy: { order: 'asc' } } },
  });
  // Newest-first ordering means the first session seen for a given rowIndex is
  // the freshest round — keep that one if the same row was somehow opened twice.
  const byRow = new Map<number, (typeof sessions)[number]>();
  for (const s of sessions) {
    if (s.rowIndex != null && !byRow.has(s.rowIndex)) byRow.set(s.rowIndex, s);
  }
  return byRow;
}

export async function getTallies(pollSessionId: string): Promise<PollTallies> {
  const options = await prisma.pollOption.findMany({
    where: { pollSessionId },
    orderBy: { order: 'asc' },
    include: { _count: { select: { votes: true } } },
  });
  const tallies: Record<string, number> = {};
  let total = 0;
  for (const opt of options) {
    tallies[opt.id] = opt._count.votes;
    total += opt._count.votes;
  }
  return { tallies, total };
}

export type VoteResult = { ok: true } | { ok: false; reason: 'already_voted' | 'not_found' | 'closed' };

export async function castVote(code: string, optionId: string, voterKey: string): Promise<VoteResult> {
  const session = await prisma.pollSession.findUnique({ where: { code } });
  if (!session) return { ok: false, reason: 'not_found' };
  if (session.status !== 'open') return { ok: false, reason: 'closed' };

  try {
    await prisma.pollVote.create({
      data: { pollSessionId: session.id, optionId, voterKey },
    });
    return { ok: true };
  } catch (err: unknown) {
    // Unique constraint violation on (pollSessionId, voterKey) — already voted.
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
      return { ok: false, reason: 'already_voted' };
    }
    throw err;
  }
}
