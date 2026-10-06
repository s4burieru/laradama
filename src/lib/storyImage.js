/**
 * Story image export — draws the four story templates (clean / meme / vinyl /
 * neon) to a 1080x1920 PNG with Canvas2D.
 *
 * The layout mirrors the `.ld-story-*` rules in src/index.css: those px values
 * are authored against the modal's big preview (`.ld-story-card.ld-big`, 150px
 * wide), so every one of them is multiplied by S = width / 150 to keep the
 * export proportionally identical to what the modal shows. Change a template
 * in CSS and change it here too.
 *
 * No dependencies and no DOM screenshots — the photo is already a data URL
 * (nothing taints the canvas) and Montserrat is loaded by index.html, so
 * `document.fonts.load()` makes the text render in the real webfont.
 */

export const STORY_W = 1080; // Instagram / Facebook story canvas, 9:16
export const STORY_H = 1920;

const REF_W = 150; // px — width of .ld-story-card.ld-big, the size CSS is authored for
const FONT_STACK = 'Montserrat, ui-sans-serif, system-ui, sans-serif';
const FONT_WAIT_MS = 2500; // ms — give up waiting on the webfont and draw with the fallback
const BRAND = '#1ed760';
const BRAND_DEEP = '#0f8a3f';

/**
 * Still frame of `@keyframes eq` (14px -> 44px). The preview pulses all seven
 * bars in sync; a static PNG gets an equalizer curve instead of seven equal
 * columns, sampled from the same 14..44px range.
 */
const EQ_HEIGHTS = [14, 30, 44, 22, 38, 18, 26];

/* ------------------------------------------------------------------ utils */

/** Split `a, b, rgb(1, 2, 3)` on the commas that are not inside parens. */
function splitTopLevel(str) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * `linear-gradient(<angle>, <color>, <color>...)` -> CanvasGradient across the
 * given box, using CSS's angle convention (0deg points up, grows clockwise).
 * Returns null for anything we do not recognise.
 */
function cssLinearGradient(ctx, css, x, y, w, h) {
  if (typeof css !== 'string' || !css.startsWith('linear-gradient')) return null;
  const open = css.indexOf('(');
  const close = css.lastIndexOf(')');
  if (open < 0 || close <= open) return null;
  const parts = splitTopLevel(css.slice(open + 1, close));
  if (parts.length < 3) return null;
  try {
    const angle = ((parseFloat(parts[0]) || 0) * Math.PI) / 180;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const len = Math.abs(w * dx) + Math.abs(h * dy);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const grad = ctx.createLinearGradient(
      cx - (dx * len) / 2,
      cy - (dy * len) / 2,
      cx + (dx * len) / 2,
      cy + (dy * len) / 2,
    );
    const colors = parts.slice(1);
    colors.forEach((c, i) => grad.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), c));
    return grad;
  } catch (err) {
    console.warn('[story] unparsable gradient:', css, err);
    return null;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('photo failed to decode'));
    img.src = src;
  });
}

/**
 * Make sure the weights the templates use are actually resident before
 * drawing — but never let it stall the export: a blocked/slow font CDN would
 * otherwise leave the button stuck on "Rendering…" indefinitely (and the
 * click's user activation expires long before that).
 */
async function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  const loads = Promise.all(
    ['400', '600', '700'].map((weight) => document.fonts.load(`${weight} 16px Montserrat`)),
  ).catch(() => undefined); // offline / font blocked → system fallback, still legible
  await Promise.race([loads, new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS))]);
}

function drawCover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const k = Math.max(w / iw, h / ih);
  const dw = iw * k;
  const dh = ih * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawContain(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const k = Math.min(w / iw, h / ih);
  const dw = iw * k;
  const dh = ih * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function ellipsize(ctx, text, maxW) {
  const value = String(text ?? '');
  if (!Number.isFinite(maxW) || ctx.measureText(value).width <= maxW) return value;
  let out = value;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1);
  return `${out}…`;
}

/** Greedy word wrap; whatever spills past the last kept line gets an ellipsis. */
function wrapText(ctx, text, maxW, maxLines) {
  const words = String(text ?? '')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const overflow = `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`.trim();
  kept[maxLines - 1] = ellipsize(ctx, overflow, maxW);
  return kept;
}

function drawText(ctx, text, opts) {
  const {
    x,
    y,
    size,
    weight = 400,
    color = '#fff',
    align = 'left',
    baseline = 'top',
    maxWidth,
    letterSpacing,
    shadow,
  } = opts;
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = letterSpacing || '0px';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = shadow.blur || 0;
  }
  ctx.fillText(maxWidth ? ellipsize(ctx, text, maxWidth) : String(text ?? ''), x, y);
  ctx.restore();
}

