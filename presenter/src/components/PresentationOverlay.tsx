'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AnimatePresence, motion } from 'motion/react';
import { Slide } from '@/lib/types';
import { getSlideAnimation } from '@/lib/slideAnimations';
import { RENDERERS } from '@/components/slides';
import { PastedBlocksLayer } from '@/components/ui/PastedBlocksLayer';
import { LobbyBubbles } from '@/components/LobbyBubbles';
import { Icon } from '@/components/ui/Icon';
import { usePollTallies } from '@/lib/usePollTallies';
import { useClassSession } from '@/lib/useClassSession';
import { PollLiveResults } from '@/components/slides/PollSlide';
import { QaLiveResults } from '@/components/slides/PracticeQaBadgesSlide';

type Props = {
  slides: Slide[];
  startIndex: number;
  onExit: () => void;
  /** Required to start a live poll session or a class-follow session — omit if this deck isn't persisted (e.g. in-memory sample deck). */
  partId?: string;
};

function slideHasAnswer(slide: Slide): boolean {
  // Poll slides always have something to reveal (the live results), even
  // though they carry no `answerFields` — advancing on a poll first reveals
  // the tallies, exactly like revealing an exercise's answers.
  if (slide.template === 'poll') return true;
  return (slide.answerFields?.length ?? 0) > 0;
}

// Slide templates that run a live vote round the whole time they're on
// screen: `poll` (single question, teacher-defined options) and
// `multipleChoice` (each option is a possible answer, one of them marked
// correct in the editor). Both open one PollSession per slide-entry, keyed by
// `rowIndex: null` — see `startVoting`. A type guard (rather than a plain
// Set.has check) so callers get `slide.data` narrowed to the two variants
// that actually have `.question`/`.options`.
type VotableSlide = Extract<Slide, { template: 'poll' | 'multipleChoice' }>;
function isVotableSlide(slide: Slide): slide is VotableSlide {
  return slide.template === 'poll' || slide.template === 'multipleChoice';
}

// Pulls "the label for option i" out of a votable slide's data regardless of
// which of the two shapes it is (`PollOptionDraft.label` vs
// `MultipleChoiceOptionDraft.text`).
function votableOptionLabels(slide: VotableSlide): string[] {
  if (slide.template === 'poll') return slide.data.options.map((o) => o.label);
  return slide.data.options.map((o) => o.text);
}

type PollSessionState = {
  code: string;
  // Options as created in the DB for THIS round, in slide order. Their ids
  // differ from the slide's own option ids, and tallies come keyed by these —
  // the slide matches them back to its options positionally (see PollSlide).
  options: { id: string; label: string }[];
};
type ClassSessionInfo = { code: string; joinUrl: string; qrDataUrl: string | null };

