'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useClassSession } from '@/lib/useClassSession';
import { getSlideAnimation } from '@/lib/slideAnimations';
import { TEMPLATE_META } from '@/lib/slideMeta';
import { SlideTemplate } from '@/lib/types';
import { VoteForm } from '@/app/poll/[code]/VoteForm';
import { MultipleChoiceVoteForm } from './MultipleChoiceVoteForm';
import { PracticeQaBadgesVoteForm, QaRow } from './PracticeQaBadgesVoteForm';
import { MatchVocabImageVoteForm } from './MatchVocabImageVoteForm';
import { MatchingWithChartVoteForm } from './MatchingWithChartVoteForm';
import { StudentGate } from './StudentGate';
import { StudentBar } from './StudentBar';
import {
  SectionTransitionSimplified,
  Exercise1Simplified,
  PhotoCaptionSimplified,
  PptxImageSimplified,
  CustomHtmlSimplified,
  GrammarBoxLookSimplified,
  PhotoExerciseWhoIsThisSimplified,
  GuessFourImagesSimplified,
  ObjectivesSimplified,
  GettingStartedSimplified,
  ComparativeSimplified,
  CoverImageSimplified,
  ChangePlacesSimplified,
  CompleteTheChartSimplified,
  Fluency1Simplified,
  Fluency2Simplified,
  Fluency3Simplified,
  WarmupOralTransformSimplified,
  ListenAndRepeatSimplified,
  PhotoGridBlankSimplified,
  GrammarBox2YesNoSimplified,
  ModelExampleListSimplified,
  LessonCompleteSimplified,
  MatchingWithChartSimplified,
  MatchLettersSimplified,
  BlankSimplified,
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
  ObjectivesData,
  GettingStartedData,
  ComparativeData,
  CoverImageData,
  ChangePlacesData,
  CompleteTheChartData,
  Fluency1Data,
  Fluency2Data,
  Fluency3Data,
  WarmupOralTransformData,
  ListenAndRepeatData,
  PhotoGridBlankData,
  GrammarBox2YesNoData,
  MatchVocabImageData,
  ModelExampleListData,
  LessonCompleteData,
  MatchingWithChartData,
  MatchLettersData,
  BlankData,
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

  // Direction mirrors the teacher's own next/prev navigation on the projected
  // slide (see PresentationOverlay.tsx), but the phone has no explicit
  // "advance"/"back" event — only the new slideIndex — so it's inferred by
  // comparing against the previous render's index. Storing that previous
  // index in state (updated inline during render, React's documented
  // pattern for this) rather than a ref: ref mutation during render is
  // disallowed by the React Compiler / eslint-plugin-react-hooks.
  const [prevIndex, setPrevIndex] = useState(slideIndex);
  const direction: 1 | -1 = slideIndex >= prevIndex ? 1 : -1;
  if (slideIndex !== prevIndex) setPrevIndex(slideIndex);

  if (slideIndex < 0 || !state) {
    return (
      <main style={waitingStyle}>
        <p style={{ fontSize: 18, color: 'var(--ink-muted)' }}>Aguardando o professor começar a apresentação…</p>
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
        <h1 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 24 }}>{pollData.question}</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-muted)' }}>Aguardando o professor iniciar a votação…</p>
      </main>
    );
  }

  if (state.template === 'multipleChoice') {
    const mcData = state.data as MultipleChoiceData;
    if (state.poll?.pollOpen) {
      // `state.poll.options` are this round's own PollOption ids (server-side,
      // distinct from the slide's own option ids) but in the same order as
      // `mcData.options` — so the correct answer's position in the slide's
      // list is also its position in the live round.
      const correctSlideIndex = mcData.options.findIndex((o) => o.id === mcData.correctOptionId);
      const correctIndex = correctSlideIndex === -1 ? undefined : correctSlideIndex;
      return (
        <MultipleChoiceVoteForm
          code={state.poll.pollCode}
          question={state.poll.question}
          options={state.poll.options}
          correctIndex={correctIndex}
        />
      );
    }
    return (
      <main style={waitingStyle}>
        <h1 style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 24 }}>{mcData.question}</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-muted)' }}>Aguardando o professor abrir a pergunta…</p>
      </main>
    );
  }

  if (state.template === 'practiceQaBadges') {
    const qaData = state.data as PracticeQaBadgesData;
    const qaPolls = state.qaPolls ?? {};
    const rows: QaRow[] = qaData.rows.map((row, i) => {
      const roundPoll = qaPolls[i];
      // `roundPoll.options` are this round's own PollOption ids (server-side,
      // distinct from the slide's own ids) but created in [yes, no] order —
      // see startQaVoting in PresentationOverlay.tsx — so position tells them
      // apart rather than matching by label/id.
      const poll = roundPoll?.pollOpen
        ? { pollCode: roundPoll.pollCode, yesOptionId: roundPoll.options[0]?.id ?? '', noOptionId: roundPoll.options[1]?.id ?? '' }
        : undefined;
      return { question: row.question, yesLabel: row.yes, noLabel: row.no, poll };
    });
    return <PracticeQaBadgesVoteForm rows={rows} />;
  }

  if (state.template === 'matchVocabImage') {
    const mviData = state.data as MatchVocabImageData;
    return <MatchVocabImageVoteForm code={code} data={mviData} />;
  }

  if (state.template === 'matchingWithChart') {
    const mwcData = state.data as MatchingWithChartData;
    return <MatchingWithChartVoteForm code={code} data={mwcData} />;
  }

  const { variants, transition } = getSlideAnimation(state.animation);
  const templateLabel = TEMPLATE_META[state.template as SlideTemplate]?.label;
  const progress = total > 0 ? (slideIndex + 1) / total : 0;

  return (
    <main style={sessionStyle}>
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={state.slideId}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          style={{ flex: 1 }}
        >
          <div style={crumbStyle}>
            <span style={crumbDotStyle} />
            {templateLabel ?? 'Slide'}
          </div>
          <div style={cardStyle}>{renderSimplified(state.template, state.data, state.revealed)}</div>
        </motion.div>
      </AnimatePresence>
      <div style={progressWrapStyle}>
        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p style={progressTextStyle}>
          {slideIndex + 1} / {total}
        </p>
      </div>
    </main>
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
    case 'photoExerciseWhoIsThis':
      return <PhotoExerciseWhoIsThisSimplified data={data as PhotoExerciseWhoIsThisData} revealed={revealed} />;
    case 'guessFourImages':
      return <GuessFourImagesSimplified data={data as GuessFourImagesData} revealed={revealed} />;
    case 'objectives':
      return <ObjectivesSimplified data={data as ObjectivesData} />;
    case 'gettingStarted':
      return <GettingStartedSimplified data={data as GettingStartedData} />;
    case 'comparative':
      return <ComparativeSimplified data={data as ComparativeData} />;
    case 'coverImage':
      return <CoverImageSimplified data={data as CoverImageData} />;
    case 'changePlaces':
      return <ChangePlacesSimplified data={data as ChangePlacesData} revealed={revealed} />;
    case 'completeTheChart':
      return <CompleteTheChartSimplified data={data as CompleteTheChartData} revealed={revealed} />;
    case 'fluency1':
      return <Fluency1Simplified data={data as Fluency1Data} />;
    case 'fluency2':
      return <Fluency2Simplified data={data as Fluency2Data} />;
    case 'fluency3':
      return <Fluency3Simplified data={data as Fluency3Data} />;
    case 'warmupOralTransform':
      return <WarmupOralTransformSimplified data={data as WarmupOralTransformData} revealed={revealed} />;
    case 'listenAndRepeat':
      return <ListenAndRepeatSimplified data={data as ListenAndRepeatData} />;
    case 'photoGridBlank':
      return <PhotoGridBlankSimplified data={data as PhotoGridBlankData} revealed={revealed} />;
    case 'grammarBox2YesNo':
      return <GrammarBox2YesNoSimplified data={data as GrammarBox2YesNoData} />;
    case 'modelExampleList':
      return <ModelExampleListSimplified data={data as ModelExampleListData} />;
    case 'lessonComplete':
      return <LessonCompleteSimplified data={data as LessonCompleteData} />;
    case 'matchingWithChart':
      return <MatchingWithChartSimplified data={data as MatchingWithChartData} revealed={revealed} />;
    case 'matchLetters':
      return <MatchLettersSimplified data={data as MatchLettersData} revealed={revealed} />;
    case 'blank':
      return <BlankSimplified data={data as BlankData} />;
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
    <div style={fallbackStyle}>
      {heading ? (
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 700, color: 'var(--ccbeu-blue)', margin: 0 }}>{heading}</h1>
      ) : (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-muted)', margin: 0 }}>Acompanhe pelo telão.</p>
      )}
      {instruction && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-muted)', marginTop: 10 }}>{instruction}</p>
      )}
    </div>
  );
}