/** `.ld-story-wm` — gradient dot + label, flush to a corner. */
function drawWatermark(ctx, { edge, y, align, label, s }) {
  const dot = 11 * s;
  const gap = 4 * s;
  const size = 9 * s;
  ctx.save();
  ctx.font = `700 ${size}px ${FONT_STACK}`;
  const textW = ctx.measureText(label).width;
  ctx.restore();
  const right = align === 'right';
  const textX = right ? edge : edge + dot + gap;
  const dotX = right ? edge - textW - gap - dot : edge;
  const grad = cssLinearGradient(ctx, `linear-gradient(135deg,${BRAND},${BRAND_DEEP})`, dotX, y, dot, dot);
  ctx.fillStyle = grad || BRAND;
  ctx.fillRect(dotX, y, dot, dot);
  drawText(ctx, label, {
    x: textX,
    y: y + dot / 2,
    baseline: 'middle',
    size,
    weight: 700,
    align: right ? 'right' : 'left',
  });
}

/**
 * `.ld-story-bg` — the photo (cover / contain / blurred), or the song's demo
 * gradient when there is no photo yet.
 */
function paintBackdrop(ctx, w, h, s, song, photo, mode) {
  const grad = cssLinearGradient(ctx, song?.gradient, 0, 0, w, h);

  if (mode === 'blur') {
    // .ld-story-bg.blurbg = cover + filter blur(16px) brightness(.4) + scale(1.3).
    // The overshoot keeps the blur from pulling transparent edges in.
    const x = -0.15 * w;
    const y = -0.15 * h;
    const bw = 1.3 * w;
    const bh = 1.3 * h;
    const filtered = typeof ctx.filter === 'string';
    if (filtered) ctx.filter = `blur(${16 * s}px) brightness(0.4)`;
    if (photo) {
      drawCover(ctx, photo, x, y, bw, bh);
    } else {
      ctx.fillStyle = grad || '#111';
      ctx.fillRect(x, y, bw, bh);
    }
    if (filtered) ctx.filter = 'none';
    else {
      // no canvas filters (older Safari) → fake the brightness dim
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }

  if (photo && mode === 'contain') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    drawContain(ctx, photo, 0, 0, w, h);
    return;
  }
  if (photo) {
    drawCover(ctx, photo, 0, 0, w, h);
    return;
  }
  ctx.fillStyle = grad || '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
}

/* --------------------------------------------------------------- templates */

function paintClean(ctx, w, h, s, song, photo) {
  paintBackdrop(ctx, w, h, s, song, photo, 'cover');

  // .ld-story-scrim-b
  const scrim = ctx.createLinearGradient(0, 0, 0, h);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h);

  drawWatermark(ctx, { edge: 8 * s, y: 8 * s, align: 'left', label: 'Laradama', s });

  const pad = 10 * s;
  const maxW = w - pad * 2;
  const titleFS = 11 * s;
  const titleLH = titleFS * 1.2; // .ld-story-title line-height
  const artistFS = 8.5 * s;
  const artistLH = artistFS * 1.2;
  // The preview wraps unbounded; stop before the block climbs past mid-frame.
  const maxTitleLines = Math.max(2, Math.floor((h - pad - 0.45 * h) / titleLH));

  ctx.save();
  ctx.font = `700 ${titleFS}px ${FONT_STACK}`;
  const titleLines = wrapText(ctx, song.title, maxW, maxTitleLines);
  ctx.restore();

  // .ld-story-info hangs off the bottom edge, so lay it out from there up.
  let bottom = h - pad;
  drawText(ctx, `${song.artist} · trending now`, {
    x: pad,
    y: bottom,
    baseline: 'bottom',
    size: artistFS,
    weight: 400,
    color: 'rgba(255, 255, 255, 0.75)',
    maxWidth: maxW,
  });
  bottom -= artistLH + 1 * s; // .ld-story-artist margin-top
  titleLines.forEach((line, i) => {
    drawText(ctx, line, {
      x: pad,
      y: bottom - titleLH * (titleLines.length - 1 - i),
      baseline: 'bottom',
      size: titleFS,
      weight: 700,
      maxWidth: maxW,
    });
  });
}

