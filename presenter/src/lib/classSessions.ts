import { prisma } from '@/lib/prisma';
import { Slide } from '@/lib/types';
import { emitClassSessionUpdate, ClassSessionState } from '@/lib/classSessionEvents';
import { getOpenPollSessionForSlide, getTallies } from '@/lib/polls';

function randomCode(): string {
  // Short, human-typeable, avoids visually ambiguous chars (0/O, 1/I/l).
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}

/**
 * Get-or-create the one persistent ClassSession for a Part. Safe under
 * concurrent calls (two tabs, StrictMode double-invoke): whichever `create`
 * wins, the loser catches the unique-constraint conflict on `partId` and
 * just re-reads the winner's row, so callers always get the same code.
 */
export async function getOrCreateClassSession(partId: string) {
  const existing = await prisma.classSession.findUnique({ where: { partId } });
  if (existing) return existing;

  let code = randomCode();
  while (await prisma.classSession.findUnique({ where: { code } })) code = randomCode();

  try {
    return await prisma.classSession.create({ data: { partId, code } });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return prisma.classSession.findUniqueOrThrow({ where: { partId } });
    }
    throw err;
  }
}

export async function getClassSessionByCode(code: string) {
  return prisma.classSession.findUnique({ where: { code } });
}

export async function getClassSessionWithPart(code: string) {
  return prisma.classSession.findUnique({ where: { code }, include: { part: true } });
}

export async function setCurrentSlide(partId: string, slideId: string) {
  return prisma.classSession.update({ where: { partId }, data: { currentSlideId: slideId } });
}

/**
 * Computes the class-session payload for whatever slide is currently shown,
 * without emitting it — used both for the SSE snapshot a late-joining screen
 * needs immediately and for the plain-polling fallback route.
 */
export async function computeClassSessionState(code: string): Promise<ClassSessionState | null> {
  const session = await prisma.classSession.findUnique({ where: { code }, include: { part: true } });
  if (!session || !session.currentSlideId) return null;

  const slides = session.part.slides as Slide[];
  const slideIndex = slides.findIndex((s) => s.id === session.currentSlideId);
  if (slideIndex === -1) return null;
  const slide = slides[slideIndex];

  const state: ClassSessionState = {
    slideIndex,
    totalSlides: slides.length,
    slideId: slide.id,
    template: slide.template,
    data: slide.data,
  };

  if (slide.template === 'poll') {
    const openPoll = await getOpenPollSessionForSlide(session.partId, slide.id);
    if (openPoll) {
      const { tallies, total } = await getTallies(openPoll.id);
      state.poll = {
        pollCode: openPoll.code,
        pollOpen: true,
        question: openPoll.question,
        options: openPoll.options.map((o) => ({ id: o.id, label: o.label })),
        tallies,
        total,
      };
    } else {
      state.poll = {
        pollCode: '',
        pollOpen: false,
        question: slide.data.question,
        options: slide.data.options.map((o) => ({ id: o.id, label: o.label })),
        tallies: {},
        total: 0,
      };
    }
  }

  return state;
}

/**
 * Recomputes the full class-session broadcast payload and pushes it to
 * subscribers. Called both when the teacher navigates slides and (Phase E)
 * right after a PollSession is opened for the current slide — re-querying
 * "is there an open poll for this slide?" here means the poll code
 * propagates automatically with no separate wiring.
 */
export async function broadcastClassSessionState(code: string) {
  const state = await computeClassSessionState(code);
  if (state) emitClassSessionUpdate(code, state);
}
