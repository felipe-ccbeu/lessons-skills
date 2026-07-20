import { NextRequest } from 'next/server';
import { getClassSessionByCode, computeClassSessionState } from '@/lib/classSessions';
import { subscribeToClassSession, ClassSessionState } from '@/lib/classSessionEvents';

type RouteParams = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const session = await getClassSessionByCode(code);
  if (!session) return new Response('not found', { status: 404 });

  const encoder = new TextEncoder();
  let unsubscribe: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: ClassSessionState) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Padding comment to push the first chunk past ~2KB — see the poll
      // stream route for why (some proxies buffer small initial chunks).
      controller.enqueue(encoder.encode(`:${' '.repeat(2048)}\n\n`));

      const initial = await computeClassSessionState(code);
      if (initial) send(initial);

      unsubscribe = subscribeToClassSession(code, send);

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);
    },
    cancel() {
      unsubscribe();
      clearInterval(heartbeat);
    },
  });

  req.signal.addEventListener('abort', () => {
    unsubscribe();
    clearInterval(heartbeat);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
