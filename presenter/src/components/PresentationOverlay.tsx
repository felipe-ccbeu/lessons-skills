'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AnimatePresence, motion, Transition, Variants } from 'motion/react';
import { Slide, SlideTemplate } from '@/lib/types';
import { RENDERERS } from '@/components/slides';
import { usePollTallies } from '@/lib/usePollTallies';
import { PollLiveResults } from '@/components/slides/PollSlide';

const slideTransition: Record<SlideTemplate, { variants: Variants; transition: Transition }> = {
  sectionTransition: {
    variants: {
      enter: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? 48 : -48 }),
      center: { opacity: 1, x: 0 },
      exit: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? -48 : 48 }),
    },
    transition: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  },
  exercise1: {
    variants: {
      enter: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? 48 : -48 }),
      center: { opacity: 1, x: 0 },
      exit: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? -48 : 48 }),
    },
    transition: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  },
  photoCaption: {
    variants: {
      enter: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? 48 : -48 }),
      center: { opacity: 1, x: 0 },
      exit: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? -48 : 48 }),
    },
    transition: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  },
  pptxImage: {
    variants: {
      enter: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? 48 : -48 }),
      center: { opacity: 1, x: 0 },
      exit: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? -48 : 48 }),
    },
    transition: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  },
  poll: {
    variants: {
      enter: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? 48 : -48 }),
      center: { opacity: 1, x: 0 },
      exit: (direction: 1 | -1) => ({ opacity: 0, x: direction === 1 ? -48 : 48 }),
    },
    transition: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  },
};

type Props = {
  slides: Slide[];
  startIndex: number;
  onExit: () => void;
  /** Required to start a live poll session or a class-follow session — omit if this deck isn't persisted (e.g. in-memory sample deck). */
  partId?: string;
};

function slideHasAnswer(slide: Slide): boolean {
  return (slide.answerFields?.length ?? 0) > 0;
}

type PollSessionState = { code: string; joinUrl: string; qrDataUrl: string | null };
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

  // Revisiting a poll slide always starts a fresh round rather than resuming
  // an old one — a new "Iniciar votação" click is required, so votes don't
  // silently start while the teacher is still introducing the question.
  useEffect(() => {
    setPollSession(null);
  }, [index]);

  const startVoting = async () => {
    const currentSlide = slides[index];
    if (!partId || currentSlide.template !== 'poll') return;
    const res = await fetch('/api/polls/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partId,
        slideId: currentSlide.id,
        question: currentSlide.data.question,
        options: currentSlide.data.options.map((o) => o.label),
      }),
    });
    if (!res.ok) return;
    const session = await res.json();
    const joinUrl = `${window.location.origin}/poll/${session.code}`;
    const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 260, margin: 1 }).catch(() => null);
    setPollSession({ code: session.code, joinUrl, qrDataUrl });

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

  const { tallies, total } = usePollTallies(pollSession?.code ?? null);

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
  useEffect(() => {
    if (!classSession) return;
    fetch(`/api/class/${classSession.code}/slide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideId: slides[index].id }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSession, index]);

  // Discreet join button/modal: fades in on mouse activity, fades out after
  // idle — same pattern as video-player controls. Stays visible while the
  // modal is open.
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    function onActivity() {
      setControlsVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setControlsVisible((v) => (showJoinModal ? v : false));
      }, 2500);
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
  const { variants, transition } = slideTransition[slide.template];

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
              revealAnswers={revealed}
              liveResults={
                slide.template === 'poll' && pollSession
                  ? ({ ...pollSession, tallies, total } satisfies PollLiveResults)
                  : undefined
              }
              onStartVoting={slide.template === 'poll' && partId ? startVoting : undefined}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Click zones: left third = previous, right two-thirds = next */}
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
          color: 'rgba(255,255,255,0.6)',
          fontSize: 12.5,
          fontFamily: 'var(--font-body)',
          zIndex: 1001,
          pointerEvents: 'none',
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
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 12.5,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            opacity: controlsVisible ? 1 : 0,
            pointerEvents: controlsVisible ? 'auto' : 'none',
            transition: 'opacity 300ms',
          }}
        >
          📱 Entrar na aula
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
