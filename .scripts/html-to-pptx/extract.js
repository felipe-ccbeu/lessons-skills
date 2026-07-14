/**
 * Generic HTML -> layout.json extractor for CCBEU slide templates.
 *
 * Renders the given HTML in a real Chromium instance and walks every visible
 * node inside the slide root, recording exact geometry (getBoundingClientRect,
 * not CSS source values) and computed styles. Geometry is measured after
 * fonts have loaded and layout has settled, so it reflects what actually
 * rendered — not what the stylesheet asked for.
 *
 * Usage: node extract.js <template.html> [--root <selector>] [--out <file.json>]
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

function parseArgs(argv) {
  const [htmlPath, ...rest] = argv;
  const opts = { root: null, out: null };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--root") opts.root = rest[++i];
    else if (rest[i] === "--out") opts.out = rest[++i];
  }
  return { htmlPath, ...opts };
}

async function extract(htmlPath, rootSelector) {
  const absPath = path.resolve(htmlPath);
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto("file://" + absPath.replace(/\\/g, "/"));
  await page.evaluate(() => document.fonts.ready);
  // Let web fonts finish swapping/reflowing before we measure anything.
  await page.waitForTimeout(150);

  // Resolve every <img> src (blob: URL from the bundler's manifest unpacking,
  // or a plain relative/data: src) to a data: URI up front, in-page, so the
  // synchronous walk below can just read el.__dataUri off each element. Must
  // happen after the bundler's own DOMContentLoaded unpacking (which turns
  // manifest refs into blob: URLs) — the waitForTimeout above already covers
  // that since the bundler runs on DOMContentLoaded, well before this.
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll("img"));
    await Promise.all(
      imgs.map(async (img) => {
        if (!img.currentSrc) return;
        if (img.currentSrc.startsWith("data:")) {
          img.__dataUri = img.currentSrc;
          return;
        }
        try {
          const res = await fetch(img.currentSrc);
          const blob = await res.blob();
          img.__dataUri = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn("Failed to resolve image src to data URI:", img.currentSrc, err);
        }
      })
    );
  });

  const data = await page.evaluate((rootSel) => {
    function findRoot() {
      if (rootSel) return document.querySelector(rootSel);
      // Common conventions across the CCBEU templates we've seen so far.
      return (
        document.querySelector("#slide") ||
        document.querySelector(".cp-canvas") ||
        document.querySelector(".stage > div") ||
        document.body
      );
    }

    const root = findRoot();
    const rootBox = root.getBoundingClientRect();
    const rootBg = getComputedStyle(root).backgroundColor;

    function rgbToHex(rgbStr) {
      const m = rgbStr && rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      const [, r, g, b, a] = m;
      if (a !== undefined && parseFloat(a) === 0) return null;
      return [r, g, b].map((v) => parseInt(v).toString(16).padStart(2, "0")).join("").toUpperCase();
    }

    // Returns 0-100 (pptxgenjs's "transparency" scale) from a CSS alpha
    // channel, so translucent fills (e.g. a frosted glass pill over a
    // colored background) don't get baked into pptxgenjs as solid color —
    // which would opaquely cover any text sitting underneath.
    function rgbAlphaToTransparency(rgbStr) {
      const m = rgbStr && rgbStr.match(/rgba?\([^,]+,[^,]+,[^,]+(?:,\s*([\d.]+))?\)/);
      const a = m && m[1] !== undefined ? parseFloat(m[1]) : 1;
      return Math.round((1 - a) * 100);
    }

    function isVisible(el) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    }

    // A node is a "leaf" for our purposes if it has its own direct text,
    // regardless of whether it also has element children (e.g. a label with
    // an inline icon span before the text).
    function ownText(el) {
      let t = "";
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) t += child.textContent;
      }
      return t.trim();
    }

    // Mirrors the browser's own `white-space: normal` collapsing (the
    // default, and what every template here uses): a run of whitespace —
    // including the newlines and indentation that only exist for the
    // template HTML's own source readability, e.g.
    // `<div class="bubble">\n      {{TOKEN}}\n      <span>...` — collapses
    // to a single space when rendered. `textContent` does NOT do this
    // collapsing on its own; skipping it was the direct cause of a filled
    // dialogue bubble rendering as "\n      Hello, I'm Harumi.\n      "
    // instead of "Hello, I'm Harumi." once real content replaced a token
    // that used to be short enough not to visibly show the leftover
    // whitespace.
    function collapseWhitespace(str) {
      return str.replace(/\s+/g, " ");
    }

    function runFromNode(node) {
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
      const cs = getComputedStyle(el);
      return {
        text: collapseWhitespace(node.textContent),
        color: rgbToHex(cs.color) || "000000",
        bold: parseInt(cs.fontWeight) >= 600,
        fontFamily: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
        fontSizePx: parseFloat(cs.fontSize),
        letterSpacing: cs.letterSpacing !== "normal" ? parseFloat(cs.letterSpacing) : undefined,
      };
    }

    // True for elements like <span>/<em>/<b>/<strong> that exist to carry an
    // inline run of differently-styled text inside a running sentence (e.g.
    // the pink contraction inside "I ___ Camila. (= 'm)"), as opposed to a
    // standalone block-level chunk of content in its own right. Deliberately
    // NOT based on computed `display`: a <span> that's a direct child of a
    // `display: flex` parent (a common pattern in these templates, e.g.
    // `.cc-row { display: flex }`) computes to `display: block` as a flex
    // item even though it's written and behaves exactly like an inline
    // highlight span in the source markup — checking display here silently
    // excluded exactly the "sentence with a colored contraction inside it"
    // case this function exists to catch.
    //
    // A span with its OWN background fill is excluded — that's a real
    // visual shape wearing a <span> tag (e.g. a "seal-pill" badge), not a
    // colored run inside a sentence, and it must still get its own
    // shape+text-box pass so its background rect is emitted (confirmed by a
    // regression: the LSRW skill pills in Objectives silently lost their
    // translucent background shapes when this check was tag-name-only).
    const INLINE_RUN_TAGS = new Set(["SPAN", "EM", "B", "STRONG", "I"]);
    function isInlineRunCarrier(el) {
      if (!INLINE_RUN_TAGS.has(el.tagName)) return false;
      return !rgbToHex(getComputedStyle(el).backgroundColor);
    }

    // Collects every text-bearing child (direct text nodes and inline run
    // carriers like <span>/<em>) into an ordered list of runs, so a sentence
    // split across multiple inline elements — plain text before, a colored
    // <span> highlight in the middle, plain text after — becomes ONE text
    // box with multiple styled runs instead of several disconnected boxes
    // that can drift apart visually once real content replaces the
    // template's placeholder text. Also returns the text-bearing child nodes
    // themselves, so the caller can measure a bounding box over just the
    // text — NOT the parent element's full box, which would include any
    // non-text sibling (e.g. a decorative dot rendered before the label in a
    // flex row) and misplace the text box on top of that sibling.
    function collectInlineRuns(el) {
      const runs = [];
      const nodes = [];
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (child.textContent.trim()) {
            runs.push(runFromNode(child));
            nodes.push(child);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE && isInlineRunCarrier(child) && isVisible(child)) {
          const childText = child.textContent.trim();
          if (childText) {
            runs.push(runFromNode(child));
            nodes.push(child);
          }
        }
      }
      // Whitespace was only collapsed run-by-run above (an interior space
      // between two runs, e.g. "I'm" + " from Brazil.", is real and must
      // stay) — but the leading edge of the first run and the trailing edge
      // of the last run come from source-formatting whitespace around the
      // token itself and must be trimmed, the same way a browser trims the
      // edges of a block's rendered text.
      if (runs.length) {
        runs[0].text = runs[0].text.replace(/^\s+/, "");
        runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "");
      }
      return { runs, nodes };
    }

    // Bounding box over exactly the given nodes (text nodes measured via a
    // Range, elements via getBoundingClientRect), unioned together. This is
    // what a text box's real on-screen extent is — the parent element's own
    // box can be wider/taller/offset when it also lays out non-text
    // siblings (icons, badges) that already got their own shape entry.
    function textNodesBoundingBox(nodes) {
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const node of nodes) {
        let r;
        if (node.nodeType === Node.TEXT_NODE) {
          const range = document.createRange();
          range.selectNodeContents(node);
          r = range.getBoundingClientRect();
        } else {
          r = node.getBoundingClientRect();
        }
        if (r.width === 0 && r.height === 0) continue;
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      }
      if (left === Infinity) return null;
      return { x: left, y: top, width: right - left, height: bottom - top };
    }

    const shapes = [];
    const texts = [];
    const images = [];
    const seen = new Set();

    function walk(el) {
      if (!isVisible(el)) return;
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const bgHex = rgbToHex(cs.backgroundColor);
      // getComputedStyle().borderRadius reports the literal CSS value (e.g.
      // "999px" for the common "fully pill-shaped" convention), NOT the
      // radius actually rendered — the browser only clamps it to half the
      // shorter side at paint time. Using the raw value directly produced a
      // nonsense rectRadius (999/96 = 10.4in) for a 6px-tall pink pill bar,
      // wildly exceeding pptxgenjs's own max-radius-is-half-the-shorter-side
      // rule and distorting the shape. Clamp here the same way the browser
      // does before converting to inches.
      const borderRadiusPx = Math.min(parseFloat(cs.borderRadius) || 0, box.width / 2, box.height / 2);
      const isRound = borderRadiusPx >= box.width / 2 - 1 && box.width === box.height;

      // Emit a background shape for any element that paints a fill, as long
      // as it's not just the slide root itself.
      if (bgHex && el !== root) {
        const transparency = rgbAlphaToTransparency(cs.backgroundColor);
        shapes.push({
          type: isRound ? "ellipse" : "rect",
          x: +(box.x - rootBox.x).toFixed(2),
          y: +(box.y - rootBox.y).toFixed(2),
          w: +box.width.toFixed(2),
          h: +box.height.toFixed(2),
          fill: bgHex,
          transparency: transparency > 0 ? transparency : undefined,
          rectRadius: !isRound && borderRadiusPx > 0 ? +(borderRadiusPx / 96).toFixed(3) : undefined,
        });
      }

      // <img> tags carry no text/background-fill of their own, so without
      // this they're silently invisible in the generated .pptx — the direct
      // cause of the LSRW skill icons and any photo/logo image disappearing
      // from every slide that used one. src is resolved to a data: URI by
      // the caller-side page.evaluate wrapper below (this function itself
      // can't do the network fetch), so here we just record geometry + the
      // already-resolved data URI plus natural aspect ratio for the builder
      // to fit inside the box without distortion.
      if (el.tagName === "IMG" && el.currentSrc) {
        images.push({
          x: +(box.x - rootBox.x).toFixed(2),
          y: +(box.y - rootBox.y).toFixed(2),
          w: +box.width.toFixed(2),
          h: +box.height.toFixed(2),
          dataUri: el.__dataUri || null,
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight,
        });
        return;
      }

      const { runs, nodes } = collectInlineRuns(el);
      if (runs.length) {
        // getBoundingClientRect() on the parent `el` includes CSS padding,
        // which is exactly right for a bubble/pill/badge (the padding is
        // real breathing room the text should keep). But when the parent
        // lays out a non-text sibling next to the text — before it in a flex
        // ROW (e.g. a decorative dot before a breadcrumb label, offsetting X)
        // or above it in a flex COLUMN (e.g. an icon stacked above a label
        // in `.seal`, offsetting Y) — `el`'s box extends over that sibling
        // too, not just the text. Using it as-is would draw the text box on
        // top of the sibling (the bug that put "Listening" vertically
        // centered across the icon+label column instead of anchored to just
        // the label's own line). Detect that case by comparing `el`'s box
        // against a box measured over just the text-bearing nodes on EITHER
        // axis, and prefer the tighter/text-only box whenever it's inset
        // from the parent's edge on either one (padding alone doesn't
        // explain a large offset; a same-height/width sibling taking up
        // space does).
        const textBox = textNodesBoundingBox(nodes);
        const hasLeadingSibling = textBox && (textBox.x - box.x > 1 || textBox.y - box.y > 1);
        const measureBox = hasLeadingSibling ? textBox : box;

        // getBoundingClientRect() includes CSS padding in the box, but
        // pptxgenjs's addText draws text flush against the box edges unless
        // told otherwise. Capture the real padding (in px, converted to pt
        // by the builder) so bubble/pill/badge text that has breathing room
        // in the HTML doesn't end up glued to the shape's corner in the
        // generated slide. Skip padding when we already switched to the
        // text-only box — that box has no padding of its own to reapply.
        const padTop = hasLeadingSibling ? 0 : parseFloat(cs.paddingTop) || 0;
        const padRight = hasLeadingSibling ? 0 : parseFloat(cs.paddingRight) || 0;
        const padBottom = hasLeadingSibling ? 0 : parseFloat(cs.paddingBottom) || 0;
        const padLeft = hasLeadingSibling ? 0 : parseFloat(cs.paddingLeft) || 0;
        texts.push({
          selector: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).trim().replace(/\s+/g, ".") : ""),
          x: +(measureBox.x - rootBox.x).toFixed(2),
          y: +(measureBox.y - rootBox.y).toFixed(2),
          w: +measureBox.width.toFixed(2),
          h: +measureBox.height.toFixed(2),
          padding: [padTop, padRight, padBottom, padLeft].some((v) => v > 0)
            ? { top: padTop, right: padRight, bottom: padBottom, left: padLeft }
            : undefined,
          valign:
            cs.display.includes("flex") && cs.alignItems === "center"
              ? "middle"
              : "top",
          align: cs.display.includes("flex") && cs.justifyContent === "center" ? "center" : undefined,
          runs,
        });
        // The inline run carriers (span/em/b) that just got folded into this
        // text box's runs must NOT also be walked as their own top-level
        // text entries — that's exactly the duplication that let a sentence
        // split into disconnected boxes. Skip walking into any child that
        // was already consumed as an inline run.
        for (const child of el.children) {
          if (isInlineRunCarrier(child)) continue;
          walk(child);
        }
        return;
      }

      for (const child of el.children) walk(child);
    }

    for (const child of root.children) walk(child);

    return {
      slideWidth: +rootBox.width.toFixed(2),
      slideHeight: +rootBox.height.toFixed(2),
      backgroundColor: rgbToHex(rootBg) || "FFFFFF",
      shapes,
      texts,
      images,
    };
  }, rootSelector);

  await browser.close();
  return data;
}

async function main() {
  const { htmlPath, root, out } = parseArgs(process.argv.slice(2));
  if (!htmlPath) {
    console.error("Usage: node extract.js <template.html> [--root <selector>] [--out <file.json>]");
    process.exit(1);
  }
  const data = await extract(htmlPath, root);
  const outPath = out || htmlPath.replace(/\.html?$/, "-layout.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Wrote ${outPath} (${data.shapes.length} shapes, ${data.texts.length} texts, ${(data.images || []).length} images)`);
}

main();
