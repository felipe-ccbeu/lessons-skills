import { NextRequest } from 'next/server';
import { getPollSessionByCode, getTallies } from '@/lib/polls';
import { subscribeToPoll, PollTallies } from '@/lib/pollEvents';

type RouteParams = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const session = await getPollSessionByCode(code);
  if (!session) return new Response('not found', { status: 404 });

  const encoder = new TextEncoder();
  let unsubscribe: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: PollTallies) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Padding comment (SSE ignores lines starting with ':') to push the
      // first chunk past ~2KB — some proxies/tunnels (seen with Cloudflare
      // Quick Tunnel) buffer small initial chunks and never flush them.
      controller.enqueue(encoder.encode(`:${' '.repeat(2048)}\n\n`));

      // Send current state immediately so a late-joining screen doesn't wait
      // for the next vote to render anything.
      send(await getTallies(session.id));

      unsubscribe = subscribeToPoll(code, send);

      // Keep intermediary proxies/tunnels from closing an idle connection.
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
