import { prisma } from '@/lib/prisma';
import { createPollSession } from '@/lib/polls';
import { PollTestClient } from './PollTestClient';

// Forces per-request rendering — otherwise Next prerenders this at build
// time (no cookies()/headers() call to trigger dynamic rendering
// automatically), baking in one fixed PollSession/code/joinUrl for every
// visit instead of a fresh round each time.
export const dynamic = 'force-dynamic';

// Throwaway end-to-end test harness for the live-polling mechanism (see
// PLANO_ENQUETES_AO_VIVO.md, phases 0-2). Not part of the real product UI —
// creates a fresh poll round against the first real Part in the DB every
// time this page loads, so refreshing gives you a brand new code/QR.
export default async function PollTestPage() {
  const part = await prisma.part.findFirst();
  if (!part) {
    return <p style={{ padding: 24, fontFamily: 'system-ui' }}>Nenhum Part encontrado no banco — rode o seed primeiro.</p>;
  }

  const session = await createPollSession(part.id, 'test-slide', 'Qual a forma correta?', [
    "She don't like coffee",
    "She doesn't like coffee",
    'She not like coffee',
  ]);

  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const joinUrl = `${baseUrl}/poll/${session.code}`;

  return (
    <PollTestClient
      code={session.code}
      joinUrl={joinUrl}
      options={session.options.map((o) => ({ id: o.id, label: o.label }))}
    />
  );
}
