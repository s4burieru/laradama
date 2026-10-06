/**
 * Custom-scan layer — recognizes an upload as one of the pinned entries in
 * `src/data/customMatches.js` so it can be matched to a specific song.
 *
 * Two stages, cheapest first:
 *   1. perceptual hash (dHash) against an entry's `refImages` — offline, free,
 *      catches the exact file and near-duplicates/edited copies.
 *   2. subject recognition — handled by the vision layer in vision.js, which
 *      gets the entry keywords injected into its single Gemini call.
 *
 * Everything degrades gracefully: no entries, no ref images, no network and no
 * API key all simply mean "no custom match" — the normal mood pipeline runs.
 */

import { customMatches } from '../data/customMatches.js';

const DEFAULT_DISTANCE = 10; // max differing bits out of 64

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
 * 64-bit difference hash: draw at 9x8 grayscale, set a bit whenever a pixel is
 * brighter than its right-hand neighbour. Returns a 16-char hex string.
 */
function dHashFromImage(img) {
  const w = 9;
  const h = 8;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const lum = (i) => Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  let bits = 0n;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      const cur = lum((y * w + x) * 4);
      const next = lum((y * w + (x + 1)) * 4);
      bits = (bits << 1n) | (cur > next ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

const dHashFromSrc = async (src) => dHashFromImage(await loadImage(src));
const dHashFromDataUrl = async (dataUrl) => dHashFromImage(await loadImage(dataUrl));

/** url -> hash, computed once per session. */
const refHashCache = new Map();

async function refHash(entry, url) {
  const key = `${entry.id}::${url}`;
  if (refHashCache.has(key)) return refHashCache.get(key);
  let hash = null;
  try {
    hash = await dHashFromSrc(url);
  } catch {
    /* unreadable reference image — treat as "no hash" */
  }
  refHashCache.set(key, hash);
  return hash;
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
      const ref = await refHash(entry, url);
      if (!ref) continue;
      const distance = hamming(uploadHash, ref);
      if (distance <= limit && (!best || distance < best.distance)) {
        best = { entry, method: 'hash', distance };
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
 * A compact block of "recognize this subject" lines that vision.js splices
 * into its existing prompt. Empty string when unused.
 */
export function subjectBlock() {
  const entries = recognizableEntries();
  if (!entries.length) return '';
  const lines = entries
    .map((e) => `- "${e.keywords.join('", "')}" -> customId "${e.id}"`)
    .join('\n');
  return `Recognition targets (people/topics, not moods):\n${lines}`;
}
