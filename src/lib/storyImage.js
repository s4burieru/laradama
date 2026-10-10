/**
 * Story image export — draws the story templates (clean / meme / vinyl /
 * neon / collage) to a canvas with Canvas2D.
 *
 * Every size, colour and layout value comes from the shared config in
 * src/data/storyTemplates.js — the same numbers the live preview
 * (src/components/StoryPreview.jsx) renders with. Those values are authored in
 * "design px" against a 150px-wide card, so each one is multiplied by
 * s = width / 150 here to keep the export proportionally identical to the
 * preview. To restyle a template, edit the config; nothing in this file needs
 * to change unless a template gains a brand-new *kind* of element.
 *
 * The painters are time-parameterized: `draw(t, { levels, still })` paints the
 * frame at `t` seconds, driven by the template's `anim` config through the
 * pure helpers in src/lib/storyMotion.js. `renderStoryImage` (the PNG export)
 * draws `still: true` — entrance finished, loops at phase 0 — so the still
 * image keeps its pre-motion look exactly. The video export
 * (src/lib/storyVideo.js) reuses `prepareStoryPainter` and draws every frame
 * in real time, with the music's band levels feeding the neon EQ.
 *
 * No dependencies and no DOM screenshots — the photo is already a data URL
 * (nothing taints the canvas) and Montserrat is loaded by index.html, so
 * `document.fonts.load()` makes the text render in the real webfont.
 */

import { fillText, templates } from '../data/storyTemplates';
import {
  discAngleDeg,
  entranceP,
  eqHeightsAt,
  kenBurnsScale,
  marqueeOffsetFrac,
  popScale,
} from './storyMotion';

export const STORY_W = 1080; // Instagram / Facebook story canvas, 9:16
export const STORY_H = 1920;

const REF_W = 150; // px — the design width the config's values are authored against
const FONT_STACK = 'Montserrat, ui-sans-serif, system-ui, sans-serif';
const FONT_WAIT_MS = 2500; // ms — give up waiting on the webfont and draw with the fallback
const BRAND = '#1ed760';
const BRAND_DEEP = '#0f8a3f';

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

