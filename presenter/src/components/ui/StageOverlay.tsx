'use client';

import { createContext, useContext } from 'react';

const StageOverlayContext = createContext<HTMLElement | null>(null);

export const StageOverlayProvider = StageOverlayContext.Provider;

/** The `.stage-overlay` DOM node (unclipped sibling of `.stage`) — lets a selected `SlideStaggerItem`
 *  portal its selection box/drag handle there so it isn't cut off by `.stage`'s `overflow: hidden`
 *  (needed to crop slide content during presentation) when dragged near or past the slide edge. */
export function useStageOverlayEl() {
  return useContext(StageOverlayContext);
}
