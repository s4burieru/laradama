/**
 * Custom-scan layer — recognizes an upload as one of the pinned entries in
 * `src/data/customMatches.js` so it can be matched to a specific song.
 *
 * Two stages, cheapest first:
 *   1. perceptual hash (dHash) against an entry's `refImages` — offline, free,
 *      catches each exact file plus near-duplicates, mirrored and lightly
 *      re-cropped copies of it. A DIFFERENT photo of the same person never
 *      matches here — that is stage 2's job.
 *   2. identity check — vision.js sends the upload plus the entry's reference
 *      photos to Gemini in a dedicated call that describes both faces and
 *      writes the differences down before answering; only a confident
 *      "same person" pins the card. Entries with keywords but no refImages
 *      fall back to description/keyword recognition inside the mood call.
 *
 * Everything degrades gracefully: no entries, no ref images, no network and no
 * API key all simply mean "no custom match" — the normal mood pipeline runs.
 */

import { customMatches } from '../data/customMatches.js';

const DEFAULT_DISTANCE = 12; // max differing bits out of 64

/** Entries actually configured (id + title required to be usable). */
export function activeEntries() {
  return (customMatches || []).filter((e) => e && e.id && e.title);
}

export function entryById(id) {
  if (!id) return null;
  return activeEntries().find((e) => e.id === id) || null;
}

/** Hamming distance between two fixed-length hex hash strings. */
export function hamming(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      diff += x & 1;
      x >>= 1;
    }
  }
  return diff;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

/**
 * Perceptual-hash variants of every reference, so a repost that was mirrored
 * or re-framed still lands:
 *   base   — the file itself (and near-duplicates / re-encodes of it)
 *   hflip  — the same photo mirrored left/right
 *   vflip  — the same photo mirrored top/bottom
 *   crop   — the centre 80% (light re-crop / re-frame)
 *
 * Flips are derived from the already-downscaled 9x8 grid instead of drawing a
 * second time with a canvas transform: re-resampling a mirrored image and
 * mirroring a downscaled image disagree by ~20 bits (measured), which would
 * make every mirrored upload miss. Index arithmetic never disagrees with itself.
 */
const HASH_VARIANTS = {
  base: { hflip: false, vflip: false, crop: false },
  hflip: { hflip: true, vflip: false, crop: false },
  vflip: { hflip: false, vflip: true, crop: false },
  crop: { hflip: false, vflip: false, crop: true },
};

const GRID_W = 9;
const GRID_H = 8;

