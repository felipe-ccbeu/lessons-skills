import { notFound } from 'next/navigation';
import { getPollSessionByCode } from '@/lib/polls';
import { VoteForm } from './VoteForm';

type Props = { params: Promise<{ code: string }> };

export default async function PollPage({ params }: Props) {
  const { code } = await params;
  const session = await getPollSessionByCode(code);
  if (!session || session.status !== 'open') notFound();

  return (
    <VoteForm
      code={code}
      question={session.question}
      options={session.options.map((o) => ({ id: o.id, label: o.label }))}
    />
  );
}
