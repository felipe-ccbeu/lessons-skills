'use client';

import { useSlideBlockClipboard } from '@/components/ui/SlideBlockClipboard';

/** Draws the smart-guide lines (`clipboard.activeGuides`) published by whichever drag handler is
 *  currently active. Mount directly inside `.stage-overlay` (unscaled 1280x720 space, unclipped
 *  by `.stage`'s `overflow: hidden`) — no portal needed since it's already rendered there. */
export function AlignmentGuidesOverlay() {
  const { activeGuides } = useSlideBlockClipboard();

  return (
    <>
      {activeGuides.map((line, i) => (
        <div
          key={i}
          className="guide-line"
          style={
            line.orientation === 'vertical'
              ? { left: line.at, top: line.from, width: 1, height: Math.max(line.to - line.from, 1) }
              : { top: line.at, left: line.from, height: 1, width: Math.max(line.to - line.from, 1) }
          }
        />
      ))}
    </>
  );
}
