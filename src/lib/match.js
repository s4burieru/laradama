/**
 * Match orchestrator: photo → vision profile → real tracks → song-card objects
 * shaped exactly like the original mock `songs` array in Hero.jsx
 * ({ title, artist, tag, gradient, why }) plus audioUrl/spotifyUrl for playback
 * and the "Listen on Spotify" button. Everything runs on free tiers.
 */

import { analyzeImage, analyzeImageLocal, VISION_MODELS } from './vision.js';
import { findTracks, findTrackForTitle } from './music.js';
import { resolveSpotifyTrack } from './spotify.js';
import { checkHash, entryById } from './customMatch.js';

const RERANK_SCHEMA = {
  type: 'object',
  properties: {
    bestIndex: { type: 'number' },
    trackWhy: { type: 'string' },
  },
  propertyOrdering: ['bestIndex', 'trackWhy'],
};

function gradientFrom(palette) {
  const [a, b] = palette || [];
  if (a && b) return `linear-gradient(135deg,${a},${b})`;
  if (a) return `linear-gradient(135deg,${a},#121212)`;
  return 'linear-gradient(135deg,#FF9A5A,#E8497A)';
}

function tagFor(analysis, track) {
  const head = (analysis.tags[0] || analysis.mood).toLowerCase();
  const genre = String(track.genre || '').split(/[/,·|]+/)[0].trim().toLowerCase();
  return genre && genre !== head ? `${head} · ${genre}` : head;
}

function fallbackWhy(analysis, track) {
  const genre = String(track.genre || '').split(/[/,·|]+/)[0].trim() || 'sound';
  const pace = analysis.energy > 0.65 ? 'high-energy' : analysis.energy > 0.4 ? 'steady' : 'laid-back';
  return `This <b>${genre}</b> pick carries a <b>${pace}</b> pace that mirrors your photo's <b>${analysis.mood}</b> tone.`;
}

/** Card object shaped like the original mock `songs` entry in Hero.jsx. */
function cardFor(analysis, track, detail) {
  const photoWhy = analysis.photoWhy ? `${analysis.photoWhy} ` : '';
  return {
    title: track.title,
    artist: track.artist,
    tag: tagFor(analysis, track),
    gradient: gradientFrom(analysis.palette),
    why: `${photoWhy}${detail}`,
    audioUrl: track.audioUrl || '',
    spotifyUrl: '',
  };
}

/**
 * Refills the deck for a photo that was already analyzed — what powers an
 * unlimited "next track". `seenKeys` are the cards already on screen (same
 * `${title}::${artist}` shape as the music layer's dedupe keys), so every call
 * returns tracks the user has not been shown yet. Resolves to `[]` when the
 * free sources run dry for that profile.
 */
export async function findMoreSongs(analysis, seenKeys, batch = 1) {
  if (!analysis) return [];
  const tracks = await findTracks(analysis, { exclude: seenKeys, batch });
  if (!tracks.length) return [];

  const songs = tracks.map((t) => cardFor(analysis, t, fallbackWhy(analysis, t)));
  const urls = await Promise.all(songs.map((s) => resolveSpotifyTrack(s.title, s.artist)));
  songs.forEach((s, i) => {
    s.spotifyUrl = urls[i] || '';
  });
  return songs;
}

