/**
 * STORY MOTION — the pure math behind every animated story element.
 *
 * Three consumers run these functions so they can never drift apart:
 *
 *   • src/lib/storyImage.js     → the PNG still (drawn with `still: true`)
 *   • src/lib/storyVideo.js     → the 15s MP4 export (real time + real audio)
 *   • src/components/StoryPreview.jsx → the live preview (real time, synthetic
 *     audio levels — the preview can't hear the track, the export can)
 *
 * All motion *numbers* live in the per-template `anim` config in
 * src/data/storyTemplates.js; this file only holds the maths. Everything here
 * is synchronous and dependency-free — safe to call from a render or a frame
 * loop.
 */

/** Clip length the video export renders. Instagram/Facebook stories take it. */
export const STORY_DURATION_S = 15;

/** Frames per second of the video export; also the EQ sampling rate. */
export const STORY_FPS = 30;

const easeOutCubic = (p) => 1 - (1 - p) ** 3;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Entrance progress 0..1 for one element (eased). `t` is seconds since the
 * clip started; subtract a stagger delay before calling to stagger siblings.
 * `still` (the PNG export) always reads 1 — the still frame shows the settled
 * layout, exactly as templates looked before motion existed.
 */
export function entranceP(anim, t, still) {
  const ms = anim?.enter ?? 0;
  if (still || !ms) return 1;
  return easeOutCubic(clamp01((t * 1000) / ms));
}

/** Vinyl spin angle in degrees; the still frame sits at 0 (as it always did). */
export function discAngleDeg(anim, t, still) {
  const rpm = anim?.rpm ?? 0;
  if (still || !rpm) return 0;
  return ((t * rpm) / 60) * 360;
}

/**
 * Ken Burns zoom factor for a photo layer: 1 → 1+kenBurns across the clip.
 * The still frame stays at 1 so the PNG is pixel-identical to the old export.
 */
export function kenBurnsScale(anim, t, still) {
  const kb = anim?.kenBurns ?? 0;
  if (still || !kb) return 1;
  return 1 + kb * clamp01(t / STORY_DURATION_S);
}

/** Marquee phase 0..1 of one loop; the still frame sits at 0. */
export function marqueeOffsetFrac(anim, t, still) {
  const loop = anim?.strip?.loopSeconds ?? 0;
  if (still || !loop) return 0;
  return ((t % loop) / loop);
}

/* ------------------------------------------------------------- audio levels */

// EQ bars map onto three frequency bands (low / mid / high) left → right.
const BAND_MAP = [0, 0, 1, 1, 1, 2, 2];

/**
 * Per-video-frame band energies from a decoded AudioBuffer.
 *
 * Three one-pole filters split each sample into low (<250Hz), mid and high
 * (>2.5kHz) bands — cheap enough for 450 frames of 15s audio, and honest:
 * the bass actually drives the left bars. Output is normalized per band (so a
 * quiet track still dances), floored so bars never collapse, and smoothed so
 * single-sample spikes don't jitter. Returns `{ data, fps, frames }` where
 * `data[i * 3 + band]` is 0..1 — pass the whole object to `eqHeightsAt`.
 */
export function levelsForPcm(audioBuffer, durationS = STORY_DURATION_S, fps = STORY_FPS) {
  const frames = Math.max(1, Math.round(durationS * fps));
  const sr = audioBuffer.sampleRate;
  const channels = [];
  for (let c = 0; c < audioBuffer.numberOfChannels; c += 1) channels.push(audioBuffer.getChannelData(c));
  const perFrame = Math.max(1, Math.round(sr / fps));
  const a250 = 1 - Math.exp((-2 * Math.PI * 250) / sr);
  const a2500 = 1 - Math.exp((-2 * Math.PI * 2500) / sr);

  const raw = new Float32Array(frames * 3);
  let y250 = 0;
  let y2500 = 0;
  const len = audioBuffer.length;
  for (let f = 0; f < frames; f += 1) {
    const start = f * perFrame;
    const end = Math.min(len, start + perFrame);
    let sLow = 0;
    let sMid = 0;
    let sHigh = 0;
    let n = 0;
    for (let i = start; i < end; i += 1) {
      let x = 0;
      for (let c = 0; c < channels.length; c += 1) x += channels[c][i];
      x /= channels.length;
      y250 += a250 * (x - y250);
      y2500 += a2500 * (x - y2500);
      const low = y250;
      const mid = y2500 - y250;
      const high = x - y2500;
      sLow += low * low;
      sMid += mid * mid;
      sHigh += high * high;
      n += 1;
    }
    raw[f * 3] = n ? Math.sqrt(sLow / n) : 0;
    raw[f * 3 + 1] = n ? Math.sqrt(sMid / n) : 0;
    raw[f * 3 + 2] = n ? Math.sqrt(sHigh / n) : 0;
  }

  // Normalize per band against its peak, with a small floor + EMA smoothing.
  for (let b = 0; b < 3; b += 1) {
    let peak = 0;
    for (let f = 0; f < frames; f += 1) peak = Math.max(peak, raw[f * 3 + b]);
    const gain = peak > 1e-6 ? 1 / peak : 0;
    let smooth = 0;
    for (let f = 0; f < frames; f += 1) {
      const v = clamp01(raw[f * 3 + b] * gain);
      smooth = f === 0 ? v : smooth + 0.4 * (v - smooth);
      raw[f * 3 + b] = smooth;
    }
  }
  return { data: raw, fps, frames };
}

/** The same shape as `levelsForPcm`, from three sine waves — the preview's stand-in. */
export function syntheticLevelsAt(t) {
  return {
    data: Float32Array.from([
      0.5 + 0.5 * Math.sin(t * 5.7),
      0.5 + 0.5 * Math.sin(t * 10.7 + 1.2),
      0.5 + 0.5 * Math.sin(t * 19.5 + 2.6),
    ]),
    fps: 0,
    frames: 0,
  };
}

/** One band's level 0..1 at time `t`; `levels` null → synthetic (preview / silent video). */
export function levelAt(levels, t, band, still) {
  if (still) return 0.5;
  const src = levels || syntheticLevelsAt(t);
  if (!src.frames) return clamp01(src.data[band] ?? 0.5);
  const i = Math.min(src.frames - 1, Math.max(0, Math.round(t * src.fps)));
  return clamp01(src.data[i * 3 + band]);
}

/**
 * Dancing EQ bar heights (design px) for `bars` bars. Real audio levels when
 * present, synthetic otherwise; the still frame returns the template's authored
 * `heights` so the PNG keeps its exact pre-motion look.
 */
export function eqHeightsAt(anim, levels, t, still, fallbackHeights) {
  if (still) return fallbackHeights;
  const min = anim?.eq?.min ?? 6;
  const max = anim?.eq?.max ?? 58;
  const out = [];
  for (let j = 0; j < fallbackHeights.length; j += 1) {
    const band = BAND_MAP[j % BAND_MAP.length];
    const v = levelAt(levels, t, band, still);
    const weight = 0.72 + 0.28 * Math.abs(Math.sin(j * 2.4)); // per-bar variation
    out.push(min + (max - min) * (0.15 + 0.85 * v) * weight);
  }
  return out;
}

/**
 * Staggered pop-in for one element of a group (collage tiles, meme bars):
 * `{ scale, alpha }` for element `index`, whose delay is `index * stagger`.
 */
export function popScale(anim, t, index, still) {
  const p = entranceP(anim, t - index * (anim?.stagger ?? 0), still);
  const pop = anim?.tilePop ?? 0.06;
  return { scale: 1 - pop * (1 - p), alpha: p };
}
