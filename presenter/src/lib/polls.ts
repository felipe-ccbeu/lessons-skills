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
  optionLabels: string[]
) {
  let code = randomCode();
  // Extremely unlikely to collide at this scale, but cheap to guard against.
  while (await prisma.pollSession.findUnique({ where: { code } })) code = randomCode();

  return prisma.pollSession.create({
    data: {
      code,
      partId,
      slideId,
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
  return prisma.pollSession.findFirst({
    where: { partId, slideId, status: 'open' },
    orderBy: { createdAt: 'desc' },
    include: { options: { orderBy: { order: 'asc' } } },
  });
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
