/**
 * Music layer — finds real, playable tracks for a photo's analysis profile.
 * Two keyless free sources, queried in parallel:
 *   1. Audius   — full-track streams, searched by mood
 *   2. iTunes   — 30-second previews, searched by mood AND by artist name
 * Candidates are ranked against the vision profile's mood/energy/valence with
 * popularity weighted hard: artist-name searches surface well-known acts
 * (international + OPM, see data/popularArtists.js), their credits take a big
 * score boost, and the deck saves slots for them — popularity decides who is
 * in the running, the photo decides who fits.
 */

import { isPopularArtist, popularArtistsFor } from '../data/popularArtists.js';

const APP_NAME = 'laradama';

const GENRE_AFFINITIES = {
  highValenceHighEnergy: ['pop', 'dance', 'edm', 'electronic', 'hip hop', 'rap', 'funk', 'house', 'disco'],
  highValenceLowEnergy: ['acoustic', 'indie', 'folk', 'ambient', 'lofi', 'lo-fi', 'chill', 'jazz', 'soul'],
  lowValenceHighEnergy: ['rock', 'metal', 'industrial', 'techno', 'drum and bass', 'punk', 'trap'],
  lowValenceLowEnergy: ['ambient', 'classical', 'piano', 'post-rock', 'downtempo', 'instrumental', 'sad'],
};

/** How much a curated popular artist (intl + OPM) outranks an obscure mood hit. */
const POPULAR_ARTIST_BOOST = 10;

/** Audius play counts: 1M plays ≈ +4, 10k ≈ +2.8, 100 ≈ +1.4. */
const popularityBoost = (t) => (t.popularity > 0 ? Math.min(4, Math.log10(t.popularity + 1) * 0.7) : 0);

