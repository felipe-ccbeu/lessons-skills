'use client';

import { createRoot } from 'react-dom/client';
import pptxgen from 'pptxgenjs';
import { toPng } from 'html-to-image';
import { Slide } from '@/lib/types';
import { RENDERERS } from '@/components/slides';

/** Renders each slide off-screen with the real slide components and captures it as a PNG, so the exported .pptx matches what's on screen. */
export async function exportSlidesToPptx(slides: Slide[], fileName: string) {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-10000px;top:0;width:1280px;height:720px;overflow:hidden;background:#fff;';
  document.body.appendChild(container);
  const root = createRoot(container);

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // built-in 13.33" x 7.5" (16:9), matches our 1280x720 stage ratio

  try {
    for (const s of slides) {
      const Renderer = RENDERERS[s.template];
      await new Promise<void>((resolve) => {
        root.render(
          <div className="stage" style={{ width: 1280, height: 720 }}>
            <Renderer
              data={s.data}
              editMode={false}
              onEdit={() => {}}
              answerFields={s.answerFields ?? []}
              styleOverrides={s.styleOverrides ?? {}}
              revealAnswers
            />
          </div>
        );
        // Two frames: one for React to commit, one for the browser to paint before we capture.
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const dataUrl = await toPng(container, { width: 1280, height: 720, pixelRatio: 1.5, cacheBust: true });
      const pptxSlide = pptx.addSlide();
      pptxSlide.addImage({ data: dataUrl, x: 0, y: 0, w: 13.333, h: 7.5 });
    }
    await pptx.writeFile({ fileName });
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
