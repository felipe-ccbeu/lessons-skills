import JSZip from 'jszip';
import { toPng } from 'html-to-image';
import { Slide } from '@/lib/types';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(blob);
  });
}

function makeImageSlide(imageUrl: string, sourceFile: string, slideNumber: number): Slide {
  return {
    id: `import-${Date.now()}-${slideNumber}-${Math.random().toString(36).slice(2, 8)}`,
    template: 'pptxImage',
    data: { imageUrl, sourceFile, slideNumber },
  };
}

function makeCustomHtmlSlide(html: string, sourceFile: string, slideNumber: number): Slide {
  return {
    id: `import-${Date.now()}-${slideNumber}-${Math.random().toString(36).slice(2, 8)}`,
    template: 'customHtml',
    data: { html, sourceFile },
  };
}

/** Renders an HTML document off-screen in an iframe and captures it as a single full-slide image. */
async function captureHtmlDocument(html: string, sourceFile: string, slideNumber: number): Promise<Slide> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1280px;height:720px;border:0;';
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });
    // Let images/fonts inside the iframe settle before capturing.
    await new Promise((r) => setTimeout(r, 300));
    const doc = iframe.contentDocument;
    if (!doc?.body) throw new Error('Não foi possível carregar o HTML');
    const dataUrl = await toPng(doc.body, { width: 1280, height: 720, cacheBust: true });
    return makeImageSlide(dataUrl, sourceFile, slideNumber);
  } finally {
    document.body.removeChild(iframe);
  }
}

/** A single standalone .html file becomes a live customHtml slide (kept editable), not a rasterized image. */
export async function importHtmlFile(file: File): Promise<Slide[]> {
  const html = await file.text();
  return [makeCustomHtmlSlide(html, file.name, 1)];
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp)$/i;
const HTML_RE = /\.html?$/i;

/** A .zip of images and/or .html files — one slide per entry, in filename order. */
export async function importZipFile(file: File): Promise<Slide[]> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files)
    .filter((f) => !f.dir && (IMAGE_RE.test(f.name) || HTML_RE.test(f.name)))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (entries.length === 0) throw new Error('O ZIP não contém imagens nem arquivos HTML');

  const slides: Slide[] = [];
  let i = 0;
  for (const entry of entries) {
    i += 1;
    if (IMAGE_RE.test(entry.name)) {
      const blob = await entry.async('blob');
      const dataUrl = await blobToDataUrl(blob);
      slides.push(makeImageSlide(dataUrl, entry.name, i));
    } else {
      const html = await entry.async('string');
      slides.push(await captureHtmlDocument(html, entry.name, i));
    }
  }
  return slides;
}

/**
 * A .pptx is itself a ZIP (OOXML) package — pulls the embedded media images straight out of
 * ppt/media/ without needing LibreOffice or any native binary. This gives one slide per embedded
 * image (in the order PowerPoint numbered them), not a pixel-perfect render of each slide.
 */
export async function importPptxFile(file: File): Promise<Slide[]> {
  const zip = await JSZip.loadAsync(file);
  const mediaEntries = Object.values(zip.files)
    .filter((f) => !f.dir && /^ppt\/media\/image\d+\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name))
    .sort((a, b) => {
      const na = parseInt(a.name.match(/image(\d+)/i)?.[1] ?? '0', 10);
      const nb = parseInt(b.name.match(/image(\d+)/i)?.[1] ?? '0', 10);
      return na - nb;
    });

  if (mediaEntries.length === 0) {
    throw new Error('Nenhuma imagem encontrada dentro do .pptx');
  }

  const slides: Slide[] = [];
  let i = 0;
  for (const entry of mediaEntries) {
    i += 1;
    const blob = await entry.async('blob');
    const dataUrl = await blobToDataUrl(blob);
    slides.push(makeImageSlide(dataUrl, file.name, i));
  }
  return slides;
}