async function fetchJson(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** Merges per-query result rows round-robin so every query gets represented. */
function interleave(rows) {
  const out = [];
  const depth = Math.max(0, ...rows.map((r) => r.length));
  for (let i = 0; i < depth; i++) {
    for (const row of rows) if (row[i]) out.push(row[i]);
  }
  return out;
}

/** `map` with a concurrency cap — both sources throttle bursts, so a queue
 *  keeps one slow query from stacking the rest behind it. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return out;
}

/** Audius discovery host (keyless). Returns e.g. "https://discoveryprovider.audius.co" or null. */
async function audiusHost() {
  const cached = audiusHost._h;
  if (cached) return cached;
  try {
    const { data } = await fetchJson('https://api.audius.co', 5000);
    const host = Array.isArray(data) ? data.find((h) => typeof h === 'string' && h.startsWith('https://')) : null;
    if (host) audiusHost._h = host;
    return host;
  } catch {
    return null;
  }
}

async function searchAudius(queries, { max = 12 } = {}) {
  const host = await audiusHost();
  if (!host) return [];
  const jobs = [...new Set(queries.filter(Boolean))];
  const rows = await mapLimit(jobs, 3, async (q) => {
    try {
      const { data } = await fetchJson(`${host}/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=${APP_NAME}`);
      return (data || []).map((t) => {
        const multiArtist = Array.isArray(t.artists)
          ? t.artists.map((a) => a?.name).filter(Boolean).join(', ')
          : '';
        const artist = t.artist_name || multiArtist || t.artist?.name || t.user?.name || 'Unknown';
        return {
          title: String(t.title || '').trim(),
          artist: String(artist).trim(),
          genre: String(t.genre || '').trim(),
          tags: [t.tags, t.mood].filter(Boolean).join(','),
          durationMs: (Number(t.duration) || 0) * 1000,
          popularity: Number(t.play_count) || 0,
          artwork: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
          audioUrl: `${host}/v1/tracks/${t.id}/stream?app_name=${APP_NAME}`,
          pageUrl: '',
          source: 'audius',
        };
      });
    } catch {
      return []; // one bad query must not sink the source
    }
  });
  return interleave(rows).slice(0, max);
}

/**
 * iTunes rate-limits hard: ~45 quick calls in one session earns a 429. Every
 * query result is therefore memoized for the session (re-running the same
 * artist or phrase across batches costs nothing), and a 429 puts fresh calls on
 * hold for a moment instead of hammering a source that is already saying no.
 */
const ITUNES_TTL_MS = 5 * 60 * 1000;
const itunesCache = new Map(); // `${term}::${attribute}` -> { at, rows }
let itunesBusyUntil = 0;

function itunesCached(key, fetchRows) {
  const hit = itunesCache.get(key);
  if (hit && Date.now() - hit.at < ITUNES_TTL_MS) return hit.rows;
  const rows = fetchRows().catch(() => []);
  itunesCache.set(key, { at: Date.now(), rows });
  rows.then((list) => {
    if (!list?.length) itunesCache.delete(key); // failures/empties get retried later
  });
  return rows;
}

/**
 * Queries are either a plain phrase (`"chill lofi sunset"`) or an artist job
 * (`{ term: 'BINI', attribute: 'artistTerm' }`), which resolves to that
 * artist's own catalogue — the route to popular music.
 */
async function searchItunes(queries, { max = 12, perQuery = 10 } = {}) {
  const jobs = [];
  const seenJobs = new Set();
  for (const q of queries) {
    const job = typeof q === 'string' ? { term: q } : q || {};
    const term = String(job.term || '').trim();
    const attribute = String(job.attribute || '').trim();
    if (!term) continue;
    const key = `${term.toLowerCase()}::${attribute}`;
    if (seenJobs.has(key)) continue;
    seenJobs.add(key);
    jobs.push({ term, attribute, key });
  }

  const rows = await mapLimit(jobs, 2, async ({ term, attribute, key }) =>
    itunesCached(key, async () => {
      if (Date.now() < itunesBusyUntil) return []; // cooling down after a 429
      const out = [];
      const attr = attribute ? `&attribute=${attribute}` : '';
      for (const base of ['/api/itunes/search', 'https://itunes.apple.com/search']) {
        try {
          const sep = base.includes('?') ? '&' : '?';
          const json = await fetchJson(
            `${base}${sep}term=${encodeURIComponent(term)}&media=music&entity=song&limit=${perQuery}${attr}`,
          );
          for (const t of json?.results || []) {
            if (!t?.previewUrl) continue;
            out.push({
              title: String(t.trackName || '').trim(),
              artist: String(t.artistName || '').trim(),
              genre: String(t.primaryGenreName || '').trim(),
              tags: '',
              durationMs: Number(t.trackTimeMillis) || 0,
              popularity: 0,
              artwork: (t.artworkUrl100 || '').replace('100x100', '400x400'),
              audioUrl: t.previewUrl,
              pageUrl: t.trackViewUrl || '',
              source: 'itunes',
            });
          }
          return out; // proxy worked (or direct worked) — stop trying bases for this query
        } catch (err) {
          if (String(err?.message || '').startsWith('429')) itunesBusyUntil = Date.now() + 20000;
          /* CORS / network / rate limit — try the other base */
        }
      }
      return out;
    }),
  );

  return interleave(rows).slice(0, max);
}

function affinityBoost(analysis, text) {
  const t = text.toLowerCase();
  const buckets = [];
  if (analysis.valence >= 0.5 && analysis.energy >= 0.5) buckets.push(...GENRE_AFFINITIES.highValenceHighEnergy);
  if (analysis.valence >= 0.5 && analysis.energy < 0.5) buckets.push(...GENRE_AFFINITIES.highValenceLowEnergy);
  if (analysis.valence < 0.5 && analysis.energy >= 0.5) buckets.push(...GENRE_AFFINITIES.lowValenceHighEnergy);
  if (analysis.valence < 0.5 && analysis.energy < 0.5) buckets.push(...GENRE_AFFINITIES.lowValenceLowEnergy);
  return buckets.reduce((acc, g) => acc + (t.includes(g) ? 1.5 : 0), 0);
}

function rankCandidates(analysis, tracks, exclude = new Set()) {
  const keywords = [
    ...analysis.tags,
    ...analysis.genres,
    analysis.mood,
    analysis.scene,
    ...analysis.searchQueries,
  ]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  const uniq = [...new Set(keywords)];

  const seen = new Set();
  const scored = [];
  for (const t of tracks) {
    if (!t.title || !t.audioUrl) continue;
    const key = `${t.title.toLowerCase()}::${t.artist.toLowerCase()}`;
    if (seen.has(key)) continue;
    if (exclude.has(key)) continue; // already shown in the deck → "next" must not repeat it
    seen.add(key);

    const hay = `${t.title} ${t.artist} ${t.genre} ${t.tags}`.toLowerCase();
    let score = uniq.reduce((acc, w) => acc + (hay.includes(w) ? 2 : 0), 0);
    score += affinityBoost(analysis, `${t.genre} ${t.tags} ${t.title}`);
    if (t.source === 'audius') score += 1.5; // full stream beats a 30s preview
    score += popularityBoost(t); // real play counts
    if (isPopularArtist(t.artist)) score += POPULAR_ARTIST_BOOST; // known act over a deep cut
    scored.push({ ...t, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/** Evenly rotates a list so every batch explores a different slice of it. */
const rotate = (arr, n) => {
  if (arr.length < 2) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

/**
 * Cuts the ranked pool down to the swipe deck: best fits first, but never with
 * fewer than `minPopular` popular-artist tracks when the search found any, and
 * never more than `maxPerArtist` songs by the same act — a deck of six tracks
 * by two artists is not a deck of matches. Promotion works from the tail, so
 * the top of the deck keeps its mood-fit order.
 */
function deckFor(ranked, { size = 6, minPopular = 3, maxPerArtist = 2 } = {}) {
  const inDeck = new Set();
  const perArtist = new Map();
  const deck = [];
  const add = (t) => {
    deck.push(t);
    inDeck.add(t);
    perArtist.set(t.artist, (perArtist.get(t.artist) || 0) + 1);
  };
  const drop = (t) => {
    deck.splice(deck.indexOf(t), 1);
    inDeck.delete(t);
    perArtist.set(t.artist, Math.max(0, (perArtist.get(t.artist) || 1) - 1));
  };
  const isPopular = (t) => isPopularArtist(t.artist);
  const popularCount = () => deck.reduce((n, t) => n + (isPopular(t) ? 1 : 0), 0);

  for (const t of ranked) {
    if (deck.length >= size) break;
    if ((perArtist.get(t.artist) || 0) >= maxPerArtist) continue;
    add(t);
  }

  // Popular acts are the priority: trade the deck's weakest slots for them
  // until the quota holds (or the pool runs out of popular candidates).
  while (popularCount() < minPopular) {
    const slot = [...deck].reverse().find((t) => !isPopular(t));
    const promo = ranked.find(
      (t) => !inDeck.has(t) && isPopular(t) && (perArtist.get(t.artist) || 0) < maxPerArtist,
    );
    if (!slot || !promo) break;
    drop(slot);
    add(promo);
  }

  // Still short (a thin pool, one act owning the results)? Relax the per-artist
  // cap rather than hand the deck back half empty.
  if (deck.length < size) {
    for (const t of ranked) {
      if (deck.length >= size) break;
      if (inDeck.has(t)) continue;
      add(t);
    }
  }
  return deck;
}

/**
 * Returns a deck of playable candidates (may be empty — caller falls back to mock songs).
 *
 * `batch` is what keeps "next track" unlimited: batch 0 is the plain search,
 * every later batch rotates the mood queries AND the artist list, digs deeper
 * into each source, and drops everything in `exclude` — the tracks the deck has
 * already shown — so each press of Next returns songs that have not been played
 * yet. Both sources are hit in parallel; iTunes is also searched by artist name
 * (international + OPM) so the deck is stocked with popular music, not only
 * deep mood-fit cuts.
 */
export async function findTracks(analysis, { exclude = [], batch = 0 } = {}) {
  const seen = new Set(exclude.map((k) => String(k || '').toLowerCase()));
  const later = batch > 0;

  // Audius full-text search is strict: keep queries to <=2 words or it returns almost nothing.
  const shortWords = (s) => String(s || '').trim().split(/\s+/).slice(0, 2).join(' ');
  const audiusWords = [
    ...new Set(
      [...(analysis.tags || []), ...(analysis.genres || []), analysis.scene, analysis.mood]
        .map(shortWords)
        .filter(Boolean),
    ),
  ];
  const audiusPool = rotate(audiusWords, batch);
  const audiusQueries = [
    ...new Set(
      [
        ...audiusPool.slice(0, 3),
        // later batches also pair a rotating keyword with the mood → fresh hits
        ...(later ? audiusPool.slice(0, 2).map((w) => shortWords(`${w} ${analysis.mood || ''}`)) : []),
        ...(later ? audiusPool.slice(-2) : []),
      ].filter(Boolean),
    ),
  ].slice(0, later ? 5 : 3);

  // iTunes tolerates full phrases — mood depth for the swipe pool. Phrases take
  // fewer slots than they used to: the rest of iTunes' (rate-limited) request
  // budget is spent on artist names instead.
  const phrasePool = rotate(
    (analysis.searchQueries?.length ? analysis.searchQueries : [analysis.mood])
      .concat((analysis.genres || []).map((g) => `${analysis.mood} ${g}`))
      .map((q) => String(q || '').trim())
      .filter(Boolean),
    batch,
  );
  const genrePhrases = (analysis.genres || []).map((g) => String(g || '').trim()).filter(Boolean);
  const phraseQueries = later
    ? [...new Set([...phrasePool, ...genrePhrases, String(analysis.mood || '').trim()].filter(Boolean))].slice(0, 3)
    : phrasePool.slice(0, 2);

  // Popular artists (OPM + international) picked for this photo's energy and
  // valence, rotated per batch so refills keep meeting new acts. `artistTerm`
  // resolves to that artist's own catalogue — this is what turns a deck of
  // obscure mood hits into songs people actually know.
  const artistQueries = popularArtistsFor(analysis, { batch, limit: 3 }).map((a) => ({
    term: a.name,
    attribute: 'artistTerm',
  }));

  // Later batches scan deeper (more results per query) so excluding the tracks
  // already on screen still leaves plenty of unseen candidates behind.
  const depth = later ? { max: 30, perQuery: 25 } : { max: 12, perQuery: 10 };

  const [audius, moodHits, artistHits] = await Promise.all([
    searchAudius(audiusQueries, { max: depth.max }),
    searchItunes(phraseQueries, depth),
    searchItunes(artistQueries, { max: artistQueries.length * 6, perQuery: 6 }),
  ]);

  return deckFor(rankCandidates(analysis, [...audius, ...moodHits, ...artistHits], seen));
}

function tokens(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Fraction of `needle` tokens found in `hay`. 0 when either side is empty. */
function tokenScore(hay, needle) {
  const A = new Set(tokens(hay));
  const B = tokens(needle);
  if (!A.size || !B.length) return 0;
  return B.filter((w) => A.has(w)).length / B.length;
}

/**
 * Lookup for a pinned custom-scan track. Searches both sources by title, then
 * gates hard on title AND artist similarity so a same-named song by somebody
 * else is never played. Returns the best playable candidate or null — the
 * caller then keeps the card's default player.
 */
export async function findTrackForTitle(title, artist) {
  const target = String(title || '').trim();
  if (!target) return null;
  const who = String(artist || '').trim();

  const candidates = [
    ...(await searchAudius([target])),
    ...(await searchItunes(who ? [`${target} ${who}`, target] : [target])),
  ];

  const seen = new Set();
  const scored = [];
  for (const t of candidates) {
    if (!t.title || !t.audioUrl) continue;
    const key = `${t.title.toLowerCase()}::${t.artist.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const titleSim = tokenScore(t.title, target);
    if (titleSim < 0.8) continue; // not actually this song
    const artistSim = who ? tokenScore(t.artist, who) : 1;
    if (artistSim < 0.5) continue; // right title, wrong artist → never play it

    let score = titleSim * 3 + artistSim * 3;
    if (t.source === 'audius') score += 1.5; // full stream beats a 30s preview
    score += popularityBoost(t); // same act, several uploads → the heard-one wins
    scored.push({ ...t, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}
