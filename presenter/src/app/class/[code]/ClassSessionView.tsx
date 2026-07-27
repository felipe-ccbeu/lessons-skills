'use client';

import { useClassSession } from '@/lib/useClassSession';
import { VoteForm } from '@/app/poll/[code]/VoteForm';
import { StudentGate } from './StudentGate';
import { StudentBar } from './StudentBar';
import {
  SectionTransitionSimplified,
  Exercise1Simplified,
  PhotoCaptionSimplified,
  PptxImageSimplified,
  CustomHtmlSimplified,
  GrammarBoxLookSimplified,
  MultipleChoiceSimplified,
  PracticeQaBadgesSimplified,
  PhotoExerciseWhoIsThisSimplified,
  GuessFourImagesSimplified,
} from './SimplifiedSlide';
import {
  SectionTransitionData,
  Exercise1Data,
  PhotoCaptionData,
  PptxImageData,
  PollData,
  CustomHtmlData,
  GrammarBoxLookData,
  MultipleChoiceData,
  PracticeQaBadgesData,
  PhotoExerciseWhoIsThisData,
  GuessFourImagesData,
} from '@/lib/types';

type Props = { code: string; initialIndex: number; totalSlides: number };

export function ClassSessionView({ code, initialIndex, totalSlides }: Props) {
  return (
    <StudentGate code={code}>
      {({ name, onEditName }) => (
        <>
          <StudentBar name={name} onEditName={onEditName} />
          <ClassSlideView code={code} initialIndex={initialIndex} totalSlides={totalSlides} />
        </>
      )}
    </StudentGate>
  );
}

// The actual slide-follow view, rendered only once the student has a name.
function ClassSlideView({ code, initialIndex, totalSlides }: Props) {
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
      {renderSimplified(state.template, state.data, state.revealed)}
      <p style={progressStyle}>
        {slideIndex + 1} / {total}
      </p>
    </>
  );
}

// Maps a slide template to its phone-friendly render. `revealed` mirrors the
// teacher's overlay: views that carry an answer hide it until the teacher
// reveals (see AnswerText in SimplifiedSlide). Any template without a
// dedicated simplified view falls through to a generic card (title/heading if
// present) so a slide never renders blank on the student's phone — the symptom
// that used to make whole slides "disappear" from the class-session view.
function renderSimplified(template: string, data: unknown, revealed: boolean) {
  switch (template) {
    case 'sectionTransition':
      return <SectionTransitionSimplified data={data as SectionTransitionData} />;
    case 'exercise1':
      return <Exercise1Simplified data={data as Exercise1Data} revealed={revealed} />;
    case 'photoCaption':
      return <PhotoCaptionSimplified data={data as PhotoCaptionData} revealed={revealed} />;
    case 'pptxImage':
      return <PptxImageSimplified data={data as PptxImageData} />;
    case 'customHtml':
      return <CustomHtmlSimplified data={data as CustomHtmlData} />;
    case 'grammarBoxLook':
      return <GrammarBoxLookSimplified data={data as GrammarBoxLookData} revealed={revealed} />;
    case 'multipleChoice':
      return <MultipleChoiceSimplified data={data as MultipleChoiceData} />;
    case 'practiceQaBadges':
      return <PracticeQaBadgesSimplified data={data as PracticeQaBadgesData} />;
    case 'photoExerciseWhoIsThis':
      return <PhotoExerciseWhoIsThisSimplified data={data as PhotoExerciseWhoIsThisData} revealed={revealed} />;
    case 'guessFourImages':
      return <GuessFourImagesSimplified data={data as GuessFourImagesData} revealed={revealed} />;
    default:
      return <GenericSlideFallback data={data} />;
  }
}

// Last-resort view for a template that has no simplified render yet: surface
// whatever title-like text the slide has so the phone shows *something*
// anchored to the current slide instead of an empty screen.
function GenericSlideFallback({ data }: { data: unknown }) {
  const d = (data ?? {}) as Record<string, unknown>;
  const heading =
    (typeof d.title === 'string' && d.title) ||
    (typeof d.topicName === 'string' && d.topicName) ||
    (typeof d.question === 'string' && d.question) ||
    '';
  const instruction = typeof d.instruction === 'string' ? d.instruction : '';
  return (
    <main style={fallbackStyle}>
      {heading ? (
        <h1 style={{ fontSize: 20, color: '#1c2027', margin: 0 }}>{heading}</h1>
      ) : (
        <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>Acompanhe pelo telão.</p>
      )}
      {instruction && <p style={{ fontSize: 15, color: '#6b7280', marginTop: 10 }}>{instruction}</p>}
    </main>
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

const fallbackStyle = {
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
