'use client';

import { useClassSession } from '@/lib/useClassSession';
import { VoteForm } from '@/app/poll/[code]/VoteForm';
import {
  SectionTransitionSimplified,
  Exercise1Simplified,
  PhotoCaptionSimplified,
  PptxImageSimplified,
} from './SimplifiedSlide';
import {
  SectionTransitionData,
  Exercise1Data,
  PhotoCaptionData,
  PptxImageData,
  PollData,
} from '@/lib/types';

type Props = { code: string; initialIndex: number; totalSlides: number };

export function ClassSessionView({ code, initialIndex, totalSlides }: Props) {
  const state = useClassSession(code);

  const slideIndex = state?.slideIndex ?? initialIndex;
  const total = state?.totalSlides ?? totalSlides;

  if (slideIndex < 0 || !state) {
    return (
      <main style={waitingStyle}>
        <p style={{ fontSize: 18, color: '#6b7280' }}>Aguardando o professor começar a apresentação…</p>
      </main>
    );
  }

  if (state.template === 'poll') {
    const pollData = state.data as PollData;
    if (state.poll?.pollOpen) {
      return <VoteForm code={state.poll.pollCode} question={state.poll.question} options={state.poll.options} />;
    }
    return (
      <main style={waitingStyle}>
        <h1 style={{ fontSize: 20, color: '#1c2027', marginBottom: 24 }}>{pollData.question}</h1>
        <p style={{ fontSize: 15, color: '#6b7280' }}>Aguardando o professor iniciar a votação…</p>
      </main>
    );
  }

  return (
    <>
      {state.template === 'sectionTransition' && (
        <SectionTransitionSimplified data={state.data as SectionTransitionData} />
      )}
      {state.template === 'exercise1' && <Exercise1Simplified data={state.data as Exercise1Data} />}
      {state.template === 'photoCaption' && <PhotoCaptionSimplified data={state.data as PhotoCaptionData} />}
      {state.template === 'pptxImage' && <PptxImageSimplified data={state.data as PptxImageData} />}
      <p style={progressStyle}>
        {slideIndex + 1} / {total}
      </p>
    </>
  );
}

const waitingStyle = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif',
  padding: 24,
  textAlign: 'center' as const,
};

const progressStyle = {
  textAlign: 'center' as const,
  fontSize: 12,
  color: '#9aa1ac',
  fontFamily: 'system-ui, sans-serif',
  padding: '0 24px 24px',
};
