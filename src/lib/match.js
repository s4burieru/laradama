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
  if (track.f1) return `f1 · ${track.f1}`; // the pool tag is the point of the card
  if (track.brainrot) return `brainrot · ${track.brainrot}`; // the pool tag is the point of the card
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
  const tracks = await findTracks(analysis, { exclude: seenKeys, batch, playlist: analysis.playlist });
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
    const timer = setTimeout(() => ctrl.abort(), 6000); // the deck is waiting on this
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

/** Tries each model once — the rerank is optional, so any failure
 *  just means the deck keeps its default order. VISION_MODELS leads with the
 *  quick model because this is a small pick-one-of-ten call the user is
 *  waiting on before the deck appears, and `findTracks` has already ranked the
 *  candidates by photo fit anyway. */
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

  const t0 = Date.now();
  const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;
  for (const model of VISION_MODELS) {
    const pick = await rerankOnce(model, text, tracks);
    if (pick) {
      console.debug(`[vision] rerank ${secs(Date.now() - t0)} (${model})`);
      return pick;
    }
  }
  console.debug(`[vision] rerank skipped after ${secs(Date.now() - t0)}`);
  return null;
}

/**
 * Custom scan, cheapest stage first:
 *   1. perceptual hash against the entry's reference images (offline)
 *   2. identity check — the vision layer's own request, fast model first and
 *      verdict-cached, so only a genuinely new photo pays for it
 * Hash hits skip Gemini entirely — they only need local color analysis for the
 * card's palette and "why" text.
 *
 * Resolves as soon as the MOOD profile is back and hands the still-pending
 * identity verdict over as `entryP` (a Promise of the pinned entry, never a
 * rejection), so matchImageToTracks can search for tracks *in parallel with*
 * the face check instead of queueing behind it. The decision is still logged
 * exactly once, with full evidence, when identity lands.
 */
async function detectCustomScan(dataUrl) {
  const hashHit = await checkHash(dataUrl);
  if (hashHit) {
    console.debug(`[custom-scan] hash hit → "${hashHit.entry.id}" (distance ${hashHit.distance}/64)`);
    return { method: 'hash', entryP: Promise.resolve(hashHit.entry), analysis: await analyzeImageLocal(dataUrl) };
  }

  const analysis = await analyzeImage(dataUrl); // mood only — identity rides along
  const identityP = analysis.identity || Promise.resolve(null);
  delete analysis.identity; // keep the analysis object plain for everything downstream

  const entryP = identityP.then((identity) => {
    // With reference photos, identity alone decides; without them the mood
    // call itself reported a customId from the keywords/description.
    const customId = identity ? (identity.status === 'hit' ? identity.id : '') : analysis.customId;
    if (identity) {
      const label =
        identity.status === 'hit'
          ? `face match ${Number(identity.confidence).toFixed(2)} — ${identity.why || 'no differences'}`
          : `identity ${identity.status}${identity.why ? ` — ${identity.why}` : ''}`;
      analysis.customEvidence = identity.cached ? `${label} [cached]` : label;
      analysis.customId = customId;
    }
    const entry = customId ? entryById(customId) : null;
    console.debug(
      `[custom-scan] no hash hit → vision source="${analysis.source}" customId="${customId || 'none'}"` +
        `${analysis.customEvidence ? ` (${analysis.customEvidence})` : ''} ` +
        `→ ${entry ? `pinned "${entry.id}"` : 'no custom match (mood pipeline)'}`,
    );
    return entry || null;
  });

  return { method: 'ai', entryP, analysis };
}

/** Card for a pinned entry: exact title/artist, Spotify id, entry's own "why".
 *  Exported so scripts/smoke-test.mjs can exercise it without a browser. */
export async function pinnedSong(entry, method, analysis) {
  // The card is always credited to entry.title / entry.artist; when the
  // original has no free preview, entry.audio names the recording that
  // actually supplies the playable clip (see customMatches.js item 9).
  const source = entry.audio || { title: entry.title, artist: entry.artist };
  const found = await findTrackForTitle(source.title, source.artist);
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
  const { method, entryP, analysis } = await detectCustomScan(dataUrl);

  // Track search needs the mood profile plus, when a pinned entry exists, its
  // `playlist` hint so the deck follows the confirmed subject's pool. The
  // identity call piggybacks on the mood call in detectCustomScan, so waiting
  // for the verdict costs at most one small round-trip.
  const entry = await entryP;
  if (entry?.playlist) analysis.playlist = entry.playlist; // refill path reads this back
  const pinnedP = entry ? pinnedSong(entry, method, analysis) : Promise.resolve(null);
  const tracks = await findTracks(analysis, { playlist: entry?.playlist });
  const pinned = await pinnedP;
  if (!tracks.length) return { analysis, songs: pinned ? [pinned] : [] };

  // A pinned card already owns card #1 and findTracks has already ranked the
  // rest by photo fit, so a scan skips this extra call entirely; normal photos
  // keep the rerank and its "Why this song?" line.
  const pick =
    analysis.source === 'gemini' && !pinned ? await rerankWithGemini(analysis, tracks) : null;
  const bestIndex = pick?.bestIndex ?? 0;
  const ordered = [tracks[bestIndex], ...tracks.filter((_, i) => i !== bestIndex)];

  const moodSongs = ordered.map((t, i) =>
    cardFor(analysis, t, i === 0 && pick?.trackWhy ? pick.trackWhy : fallbackWhy(analysis, t)),
  );

  // A pinned card already owns that song — never let the mood deck repeat it.
  const songs = pinned
    ? moodSongs.filter(
        (s) =>
          `${s.title.toLowerCase()}::${s.artist.toLowerCase()}` !==
          `${pinned.title.toLowerCase()}::${pinned.artist.toLowerCase()}`,
      )
    : moodSongs;

  const urls = await Promise.all(songs.map((s) => resolveSpotifyTrack(s.title, s.artist)));
  songs.forEach((s, i) => {
    s.spotifyUrl = urls[i] || '';
  });

  return { analysis, songs: pinned ? [pinned, ...songs] : songs };
}