/** 9x8 luminance grid (row-major, GRID_W per row) of an image or its centre crop. */
function lumGrid(img, { crop = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_W;
  canvas.height = GRID_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const iw = img.naturalWidth || img.width || GRID_W;
  const ih = img.naturalHeight || img.height || GRID_H;
  if (crop) {
    // centre 80% — catches a light re-crop / re-frame of the same picture
    ctx.drawImage(img, iw * 0.1, ih * 0.1, iw * 0.8, ih * 0.8, 0, 0, GRID_W, GRID_H);
  } else {
    ctx.drawImage(img, 0, 0, GRID_W, GRID_H);
  }
  const { data } = ctx.getImageData(0, 0, GRID_W, GRID_H);
  const grid = new Array(GRID_W * GRID_H);
  for (let i = 0; i < grid.length; i++) {
    const p = i * 4;
    grid[i] = Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
  }
  return grid;
}

/**
 * 64-bit difference hash of a grid: a bit whenever a pixel is brighter than
 * its right-hand neighbour (8 comparisons x 8 rows).
 * Horizontal flips are exact here because dHash only looks at horizontal
 * neighbours — mirroring x reverses each row AND inverts every comparison;
 * mirroring y only permutes the rows.
 */
function hashGrid(grid, { hflip = false, vflip = false } = {}) {
  let bits = 0n;
  for (let y = 0; y < GRID_H; y++) {
    const row = vflip ? GRID_H - 1 - y : y;
    for (let x = 0; x < GRID_W - 1; x++) {
      const a = hflip ? GRID_W - 1 - x : x;
      const b = hflip ? GRID_W - 2 - x : x + 1;
      const cur = grid[row * GRID_W + a];
      const next = grid[row * GRID_W + b];
      bits = (bits << 1n) | (cur > next ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

/** All HASH_VARIANTS of one loaded image, keyed by variant name. */
function hashesFromImage(img) {
  const memo = {};
  const full = () => (memo.full ??= lumGrid(img));
  const cropGrid = () => (memo.crop ??= lumGrid(img, { crop: true }));
  const out = {};
  for (const [name, opt] of Object.entries(HASH_VARIANTS)) {
    out[name] = hashGrid(opt.crop ? cropGrid() : full(), { hflip: opt.hflip, vflip: opt.vflip });
  }
  return out;
}

/** The upload only needs its base grid — every variant lives on the ref side.
 *  Exported: it doubles as the identity-verdict cache key in vision.js. */
export const dHashFromDataUrl = async (dataUrl) => hashGrid(lumGrid(await loadImage(dataUrl)));

/** url -> { base, hflip, vflip, crop }, computed once per session. */
const refHashCache = new Map();

async function refHashes(entry, url) {
  const key = `${entry.id}::${url}`;
  if (refHashCache.has(key)) return refHashCache.get(key);
  let hashes = {};
  try {
    hashes = hashesFromImage(await loadImage(url));
  } catch {
    /* unreadable reference image — treat as "no hashes" */
  }
  refHashCache.set(key, hashes);
  return hashes;
}

/**
 * Stage 1. Returns `{ entry, method: 'hash', distance }` for the closest
 * reference match within threshold, or null (no entries / no ref images).
 */
export async function checkHash(dataUrl) {
  const entries = activeEntries().filter((e) => Array.isArray(e.refImages) && e.refImages.length);
  if (!entries.length || !dataUrl) return null;

  let uploadHash;
  try {
    uploadHash = await dHashFromDataUrl(dataUrl);
  } catch {
    return null;
  }

  let best = null;
  for (const entry of entries) {
    const limit = Number.isFinite(entry.hashDistance) ? entry.hashDistance : DEFAULT_DISTANCE;
    for (const url of entry.refImages) {
      const refs = await refHashes(entry, url);
      for (const ref of Object.values(refs)) {
        if (!ref) continue;
        const distance = hamming(uploadHash, ref);
        if (distance <= limit && (!best || distance < best.distance)) {
          best = { entry, method: 'hash', distance };
        }
      }
    }
  }
  return best;
}

/**
 * Stage 2 — entries the vision model can recognize from keywords.
 */
export function recognizableEntries() {
  return activeEntries().filter((e) => (e.keywords || []).length);
}

/**
 * Reference photos worth showing the vision model alongside the upload, so it
 * can compare the PERSON rather than guess from a written description
 * (`{ id, url }`, newest coverage first, capped by the caller).
 */
export function visionRefTargets(limit = 2) {
  return recognizableEntries()
    .flatMap((e) => (e.refImages || []).map((url) => ({ id: e.id, url })))
    .slice(0, Math.max(0, limit));
}

/**
 * A compact block of "recognize this subject" lines that vision.js splices
 * into its existing prompt. Each line carries the entry's keywords plus its
 * `description` — without a visual description the model has nothing to match
 * pixels against, so a photo it has never seen comes back as "none".
 * Empty string when unused.
 */
export function subjectBlock() {
  const entries = recognizableEntries();
  if (!entries.length) return '';
  const lines = entries
    .map((e) => {
      const head = `- "${e.keywords.join('", "')}" -> customId "${e.id}"`;
      return e.description ? `${head}\n  Looks like: ${String(e.description).trim()}` : head;
    })
    .join('\n');
  return `Recognition targets (people/topics, not moods):\n${lines}`;
}
