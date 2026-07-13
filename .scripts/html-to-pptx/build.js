/**
 * Generic layout.json -> .pptx builder for CCBEU slide templates.
 * Usage: node build.js <layout1.json> [<layout2.json> ...] [--out <file.pptx>]
 *
 * Accepts one layout.json (single-slide deck, as before) or several in a row
 * (multi-slide deck, one slide per layout.json, in the given order) — used to
 * merge a lesson's per-template slides into one final presentation.
 */
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

// HTML canvas is built at 96 DPI, matching pptxgenjs's inch-based coords.
const PX_TO_IN = 1 / 96;
// CSS px -> point (1px = 0.75pt at 96dpi).
const PX_TO_PT = 0.75;

// Font metrics measured in the browser can render a little narrower than the
// same font in PowerPoint/Google Slides. Padding free-floating (no
// background) single-line text boxes means a small metric mismatch can't
// force an unwanted line wrap that overflows the box vertically — the bug
// that caused the GrammarBox title to collide with the eyebrow above it.
const WIDTH_SAFETY_MARGIN = 1.15;

function parseArgs(argv) {
  const layoutPaths = [];
  const opts = { out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") opts.out = argv[++i];
    else layoutPaths.push(argv[i]);
  }
  return { layoutPaths, ...opts };
}

function addSlideFromLayout(pptx, layout) {
  const slide = pptx.addSlide();
  slide.background = { color: layout.backgroundColor || "FFFFFF" };

  for (const s of layout.shapes || []) {
    const x = s.x * PX_TO_IN, y = s.y * PX_TO_IN, w = s.w * PX_TO_IN, h = s.h * PX_TO_IN;
    const opts = { x, y, w, h, fill: { color: s.fill, transparency: s.transparency }, line: { type: "none" } };
    if (s.type === "ellipse") {
      slide.addShape("ellipse", opts);
    } else if (s.rectRadius) {
      opts.rectRadius = s.rectRadius;
      slide.addShape("roundRect", opts);
    } else {
      slide.addShape("rect", opts);
    }
  }

  for (const t of layout.texts || []) {
    // Template placeholder label ("IMAGE", "IMAGE AREA", "PHOTO 1", "PHOTO",
    // ...) marking where a real photo should be dropped in later. These are
    // rendered in the design system's neutral placeholder gray (#9AA1AC),
    // short, all-caps, and centered inside their box (a real photo frame or
    // tint area) — not real slide content, so skip the text and leave the
    // background shape underneath as a clean, empty placeholder. Centering
    // is the load-bearing signal here: real body/label text in these
    // templates is always top-anchored, while every observed placeholder
    // label is center-anchored, so this can't be confused with the
    // (bottom-left, top-anchored, mixed-case) footer credit.
    const isPlaceholderLabel =
      t.runs.length === 1 &&
      t.valign === "middle" &&
      t.runs[0].color === "9AA1AC" &&
      t.runs[0].text.trim().length <= 20 &&
      /^[A-Z0-9 /]+$/.test(t.runs[0].text.trim());
    if (isPlaceholderLabel) continue;

    const x = t.x * PX_TO_IN;
    const y = t.y * PX_TO_IN;
    // Only pad the width for the font-metric-mismatch safety margin when the
    // box has no real CSS padding of its own — a box with real padding (a
    // bubble, pill, badge) already has breathing room baked into its
    // measured width, and stacking the safety margin on top of that as well
    // would push centered text off-center.
    const paddedW = t.padding
      ? t.w
      : Math.min(t.w * WIDTH_SAFETY_MARGIN, layout.slideWidth - t.x);
    const w = paddedW * PX_TO_IN;
    const h = t.h * PX_TO_IN;

    const textRuns = t.runs.map((r) => ({
      text: r.text,
      options: {
        color: r.color,
        bold: r.bold,
        fontFace: r.fontFamily,
        fontSize: Math.round(r.fontSizePx * PX_TO_PT),
        charSpacing: r.letterSpacing || undefined,
      },
    }));

    // pptxgenjs's `margin` is the inset (in points) between the text box
    // edge and the text itself — this is what makes a bubble/pill/badge's
    // text sit with real breathing room instead of glued to the shape's
    // corner, mirroring the CSS padding measured at extraction time.
    const margin = t.padding
      ? [
          t.padding.top * PX_TO_PT,
          t.padding.right * PX_TO_PT,
          t.padding.bottom * PX_TO_PT,
          t.padding.left * PX_TO_PT,
        ]
      : 0;

    slide.addText(textRuns, {
      x, y, w, h,
      // Anchoring top means any unexpected wrap grows downward into empty
      // space instead of upward into a neighboring element above.
      valign: t.valign === "middle" ? "middle" : "top",
      align: t.align,
      margin,
      fontFace: t.runs[0].fontFamily,
    });
  }

}

async function build(layoutPaths, outPath) {
  const layouts = layoutPaths.map((p) => JSON.parse(fs.readFileSync(p, "utf-8")));

  // All slides share one presentation, so the canvas size comes from the
  // first layout — every template in this design system uses the same
  // 1280x720 slide, so this doesn't need per-slide layout switching.
  const first = layouts[0];
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "CCBEU_16x9", width: first.slideWidth * PX_TO_IN, height: first.slideHeight * PX_TO_IN });
  pptx.layout = "CCBEU_16x9";

  for (const layout of layouts) {
    addSlideFromLayout(pptx, layout);
  }

  const finalOut =
    outPath ||
    (layoutPaths.length === 1
      ? layoutPaths[0].replace(/-layout\.json$/, "").replace(/\.json$/, "") + ".pptx"
      : "deck.pptx");
  await pptx.writeFile({ fileName: finalOut });
  return finalOut;
}

async function main() {
  const { layoutPaths, out } = parseArgs(process.argv.slice(2));
  if (!layoutPaths.length) {
    console.error("Usage: node build.js <layout1.json> [<layout2.json> ...] [--out <file.pptx>]");
    process.exit(1);
  }
  const written = await build(layoutPaths, out);
  console.log(`Wrote ${written} (${layoutPaths.length} slide${layoutPaths.length > 1 ? "s" : ""})`);
}

main();