export function PresentationOverlay({ slides, startIndex, onExit, partId }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [pollSession, setPollSession] = useState<PollSessionState | null>(null);
  const [classSession, setClassSession] = useState<ClassSessionInfo | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Guards the poll auto-start against firing twice for the same slide entry —
  // React StrictMode (dev) double-invokes effects, which otherwise creates two
  // rounds a second apart: the second, empty round replaces the first and the
  // just-shown results blink out. Holds the index whose round is already
  // (being) created; reset when leaving that slide.
  const startedPollForIndex = useRef<number | null>(null);
  // Same guard for the practiceQaBadges multi-round open — holds the index
  // whose per-row rounds are already (being) created, so StrictMode's
  // double-effect doesn't open two sets of rounds.
  const startedQaForIndex = useRef<number | null>(null);

  const goNext = () => {
    if (slideHasAnswer(slides[index]) && !revealed) {
      setRevealed(true);
      return;
    }
    if (index >= slides.length - 1) return;
    setDirection(1);
    setIndex(index + 1);
  };
  const goPrev = () => {
    if (index <= 0) return;
    setDirection(-1);
    setIndex(index - 1);
  };

  // Every time the slide changes, start with its answers hidden again —
  // regardless of which action (goNext/goPrev/thumbnail jump) caused the change.
  useEffect(() => {
    setRevealed(false);
  }, [index]);

  // Voting is always live while a poll or multiple-choice slide is on screen:
  // entering one opens a fresh round automatically (no "Iniciar votação"
  // click), and leaving it clears the round. Revisiting always starts a
  // brand-new round rather than resuming an old one, so each visit's tallies
  // stand alone. The `startedPollForIndex` guard makes this fire exactly once
  // per entry even under StrictMode's double-effect — two rounds would
  // otherwise be created.
  useEffect(() => {
    if (!isVotableSlide(slides[index]) || !partId) {
      setPollSession(null);
      startedPollForIndex.current = null;
      return;
    }
    if (startedPollForIndex.current === index) return;
    startedPollForIndex.current = index;
    setPollSession(null);
    startVoting();
    // startVoting is stable enough for this purpose; re-running only on slide
    // change is exactly the intent (one fresh round per poll-slide entry).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, partId]);

  const startVoting = async () => {
    const currentSlide = slides[index];
    if (!partId || !isVotableSlide(currentSlide)) return;
    const res = await fetch('/api/polls/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partId,
        slideId: currentSlide.id,
        question: currentSlide.data.question,
        options: votableOptionLabels(currentSlide),
      }),
    });
    if (!res.ok) return;
    const session = await res.json();
    // No standalone /poll QR any more: students vote through the class-follow
    // link they already joined with (/class/[code]); the poll round just
    // becomes the current-slide state they're already subscribed to.
    setPollSession({ code: session.code, options: session.options });

    // Re-push the current slide to the class-session channel so anyone
    // already on /class/[code] picks up the newly-opened poll round
    // automatically (computeClassSessionState re-queries for an open poll).
    if (classSession) {
      fetch(`/api/class/${classSession.code}/slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId: currentSlide.id }),
      }).catch(() => {});
    }
  };

  // Multi-question live voting: entering a `practiceQaBadges` slide opens one
  // Yes/No round per question row (the two options being the row's own "yes"
  // and "no" answer texts), mirroring the single-round poll auto-start above.
  // Leaving the slide clears them; revisiting opens a brand-new set.
  useEffect(() => {
    if (slides[index].template !== 'practiceQaBadges' || !partId) {
      startedQaForIndex.current = null;
      return;
    }
    if (startedQaForIndex.current === index) return;
    startedQaForIndex.current = index;
    startQaVoting();
    // startQaVoting is stable enough here; re-running only on slide change is
    // exactly the intent (one fresh set of rounds per slide entry).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, partId]);

  const startQaVoting = async () => {
    const currentSlide = slides[index];
    if (!partId || currentSlide.template !== 'practiceQaBadges') return;
    const rows = currentSlide.data.rows;

    // Open all rounds in parallel and wait for the full set before re-pushing
    // the slide below — their tallies are read back via qaPolls on our own
    // class-session subscription (see classSessionState above), not tracked
    // in local state here.
    await Promise.all(
      rows.map((row, rowIndex) =>
        fetch('/api/polls/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partId,
            slideId: currentSlide.id,
            rowIndex,
            question: row.question,
            options: [row.yes, row.no],
          }),
        })
      )
    );

    // Re-push the current slide so already-joined phones pick up the freshly
    // opened rounds (computeClassSessionState re-queries for open rounds).
    if (classSession) {
      fetch(`/api/class/${classSession.code}/slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId: currentSlide.id }),
      }).catch(() => {});
    }
  };

  const { tallies, total } = usePollTallies(pollSession?.code ?? null);
  // practiceQaBadges' per-row rounds already carry their own tallies inside
  // computeClassSessionState's `qaPolls` — cheaper to read them back off our
  // own class-session stream than to open a second live-tallies subscription
  // per row.
  const classSessionState = useClassSession(classSession?.code ?? null);

  // Get-or-create the persistent class-session code once per mount — NOT
  // re-run on slide change, unlike `startVoting` which intentionally
  // recreates a fresh poll round on every click. Same code every time this
  // Part is presented, today or next semester.
  useEffect(() => {
    if (!partId) return;
    let cancelled = false;
    fetch('/api/class/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partId }),
    })
      .then((res) => res.json())
      .then(async (session) => {
        if (cancelled) return;
        const joinUrl = `${window.location.origin}/class/${session.code}`;
        const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 260, margin: 1 }).catch(() => null);
        if (!cancelled) setClassSession({ code: session.code, joinUrl, qrDataUrl });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [partId]);

  // Push "current slide changed" to joined students every time it changes.
  // The server resets `revealed` to false on this write, matching the local
  // reset in the `[index]` effect above — a new slide starts un-revealed on
  // every phone, same as the projected view.
  useEffect(() => {
    if (!classSession) return;
    fetch(`/api/class/${classSession.code}/slide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideId: slides[index].id }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSession, index]);

  // Mirror the teacher's answer-reveal to joined phones. Only pushes when
  // `revealed` is true: it flips false→true within a slide (the reveal
  // gesture), and the false case is already handled by the slide-change write
  // above — pushing false here too would race that write for the same effect.
  useEffect(() => {
    if (!classSession || !revealed) return;
    fetch(`/api/class/${classSession.code}/slide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revealed: true }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSession, revealed]);

  // Discreet bottom overlays (slide counter + join button): fade in on mouse
  // activity, fade out after 2s of idle — same pattern as video-player
  // controls. Stays visible while the join modal is open.
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    function onActivity() {
      setControlsVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setControlsVisible((v) => (showJoinModal ? v : false));
      }, 2000);
    }
    onActivity();
    window.addEventListener('mousemove', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      clearTimeout(hideTimer);
    };
  }, [showJoinModal]);

  // Enter fullscreen on mount, exit fullscreen (if still active) on unmount.
  useEffect(() => {
    const el = containerRef.current;
    el?.requestFullscreen?.().catch(() => {
      // Fullscreen can be denied (e.g. no user gesture, unsupported) — the
      // overlay still works windowed, just not edge-to-edge.
    });
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // If the user exits fullscreen via Esc/browser UI, close the overlay too
  // so we don't get stuck in a windowed presentation with no visible way out.
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) onExit();
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [onExit]);

  useEffect(() => {
    function computeScale() {
      const availW = window.innerWidth;
      const availH = window.innerHeight;
      setScale(Math.min(availW / 1280, availH / 720));
    }
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onExit();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, revealed, slides.length, onExit]);

  const slide = slides[index];
  const Renderer = RENDERERS[slide.template];
  const { variants, transition } = getSlideAnimation(slide.animation);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          position: 'relative',
          width: 1280,
          height: 720,
          background: '#fff',
          perspective: 1600,
        }}
      >
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={slide.id}
            className="stage"
            style={{ boxShadow: 'none', position: 'absolute', inset: 0, background: '#fff' }}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <Renderer
              data={slide.data}
              editMode={false}
              onEdit={() => {}}
              answerFields={slide.answerFields ?? []}
              layoutOverrides={slide.layoutOverrides ?? {}}
              blockAnimations={slide.blockAnimations ?? {}}
              revealAnswers={revealed}
              onReveal={slide.template === 'poll' && !revealed ? () => setRevealed(true) : undefined}
              liveResults={
                slide.template === 'poll' && pollSession
                  ? ({ ...pollSession, tallies, total } satisfies PollLiveResults)
                  : undefined
              }
              qaResults={
                slide.template === 'practiceQaBadges'
                  ? (classSessionState?.qaPolls as QaLiveResults | undefined)
                  : undefined
              }
            />
            <PastedBlocksLayer blocks={slide.pastedBlocks ?? []} editMode={false} stageScale={1} />
          </motion.div>
        </AnimatePresence>

        {/* Lobby roster: only on the first slide, once a class code exists.
            Lives inside the 1280×720 stage so the bubbles scale with the
            slide and sit floating down its right edge. */}
        {index === 0 && classSession && <LobbyBubbles code={classSession.code} />}
      </div>

      {/* Click zones: left third = previous, right two-thirds = next.
          zIndex below the slide content (1000) so interactive elements
          rendered by the slide (e.g. the poll's "Iniciar votação" button)
          stay clickable instead of being intercepted by these zones. */}
      <button
        aria-label="Slide anterior"
        onClick={goPrev}
        disabled={index === 0}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '33%',
          zIndex: -1,
          background: 'transparent',
          border: 'none',
          cursor: index === 0 ? 'default' : 'w-resize',
        }}
      />
      <button
        aria-label="Próximo slide"
        onClick={goNext}
        disabled={index === slides.length - 1}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '67%',
          zIndex: -1,
          background: 'transparent',
          border: 'none',
          cursor: index === slides.length - 1 ? 'default' : 'e-resize',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          // Dark translucent pill so the counter stays legible whether it
          // sits over the black backdrop or over a full-bleed white slide
          // (at 16:9 the scaled slide covers the backdrop exactly here).
          background: 'rgba(0,0,0,0.45)',
          padding: '3px 11px',
          borderRadius: 999,
          color: 'rgba(255,255,255,0.85)',
          fontSize: 12.5,
          fontFamily: 'var(--font-body)',
          zIndex: 1001,
          pointerEvents: 'none',
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 300ms',
        }}
      >
        {index + 1} / {slides.length}
      </div>

      {classSession && (
        <button
          type="button"
          onClick={() => setShowJoinModal(true)}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1002,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 999,
            // Dark translucent backing (not the light glassy fill) so the
            // white label + icon read over a full-bleed white slide, not just
            // over the black backdrop.
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 12.5,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            opacity: controlsVisible ? 1 : 0,
            pointerEvents: controlsVisible ? 'auto' : 'none',
            transition: 'opacity 300ms',
          }}
        >
          <Icon name="smartphone" size={15} /> Entrar na aula
        </button>
      )}

      {showJoinModal && classSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              fontFamily: 'var(--font-body)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18, color: '#1c2027' }}>Escaneie para acompanhar a aula</h2>
            {classSession.qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={classSession.qrDataUrl} alt="QR code da aula" width={260} height={260} />
            )}
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{classSession.joinUrl}</p>
            <button
              type="button"
              className="btn primary"
              onClick={() => setShowJoinModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
