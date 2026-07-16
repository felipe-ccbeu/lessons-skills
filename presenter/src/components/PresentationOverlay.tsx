'use client';

import { useEffect, useRef, useState } from 'react';
import { Slide } from '@/lib/types';
import { RENDERERS } from '@/components/slides';

type Props = {
  slides: Slide[];
  startIndex: number;
  onExit: () => void;
};

function slideHasAnswer(slide: Slide): boolean {
  return (slide.answerFields?.length ?? 0) > 0;
}

export function PresentationOverlay({ slides, startIndex, onExit }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
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
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <div
          key={slide.id}
          className={`stage slide-enter ${direction === 1 ? 'slide-enter-next' : 'slide-enter-prev'}`}
          style={{ boxShadow: 'none' }}
        >
          <Renderer
            data={slide.data}
            editMode={false}
            onEdit={() => {}}
            answerFields={slide.answerFields ?? []}
            revealAnswers={revealed}
          />
        </div>
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
    </div>
  );
}