/** The mascot mark, loaded once per page and reused by every export. */
const LOGO_SRC = '/laradama-logo.png';
let logoCache = null;
function loadLogo() {
  if (!logoCache) {
    logoCache = loadImage(LOGO_SRC).catch((err) => {
      // Never fail the export over branding: the watermark falls back to the
      // gradient dot the CSS used before the logo existed.
      console.warn('[story] logo failed to load, using the gradient mark:', err);
      return null;
    });
  }
  return logoCache;
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

/**
 * The Laradama logo + label, flush to a corner. Reads the shared watermark
 * config (text / mark / gap / size / weight / colour). The gradient square only
 * shows if the logo image could not be decoded.
 *
 * @param {object} opts
 * @param {object} opts.cfg the template's `watermark` config
 * @param {number} opts.edge x-distance from the anchored edge (px, already scaled)
 * @param {number} opts.y top y (px, already scaled)
 * @param {'left'|'right'} opts.align
 */
function drawWatermark(ctx, { cfg, edge, y, align, s, logo = null }) {
  const mark = cfg.mark * s;
  const gap = cfg.gap * s;
  const size = cfg.size * s;
  const label = String(cfg.text ?? '');
  ctx.save();
  ctx.font = `${cfg.weight} ${size}px ${FONT_STACK}`;
  const textW = ctx.measureText(label).width;
  ctx.restore();
  const right = align === 'right';
  const textX = right ? edge : edge + mark + gap;
  const markX = right ? edge - textW - gap - mark : edge;
  if (logo) {
    drawContain(ctx, logo, markX, y, mark, mark);
  } else {
    const grad = cssLinearGradient(ctx, `linear-gradient(135deg,${BRAND},${BRAND_DEEP})`, markX, y, mark, mark);
    ctx.fillStyle = grad || BRAND;
    ctx.fillRect(markX, y, mark, mark);
  }
  drawText(ctx, label, {
    x: textX,
    y: y + mark / 2,
    baseline: 'middle',
    size,
    weight: cfg.weight,
    color: cfg.color,
    align: right ? 'right' : 'left',
  });
}

function drawCenteredWatermark(ctx, { cfg, cx, cy, s, logo = null }) {
  const mark = cfg.mark * s;
  const gap = cfg.gap * s;
  const size = cfg.size * s;
  const label = String(cfg.text ?? '');
  ctx.save();
  ctx.font = `${cfg.weight} ${size}px ${FONT_STACK}`;
  const textW = ctx.measureText(label).width;
  ctx.restore();
  const totalW = mark + gap + textW;
  const markX = cx - totalW / 2;
  const y = cy - mark / 2;
  if (logo) {
    drawContain(ctx, logo, markX, y, mark, mark);
  } else {
    const grad = cssLinearGradient(ctx, `linear-gradient(135deg,${BRAND},${BRAND_DEEP})`, markX, y, mark, mark);
    ctx.fillStyle = grad || BRAND;
    ctx.fillRect(markX, y, mark, mark);
  }
  drawText(ctx, label, {
    x: markX + mark + gap,
    y: cy,
    baseline: 'middle',
    size,
    weight: cfg.weight,
    color: cfg.color,
  });
}

/** Compute drawWatermark's edge/y/align from a template's watermark config. */
function watermarkArgs(cfg, w, h, s) {
  return cfg.corner
    ? { cfg, edge: w - cfg.edge * s, y: h - cfg.edge * s - cfg.mark * s, align: 'right', s }
    : { cfg, edge: cfg.edge * s, y: cfg.edge * s, align: 'left', s };
}

/** Fill a full-frame vertical scrim from `{ stop, color }` stops (fractions of height). */
function paintScrim(ctx, w, h, stops) {
  if (!stops?.length) return;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach((st) => grad.addColorStop(st.stop, st.color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/**
 * The photo backdrop (cover / contain / blurred), or the song's demo gradient
 * when there is no photo yet. `mode` is the template's `backdrop` config value;
 * `zoom` is the Ken Burns factor (>1 crops tighter as the clip progresses).
 */
function paintBackdrop(ctx, w, h, s, song, photo, mode, zoom = 1) {
  const grad = cssLinearGradient(ctx, song?.gradient, 0, 0, w, h);

  if (mode === 'blur') {
    // backdrop: 'blur' = cover + filter blur(16px) brightness(.4) + scale(1.3).
    // The overshoot keeps the blur from pulling transparent edges in.
    const k = 1.3 * zoom;
    const bw = w * k;
    const bh = h * k;
    const x = (w - bw) / 2;
    const y = (h - bh) / 2;
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
    const cw = w * zoom;
    const ch = h * zoom;
    drawCover(ctx, photo, (w - cw) / 2, (h - ch) / 2, cw, ch);
    return;
  }
  ctx.fillStyle = grad || '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
}

/* --------------------------------------------------------------- templates */

function paintClean(ctx, w, h, s, song, photo, logo, cfg, frame) {
  const { t = 0, still = true } = frame || {};
  paintBackdrop(ctx, w, h, s, song, photo, cfg.backdrop, kenBurnsScale(cfg.anim, t, still));
  paintScrim(ctx, w, h, cfg.scrim);
  drawWatermark(ctx, { ...watermarkArgs(cfg.watermark, w, h, s), logo });

  const pad = cfg.info.inset * s;
  const maxW = w - pad * 2;
  const titleFS = cfg.info.title.size * s;
  const titleLH = titleFS * cfg.info.title.lineHeight;
  const artistFS = cfg.info.artist.size * s;
  const artistLH = artistFS * cfg.info.artist.lineHeight;
  // The preview wraps unbounded; stop before the block climbs past mid-frame.
  const maxTitleLines = Math.max(2, Math.floor((h - pad - 0.45 * h) / titleLH));

  ctx.save();
  ctx.font = `${cfg.info.title.weight} ${titleFS}px ${FONT_STACK}`;
  const titleLines = wrapText(ctx, song.title, maxW, maxTitleLines);
  ctx.restore();

  // Entrance: the info block fades in, rising from just below its final spot.
  const p = entranceP(cfg.anim, t, still);
  const rise = (1 - p) * (cfg.anim?.rise ?? 0) * s;
  ctx.save();
  ctx.globalAlpha = p;
  // The info block hangs off the bottom edge, so lay it out from there up.
  let bottom = h - pad + rise;
  drawText(ctx, fillText(cfg.info.artist.text, song), {
    x: pad,
    y: bottom,
    baseline: 'bottom',
    size: artistFS,
    weight: cfg.info.artist.weight,
    color: cfg.info.artist.color,
    maxWidth: maxW,
  });
  bottom -= artistLH + cfg.info.artist.marginTop * s;
  titleLines.forEach((line, i) => {
    drawText(ctx, line, {
      x: pad,
      y: bottom - titleLH * (titleLines.length - 1 - i),
      baseline: 'bottom',
      size: titleFS,
      weight: cfg.info.title.weight,
      color: cfg.info.title.color,
      maxWidth: maxW,
    });
  });
  ctx.restore();
}

function paintMeme(ctx, w, h, s, song, photo, logo, cfg, frame) {
  const { t = 0, still = true } = frame || {};
  paintBackdrop(ctx, w, h, s, song, photo, cfg.backdrop);

  const bar = cfg.bar;
  const padY = bar.padY * s;
  const padX = bar.padX * s;
  const linesOf = (text, fontSize, maxWidth) => {
    const upper = bar.uppercase ? String(text ?? '').toUpperCase() : String(text ?? '');
    ctx.save();
    ctx.font = `${bar.weight} ${fontSize}px ${FONT_STACK}`;
    const lh = fontSize * bar.lineHeight;
    // The bars grow with their text in the preview, so wrap first and size the
    // bar afterwards — capped so a runaway title cannot swallow the frame.
    const maxLines = Math.max(1, Math.floor((0.4 * h) / lh));
    const lines = wrapText(ctx, upper, maxWidth, maxLines);
    ctx.restore();
    return lines;
  };
  const drawBar = (text, top, fontSize, layout = {}, p = 1, dir = -1) => {
    const lh = fontSize * bar.lineHeight;
    const contentLeft = layout.contentLeft ?? padX;
    const contentRight = layout.contentRight ?? w - padX;
    const contentW = contentRight - contentLeft;
    const lines = linesOf(text, fontSize, contentW);
    const barH = Math.max(
      padY * 2 + lines.length * lh,
      layout.minHeight ?? 0,
    );
    // Entrance: the bar slides in from its own edge (dir) while fading up.
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(0, (1 - p) * (cfg.anim?.rise ?? 0) * s * dir);
    ctx.fillStyle = bar.bg;
    ctx.fillRect(0, top, w, barH);
    lines.forEach((line, i) => {
      drawText(ctx, line, {
        x: (contentLeft + contentRight) / 2,
        y: top + padY + lh * (i + 0.5),
        baseline: 'middle',
        align: bar.align,
        size: fontSize,
        weight: bar.weight,
        color: bar.color,
        maxWidth: contentW,
      });
    });
    ctx.restore();
    return barH;
  };

  drawBar(fillText(cfg.top.text, song), 0, cfg.top.size * s, {}, entranceP(cfg.anim, t, still), -1);

  const bottomFS = cfg.bottom.size * s;
  const bottomText = fillText(cfg.bottom.text, song);
  const logoSize = logo ? cfg.logo.size * s : 0;
  // Wrap against the full bar width: the logo no longer sits inside the bar.
  const bottomLines = linesOf(bottomText, bottomFS, w - padX * 2);
  const bottomBarH = padY * 2 + bottomLines.length * (bottomFS * bar.lineHeight);
  const bottomBarTop = h - bottomBarH;
  const pBottom = entranceP(cfg.anim, t - (cfg.anim?.stagger ?? 0), still);
  drawBar(bottomText, bottomBarTop, bottomFS, {}, pBottom, 1);

  if (logo) {
    // Outside the bar, resting on its top edge — anchored to `bottomBarTop`,
    // so a taller (multi-line) bar carries the logo up with it. It rides the
    // bar's entrance the same way the preview's does.
    const logoTop = bottomBarTop - cfg.logo.bottom * s - logoSize;
    const logoLeft = w - cfg.logo.right * s - logoSize;
    ctx.save();
    ctx.globalAlpha = pBottom;
    ctx.translate(0, (1 - pBottom) * (cfg.anim?.rise ?? 0) * s);
    drawContain(ctx, logo, logoLeft, logoTop, logoSize, logoSize);
    ctx.restore();
  }
}

function paintVinyl(ctx, w, h, s, song, photo, logo, cfg, frame) {
  const { t = 0, still = true } = frame || {};
  paintBackdrop(ctx, w, h, s, song, photo, cfg.backdrop, kenBurnsScale(cfg.anim, t, still));

  // A circular record. Every layer beneath is round too.
  const disc = cfg.disc.size * w;
  const r = disc / 2;
  const cx = cfg.disc.cx * w;
  const cy = cfg.disc.cy * h;

  ctx.save();
  ctx.shadowColor = cfg.disc.shadowColor;
  ctx.shadowBlur = cfg.disc.shadowBlur * s;
  ctx.shadowOffsetY = cfg.disc.shadowY * s;
  ctx.fillStyle = cfg.disc.bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Inner photo circle, clipped round. With no photo the preview paints the
  // song gradient into that box instead, so do the same.
  const inner = r - cfg.photo.inset * disc;
  const ix = cx - inner;
  const iy = cy - inner;
  const isz = inner * 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    // The photo spins with the disc; 1.5x its box keeps the rotated corners
    // covering the full circle at every angle.
    const box = isz * 1.5;
    ctx.translate(cx, cy);
    ctx.rotate((discAngleDeg(cfg.anim, t, still) * Math.PI) / 180);
    drawCover(ctx, photo, -box / 2, -box / 2, box, box);
  } else {
    ctx.fillStyle = cssLinearGradient(ctx, song?.gradient, ix, iy, isz, isz) || cfg.disc.bg;
    ctx.fillRect(ix, iy, isz, isz);
  }
  ctx.restore();

  // Grooves — circular inset rings. Each translucent band stacks over the ones
  // beneath it, so paint thick → thin. Two subpaths per ring + the even-odd
  // rule turn the disc into an annulus.
  ctx.fillStyle = cfg.grooves.color;
  [...cfg.grooves.widths].sort((a, b) => b - a).forEach((width) => {
    const k = width * s;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx, cy, r - k, 0, Math.PI * 2);
    ctx.fill('evenodd');
  });

  // Hub — dead centre, painted last (z-index 3), with a light ring just outside
  // its edge.
  const hole = cfg.hole.size * disc;
  ctx.beginPath();
  ctx.arc(cx, cy, hole / 2, 0, Math.PI * 2);
  ctx.fillStyle = cfg.hole.bg;
  ctx.fill();
  ctx.save();
  ctx.lineWidth = cfg.hole.ring * s;
  ctx.strokeStyle = cfg.hole.ringColor;
  ctx.beginPath();
  ctx.arc(cx, cy, hole / 2 + s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Centered caption and watermark sit below the disc.
  const titleFS = cfg.caption.title.size * s;
  const artistFS = cfg.caption.artist.size * s;
  const titleLH = titleFS * cfg.caption.lineHeight;
  const artistLH = artistFS * cfg.caption.lineHeight;
  const artistMargin = cfg.caption.artist.marginTop * s;
  const capW = w - cfg.caption.padX * 2 * s;
  const capTop = cy + r + cfg.caption.gap * s;
  const maxCapLines = Math.max(1, Math.floor((h - capTop - 8 * s) / titleLH));
  ctx.save();
  ctx.font = `${cfg.caption.title.weight} ${titleFS}px ${FONT_STACK}`;
  const titleLines = wrapText(ctx, fillText(cfg.caption.title.text, song), capW, maxCapLines);
  ctx.font = `${cfg.caption.artist.weight} ${artistFS}px ${FONT_STACK}`;
  const artistLines = wrapText(ctx, fillText(cfg.caption.artist.text, song), capW, maxCapLines);
  ctx.restore();
  // Entrance: the caption fades in, rising toward the disc. The watermark is
  // branding — it stays put.
  const capP = entranceP(cfg.anim, t, still);
  ctx.save();
  ctx.globalAlpha = capP;
  ctx.translate(0, (1 - capP) * (cfg.anim?.rise ?? 0) * s);
  titleLines.forEach((line, i) => {
    drawText(ctx, line, {
      x: w / 2,
      y: capTop + titleLH * (i + 0.5),
      baseline: 'middle',
      align: 'center',
      size: titleFS,
      weight: cfg.caption.title.weight,
      color: cfg.caption.color,
      maxWidth: capW,
    });
  });
  const artistTop = capTop + titleLines.length * titleLH + artistMargin;
  artistLines.forEach((line, i) => {
    drawText(ctx, line, {
      x: w / 2,
      y: artistTop + artistLH * (i + 0.5),
      baseline: 'middle',
      align: 'center',
      size: artistFS,
      weight: cfg.caption.artist.weight,
      color: cfg.caption.color,
      maxWidth: capW,
    });
  });
  ctx.restore();
  drawCenteredWatermark(ctx, {
    cfg: cfg.watermark,
    cx: w / 2,
    cy: h - cfg.watermark.edge * s - (cfg.watermark.mark * s) / 2,
    s,
    logo,
  });
}

function paintNeon(ctx, w, h, s, song, photo, logo, cfg, frame) {
  const { t = 0, still = true, levels = null } = frame || {};
  paintBackdrop(ctx, w, h, s, song, photo, cfg.backdrop, kenBurnsScale(cfg.anim, t, still));

  // Duotone — mix-blend-mode: color over the photo only, so it runs before any
  // of the foreground and the context restores the blend mode.
  ctx.save();
  ctx.globalCompositeOperation = cfg.duotone.blend;
  ctx.fillStyle = cssLinearGradient(ctx, cfg.duotone.gradient, 0, 0, w, h) || cfg.duotone.fallback;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  drawWatermark(ctx, { ...watermarkArgs(cfg.watermark, w, h, s), logo });

  // Equalizer — bars sitting on the eq baseline, growing upward. In motion
  // they dance to the track's real band levels (or a synthetic stand-in when
  // there is no audio); the still frame keeps the authored heights.
  const barW = cfg.eq.width * s;
  const gap = cfg.eq.gap * s;
  const total = cfg.eq.heights.length * barW + (cfg.eq.heights.length - 1) * gap;
  const baseY = h - cfg.eq.bottom * h;
  const heights = eqHeightsAt(cfg.anim, levels, t, still, cfg.eq.heights);
  let x = (w - total) / 2;
  ctx.fillStyle = cfg.eq.color;
  for (const value of heights) {
    const bh = value * s;
    ctx.fillRect(x, baseY - bh, barW, bh);
    x += barW + gap;
  }

  // Title — centred, with the text-shadow glow. It may wrap upward only as far
  // as the equalizer's baseline above it.
  const titleFS = cfg.title.size * s;
  const titleLH = titleFS * cfg.title.lineHeight;
  const titleBottom = h - cfg.title.bottom * h;
  const maxTitleLines = Math.max(1, Math.floor((titleBottom - baseY) / titleLH));
  const titlePadX = cfg.title.padX * s;
  ctx.save();
  ctx.font = `${cfg.title.weight} ${titleFS}px ${FONT_STACK}`;
  const lines = wrapText(ctx, song.title, w - titlePadX * 2, maxTitleLines);
  ctx.restore();
  // Entrance: the title fades up while its neon glow blooms in.
  const titleP = entranceP(cfg.anim, t, still);
  ctx.save();
  ctx.globalAlpha = titleP;
  lines.forEach((line, i) => {
    drawText(ctx, line, {
      x: w / 2,
      y: titleBottom - titleLH * (lines.length - 1 - i),
      baseline: 'bottom',
      align: 'center',
      size: titleFS,
      weight: cfg.title.weight,
      letterSpacing: cfg.title.letterSpacing,
      color: cfg.title.color,
      maxWidth: w - titlePadX * 2,
      shadow: { blur: cfg.title.shadowBlur * s * titleP, color: cfg.title.shadowColor },
    });
  });
  ctx.restore();

  // Watermark strip. In motion it is a single-line marquee scrolling left at
  // one `strip.text` width per loop (any self-repeating string tiles seamlessly
  // at its own full width). The still frame keeps the wrapped, centred strip it
  // has always exported.
  const stripFS = cfg.strip.size * s;
  const stripLH = stripFS * cfg.strip.lineHeight;
  const stripPad = cfg.strip.padY * s;
  const stripText = fillText(cfg.strip.text, song);
  ctx.save();
  ctx.font = `${cfg.strip.weight} ${stripFS}px ${FONT_STACK}`;
  if (still) {
    const stripLines = wrapText(ctx, stripText, w, Math.max(1, Math.floor((0.1 * h) / stripLH)));
    ctx.restore();
    const stripH = stripPad * 2 + stripLines.length * stripLH;
    ctx.fillStyle = cfg.strip.bg;
    ctx.fillRect(0, h - stripH, w, stripH);
    const stripTop = h - stripH + stripPad;
    stripLines.forEach((line, i) => {
      drawText(ctx, line, {
        x: w / 2,
        y: stripTop + stripLH * (i + 0.5),
        baseline: 'middle',
        align: 'center',
        size: stripFS,
        weight: cfg.strip.weight,
        color: cfg.strip.color,
        letterSpacing: cfg.strip.letterSpacing,
        maxWidth: w,
      });
    });
    return;
  }
  if ('letterSpacing' in ctx) ctx.letterSpacing = cfg.strip.letterSpacing || '0px';
  const loopW = ctx.measureText(stripText).width || w;
  const off = marqueeOffsetFrac(cfg.anim, t, still) * loopW;
  const stripH = stripPad * 2 + stripLH;
  ctx.fillStyle = cfg.strip.bg;
  ctx.fillRect(0, h - stripH, w, stripH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, h - stripH, w, stripH);
  ctx.clip();
  for (let sx = -off; sx < w; sx += loopW) {
    drawText(ctx, stripText, {
      x: sx,
      y: h - stripH / 2,
      baseline: 'middle',
      size: stripFS,
      weight: cfg.strip.weight,
      color: cfg.strip.color,
      letterSpacing: cfg.strip.letterSpacing,
    });
  }
  ctx.restore();
  ctx.restore();
}

function paintCollage(ctx, w, h, s, song, photo, logo, cfg, frame) {
  const { t = 0, still = true } = frame || {};
  const pad = cfg.pad * s;
  const gap = cfg.gap * s;
  const cols = cfg.cols;
  const rows = cfg.rows;
  const tileW = (w - pad * 2 - gap * (cols - 1)) / cols;
  const tileH = (h - pad * 2 - cfg.bottomReserve * s - gap * (rows - 1)) / rows;
  const kb = kenBurnsScale(cfg.anim, t, still);

  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < cols * rows; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (tileW + gap);
    const y = pad + row * (tileH + gap);
    // Entrance: each tile pops in (scale + fade), staggered reading order.
    const { scale, alpha } = popScale(cfg.anim, t, i, still);
    const tw = tileW * scale;
    const th = tileH * scale;
    const tx = x + (tileW - tw) / 2;
    const ty = y + (tileH - th) / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(tx, ty, tw, th);
    ctx.clip();
    if (photo) {
      const cw = tw * kb;
      const ch = th * kb;
      drawCover(ctx, photo, tx + (tw - cw) / 2, ty + (th - ch) / 2, cw, ch);
    } else {
      ctx.fillStyle = cssLinearGradient(ctx, song?.gradient, tx, ty, tw, th) || '#191919';
      ctx.fillRect(tx, ty, tw, th);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = cfg.tile.border;
    ctx.lineWidth = cfg.tile.borderWidth * s;
    const inset = (cfg.tile.borderWidth / 2) * s;
    ctx.strokeRect(tx + inset, ty + inset, tw - inset * 2, th - inset * 2);
    ctx.restore();
  }

  paintScrim(ctx, w, h, cfg.scrim);

  // The caption bar arrives after the last tile has popped.
  const capP = entranceP(
    cfg.anim,
    t - cols * rows * (cfg.anim?.stagger ?? 0) - 0.15,
    still,
  );
  ctx.save();
  ctx.globalAlpha = capP;
  const barH = cfg.bar.height * s;
  const barY = h - barH;
  ctx.fillStyle = cfg.bar.bg;
  ctx.fillRect(0, barY, w, barH);

  // Brand lockup centred in the bar.
  drawCenteredWatermark(ctx, {
    cfg: cfg.brand,
    cx: w / 2,
    cy: barY + (cfg.brand.y + cfg.brand.mark / 2) * s,
    s,
    logo,
  });

  ctx.restore();
}

const PAINTERS = {
  clean: paintClean,
  meme: paintMeme,
  vinyl: paintVinyl,
  neon: paintNeon,
  collage: paintCollage,
};

/* ------------------------------------------------------------------ public */

/**
 * Prepare a story template for drawing: loads fonts, the photo and the logo
 * once, then hands back a canvas plus a `draw(t, { levels, still })` that
 * paints one frame. Both exporters use it — the PNG still and every frame of
 * the MP4.
 *
 * @param {object} opts
 * @param {{title: string, artist: string, gradient?: string}} opts.song
 * @param {string} [opts.templateId] clean | meme | vinyl | neon | collage
 * @param {string|null} [opts.uploadedImage] data URL of the user's photo
 * @param {number} [opts.width] frame width (height follows the 9:16 frame)
 * @returns {Promise<{canvas: HTMLCanvasElement, draw: Function}>}
 */
export async function prepareStoryPainter({
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
  const cfg = templates[templateId] || templates.clean;
  const logo = await loadLogo();

  return {
    canvas,
    /**
     * Paint the frame at `t` seconds. `still` freezes entrance animations and
     * loop phases (the PNG export); `levels` are the audio band levels from
     * storyMotion.levelsForPcm (null → synthetic stand-in for the EQ).
     */
    draw(t = 0, { levels = null, still = false } = {}) {
      ctx.clearRect(0, 0, width, height);
      paint(ctx, width, height, s, song, photo, logo, cfg, { t, still, levels });
    },
  };
}

/**
 * Render one story template to a PNG blob at 9:16 — the settled still frame of
 * the same motion the video export animates.
 *
 * @param {object} opts see `prepareStoryPainter`
 * @returns {Promise<Blob>}
 */
export async function renderStoryImage(opts = {}) {
  const { canvas, draw } = await prepareStoryPainter(opts);
  draw(0, { still: true });

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