function paintMeme(ctx, w, h, s, song, photo) {
  paintBackdrop(ctx, w, h, s, song, photo, 'contain');

  const size = 7.8 * s;
  const lh = size * 1.25; // .ld-meme-bar line-height
  const padY = 5 * s;
  const padX = 6 * s;
  const innerW = w - padX * 2;
  // The bars grow with their text in the preview, so wrap first and size the
  // bar afterwards — capped so a runaway title cannot swallow the frame.
  const maxLines = Math.max(1, Math.floor((0.4 * h) / lh));
  const linesOf = (text) => {
    const upper = String(text ?? '').toUpperCase();
    ctx.save();
    ctx.font = `700 ${size}px ${FONT_STACK}`;
    const lines = wrapText(ctx, upper, innerW, maxLines);
    ctx.restore();
    return lines;
  };
  const bar = (text, top) => {
    const lines = linesOf(text);
    const barH = padY * 2 + lines.length * lh;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, top, w, barH);
    lines.forEach((line, i) => {
      drawText(ctx, line, {
        x: w / 2,
        y: top + padY + lh * (i + 0.5),
        baseline: 'middle',
        align: 'center',
        size,
        weight: 700,
        color: '#000',
        maxWidth: innerW,
      });
    });
  };

  bar("my photo's soundtrack is", 0);
  const bottomLines = linesOf(song.title);
  bar(song.title, h - (padY * 2 + bottomLines.length * lh));
}

function paintVinyl(ctx, w, h, s, song, photo) {
  paintBackdrop(ctx, w, h, s, song, photo, 'blur');

  // .ld-vinyl-disc — a square sleeve (the CSS carries no border-radius),
  // centred at 50% / 38% and 62% of the card wide.
  const disc = 0.62 * w;
  const dx = (w - disc) / 2;
  const dy = 0.38 * h - disc / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 24 * s;
  ctx.shadowOffsetY = 8 * s;
  ctx.fillStyle = '#111';
  ctx.fillRect(dx, dy, disc, disc);
  ctx.restore();

  // .ld-vinyl-photo — inset 12%, cover-cropped. With no photo the preview
  // paints the song gradient into that box instead, so do the same here.
  const inset = 0.12 * disc;
  const px = dx + inset;
  const py = dy + inset;
  const pw = disc - inset * 2;
  const ph = disc - inset * 2;
  if (photo) drawCover(ctx, photo, px, py, pw, ph);
  else {
    ctx.fillStyle = cssLinearGradient(ctx, song?.gradient, px, py, pw, ph) || '#111';
    ctx.fillRect(px, py, pw, ph);
  }

  // .ld-vinyl-grooves — inset box-shadows at 4/11/18/25px. Each translucent
  // white band stacks over the ones beneath it, so paint thick → thin.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  [25, 18, 11, 4].forEach((t) => {
    const k = t * s;
    ctx.beginPath();
    ctx.rect(dx, dy, disc, disc);
    ctx.rect(dx + k, dy + k, disc - k * 2, disc - k * 2);
    ctx.fill('evenodd');
  });

  // .ld-vinyl-hole — 8% of the disc, dead centre, painted last (z-index 3).
  const hole = 0.08 * disc;
  ctx.fillStyle = '#141416';
  ctx.fillRect(dx + (disc - hole) / 2, dy + (disc - hole) / 2, hole, hole);

  // .ld-vinyl-caption (bottom-anchored, wraps unbounded in the preview) +
  // the corner watermark.
  const capFS = 8.5 * s;
  const capLH = capFS * 1.2;
  const capW = w - 20 * s;
  const capBottom = h - 0.09 * h;
  const maxCapLines = Math.max(1, Math.floor((capBottom - (dy + disc) - 8 * s) / capLH));
  ctx.save();
  ctx.font = `600 ${capFS}px ${FONT_STACK}`;
  const capLines = wrapText(ctx, `${song.title} — ${song.artist}`, capW, maxCapLines);
  ctx.restore();
  capLines.forEach((line, i) => {
    drawText(ctx, line, {
      x: w / 2,
      y: capBottom - capLH * (capLines.length - 1 - i),
      baseline: 'bottom',
      align: 'center',
      size: capFS,
      weight: 600,
      maxWidth: capW,
    });
  });
  drawWatermark(ctx, { edge: w - 8 * s, y: h - 8 * s - 11 * s, align: 'right', label: 'laradama.ai', s });
}