const waitingStyle = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-body)',
  padding: 24,
  textAlign: 'center' as const,
};

// Sits inside the same card as every other simplified view (see cardStyle
// below) — no minHeight/centering of its own, that would only apply to this
// one template's card instead of the screen.
const fallbackStyle = {
  padding: '20px 18px 22px',
  textAlign: 'center' as const,
};

// Phone shell: tinted background (var(--app-bg), same token the desktop
// editor chrome uses) so the white card reads as a raised surface, exactly
// like a slide sitting on the projector's dark stage.
const sessionStyle = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column' as const,
  background: 'var(--app-bg)',
  padding: '16px 14px 20px',
};

const crumbStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-title)',
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  color: 'var(--ccbeu-blue)',
  margin: '2px 0 10px',
};

const crumbDotStyle = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: 'var(--ccbeu-pink)',
  flex: '0 0 auto',
};

const cardStyle = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid var(--chrome-border)',
  boxShadow: '0 8px 24px -16px rgba(4, 72, 223, 0.18)',
};

const progressWrapStyle = {
  padding: '16px 4px 0',
};

const progressTrackStyle = {
  height: 4,
  borderRadius: 999,
  background: 'var(--chrome-border)',
  overflow: 'hidden' as const,
};

const progressFillStyle = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, var(--ccbeu-blue), var(--ccbeu-pink))',
  transition: 'width 0.25s ease',
};

const progressTextStyle = {
  textAlign: 'center' as const,
  fontSize: 11,
  color: 'var(--ink-footer)',
  fontFamily: 'var(--font-body)',
  margin: '6px 0 0',
};