/** One extra (free-tier) Gemini call: pick the best candidate and explain the match. */
async function rerankOnce(model, text, tracks) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let res;
    try {
      res = await fetch(`/api/gemini/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
            responseSchema: RERANK_SCHEMA,
          },
        }),
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return null; // busy / unconfigured / offline → skip, try next model
    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    if (!raw) return null;
    const clean = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);
    const idx = Math.min(tracks.length - 1, Math.max(0, Math.trunc(Number(parsed.bestIndex)) || 0));
    return { bestIndex: idx, trackWhy: String(parsed.trackWhy || '').trim() };
  } catch {
    return null;
  }
}

/** Tries each vision model once — the rerank is optional, so any failure
 *  just means the deck keeps its default order. */
async function rerankWithGemini(analysis, tracks) {
  const list = tracks
    .map((t, i) => `${i}. ${t.title} — ${t.artist}${t.genre ? ` [${t.genre}]` : ''}`)
    .join('\n');
  const text = `A photo was analyzed for an image-to-music app.
Photo profile: mood "${analysis.mood}", scene "${analysis.scene || 'unknown'}", energy ${analysis.energy}, valence ${analysis.valence}, tags: ${analysis.tags.join(', ')}.
Candidate tracks:
${list}

Pick the single best musical match for this photo. Respond ONLY as JSON:
{"bestIndex": <0-based number within the list>, "trackWhy": "1-2 sentences for a 'Why this song?' panel explaining why THIS track fits THIS photo. Reference both the track's character and the photo's mood. Wrap 2-3 key phrases in <b> tags. No other HTML."}`;

  for (const model of VISION_MODELS) {
    const pick = await rerankOnce(model, text, tracks);
    if (pick) return pick;
  }
  return null;
}

/**
 * Custom scan, cheapest stage first:
 *   1. perceptual hash against the entry's reference images (offline)
 *   2. subject recognition, returned by the vision call that runs anyway
 * Hash hits skip Gemini entirely — they only need local color analysis for the
 * card's palette and "why" text.
 */
async function detectCustomScan(dataUrl) {
  const hashHit = await checkHash(dataUrl);
  if (hashHit) {
    return { entry: hashHit.entry, method: 'hash', analysis: await analyzeImageLocal(dataUrl) };
  }
  const analysis = await analyzeImage(dataUrl);
  const entry = analysis.customId ? entryById(analysis.customId) : null;
  return { entry: entry || null, method: entry ? 'ai' : null, analysis };
}

/** Card for a pinned entry: exact title/artist, Spotify id, entry's own "why".
 *  Exported so scripts/smoke-test.mjs can exercise it without a browser. */
export async function pinnedSong(entry, method, analysis) {
  const found = await findTrackForTitle(entry.title, entry.artist);
  const photoWhy = analysis.photoWhy ? `${analysis.photoWhy} ` : '';
  let spotifyUrl = '';
  if (entry.spotifyId) {
    spotifyUrl = `https://open.spotify.com/track/${entry.spotifyId}`;
  } else if (found) {
    spotifyUrl = (await resolveSpotifyTrack(found.title, found.artist)) || '';
  }
  return {
    title: entry.title,
    artist: String(entry.artist || found?.artist || '').trim(),
    tag: String(entry.tag || analysis.tags[0] || analysis.mood || 'custom match'),
    gradient: gradientFrom(analysis.palette),
    why: `${photoWhy}${entry.why || fallbackWhy(analysis, found || {})}`,
    audioUrl: found?.audioUrl || '',
    spotifyUrl,
    spotifyId: entry.spotifyId || '',
    custom: { subject: entry.subject || entry.title, method },
  };
}

/**
 * Full pipeline. Never throws — on any failure it resolves with `songs: []`
 * and Hero falls back to the original mock songs, so the UI keeps working.
 * Custom scans (if recognized) are pinned as the first card, mood-matched
 * songs follow behind it; no match means today's behavior exactly.
 * @returns {Promise<{analysis: object, songs: Array}>}
 */
export async function matchImageToTracks(dataUrl) {
  const { entry, method, analysis } = await detectCustomScan(dataUrl);
  const pinned = entry ? await pinnedSong(entry, method, analysis) : null;

  const tracks = await findTracks(analysis);
  if (!tracks.length) return { analysis, songs: pinned ? [pinned] : [] };

  const pick =
    analysis.source === 'gemini' ? await rerankWithGemini(analysis, tracks) : null;
  const bestIndex = pick?.bestIndex ?? 0;
  const ordered = [tracks[bestIndex], ...tracks.filter((_, i) => i !== bestIndex)];

  const moodSongs = ordered.map((t, i) =>
    cardFor(analysis, t, i === 0 && pick?.trackWhy ? pick.trackWhy : fallbackWhy(analysis, t)),
  );

  const urls = await Promise.all(moodSongs.map((s) => resolveSpotifyTrack(s.title, s.artist)));
  moodSongs.forEach((s, i) => {
    s.spotifyUrl = urls[i] || '';
  });

  return { analysis, songs: pinned ? [pinned, ...moodSongs] : moodSongs };
}
