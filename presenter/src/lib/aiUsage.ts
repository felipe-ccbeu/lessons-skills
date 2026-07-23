import { prisma } from '@/lib/prisma';

export type AiUsageByUser = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  spendUsd: number;
  textCalls: number;
  imageCalls: number;
  capUsd: number | null;
  blocked: boolean;
  resetAt: Date;
};

/** Sum of estimatedCostUsd for a user's AiUsageLog rows created at/after their aiSpendResetAt. */
export async function getUserAiSpend(userId: string, resetAt: Date): Promise<number> {
  const result = await prisma.aiUsageLog.aggregate({
    where: { userId, createdAt: { gte: resetAt } },
    _sum: { estimatedCostUsd: true },
  });
  return result._sum.estimatedCostUsd ?? 0;
}

/** True when the user has a cap set and their current spend has reached or passed it. */
export async function isUserOverAiSpendCap(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { aiSpendCapUsd: true, aiSpendResetAt: true } });
  if (!user || user.aiSpendCapUsd == null) return false;
  const spend = await getUserAiSpend(userId, user.aiSpendResetAt);
  return spend >= user.aiSpendCapUsd;
}

/** Per-user spend summary for the admin AI usage panel — every user, with their current spend since last reset. */
export async function getAiUsageByUser(): Promise<AiUsageByUser[]> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, aiSpendCapUsd: true, aiSpendResetAt: true },
    orderBy: { email: 'asc' },
  });

  const rows = await Promise.all(
    users.map(async (u) => {
      const [spendResult, textCount, imageCount] = await Promise.all([
        prisma.aiUsageLog.aggregate({
          where: { userId: u.id, createdAt: { gte: u.aiSpendResetAt } },
          _sum: { estimatedCostUsd: true },
        }),
        prisma.aiUsageLog.count({ where: { userId: u.id, kind: 'text', createdAt: { gte: u.aiSpendResetAt } } }),
        prisma.aiUsageLog.count({ where: { userId: u.id, kind: 'image', createdAt: { gte: u.aiSpendResetAt } } }),
      ]);
      const spendUsd = spendResult._sum.estimatedCostUsd ?? 0;
      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        spendUsd,
        textCalls: textCount,
        imageCalls: imageCount,
        capUsd: u.aiSpendCapUsd,
        blocked: u.aiSpendCapUsd != null && spendUsd >= u.aiSpendCapUsd,
        resetAt: u.aiSpendResetAt,
      };
    })
  );

  return rows.sort((a, b) => b.spendUsd - a.spendUsd);
}

export async function setUserAiSpendCap(userId: string, capUsd: number | null) {
  await prisma.user.update({ where: { id: userId }, data: { aiSpendCapUsd: capUsd } });
}

/** "Releases" a blocked user by moving the counting window forward to now — past usage stays in AiUsageLog for audit, but stops counting toward the cap. */
export async function resetUserAiSpend(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { aiSpendResetAt: new Date() } });
}