function paintNeon(ctx, w, h, s, song, photo) {
  paintBackdrop(ctx, w, h, s, song, photo, 'cover');

  // .ld-neon-duotone — mix-blend-mode: color over the photo only, so it runs
  // before any of the foreground and the context restores the blend mode.
  ctx.save();
  ctx.globalCompositeOperation = 'color';
  ctx.fillStyle =
    cssLinearGradient(
      ctx,
      'linear-gradient(160deg, rgba(30, 215, 96, 0.55), rgba(255, 107, 74, 0.5))',
      0,
      0,
      w,
      h,
    ) || 'rgba(30, 215, 96, 0.4)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // .ld-neon-eq — 7 bars, 3px wide, 3px apart, sitting on the 24% line.
  const barW = 3 * s;
  const gap = 3 * s;
  const total = EQ_HEIGHTS.length * barW + (EQ_HEIGHTS.length - 1) * gap;
  const baseY = h - 0.24 * h;
  let x = (w - total) / 2;
  ctx.fillStyle = '#fff';
  for (const value of EQ_HEIGHTS) {
    const bh = value * s;
    ctx.fillRect(x, baseY - bh, barW, bh);
    x += barW + gap;
  }

  // .ld-neon-title — bottom 13%, centred, with the CSS text-shadow glow. It
  // may wrap upward only as far as the equalizer's baseline above it.
  const titleFS = 9 * s;
  const titleLH = titleFS * 1.2;
  const titleBottom = h - 0.13 * h;
  const maxTitleLines = Math.max(1, Math.floor((titleBottom - baseY) / titleLH));
  ctx.save();
  ctx.font = `700 ${titleFS}px ${FONT_STACK}`;
  const lines = wrapText(ctx, song.title, w - 16 * s, maxTitleLines);
  ctx.restore();
  lines.forEach((line, i) => {
    drawText(ctx, line, {
      x: w / 2,
      y: titleBottom - titleLH * (lines.length - 1 - i),
      baseline: 'bottom',
      align: 'center',
      size: titleFS,
      weight: 700,
      letterSpacing: '0.02em',
      maxWidth: w - 16 * s,
      shadow: { blur: 8 * s },
    });
  });

  // .ld-neon-wm-strip — the text is slightly wider than the frame, so the
  // preview wraps it onto a second line and grows the strip upward.
  const stripFS = 6 * s;
  const stripLH = stripFS * 1.2;
  const pad = 3 * s;
  ctx.save();
  ctx.font = `400 ${stripFS}px ${FONT_STACK}`;
  const stripLines = wrapText(
    ctx,
    'LARADAMA.AI  •  LARADAMA.AI  •  LARADAMA.AI',
    w,
    Math.max(1, Math.floor((0.1 * h) / stripLH)),
  );
  ctx.restore();
  const stripH = pad * 2 + stripLines.length * stripLH;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, h - stripH, w, stripH);
  const stripTop = h - stripH + pad;
  stripLines.forEach((line, i) => {
    drawText(ctx, line, {
      x: w / 2,
      y: stripTop + stripLH * (i + 0.5),
      baseline: 'middle',
      align: 'center',
      size: stripFS,
      color: 'rgba(255, 255, 255, 0.65)',
      letterSpacing: '0.04em',
      maxWidth: w,
    });
  });
}

const PAINTERS = {
  clean: paintClean,
  meme: paintMeme,
  vinyl: paintVinyl,
  neon: paintNeon,
};

/* ------------------------------------------------------------------ public */

/**
 * Render one story template to a PNG blob at 9:16.
 *
 * @param {object} opts
 * @param {{title: string, artist: string, gradient?: string}} opts.song
 * @param {string} [opts.templateId] clean | meme | vinyl | neon
 * @param {string|null} [opts.uploadedImage] data URL of the user's photo
 * @param {number} [opts.width] export width (height follows the 9:16 frame)
 * @returns {Promise<Blob>}
 */
export async function renderStoryImage({
  song,
  templateId = 'clean',
  uploadedImage = null,
  width = STORY_W,
  height = STORY_H,
} = {}) {
  if (!song?.title) throw new Error('no song to render');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is unavailable in this browser');

  const s = width / REF_W;
  await ensureFonts();
  const photo = uploadedImage
    ? await loadImage(uploadedImage).catch((err) => {
        console.warn('[story] photo failed to load, falling back to the gradient:', err);
        return null;
      })
    : null;

  const paint = PAINTERS[templateId] || paintClean;
  paint(ctx, width, height, s, song, photo);

  return await new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))),
        'image/png',
      );
    } catch (err) {
      // a tainted canvas (cross-origin photo) throws here
      reject(err);
    }
  });
}
