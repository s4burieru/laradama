// ============================================================================
// BRAINROT TRACK POOL — the meme-music lever in src/lib/music.js
// ----------------------------------------------------------------------------
// Viral brainrot cuts: Italian brainrot (Tralalero Tralala…), TikTok meme
// songs (6 7, Sigma, Skibidi…) and Pinoy novelty hits (Budots, Kaloka…).
// The matcher only reaches for these when the photo's vibe can carry one —
// see brainrotEligible() — so a quiet photo never gets handed Tralalero.
//
// `energy` / `valence` describe each track on the same 0..1 scale the vision
// profile uses: brainrotFor() hands the search the entries whose mood fits the
// photo, exactly like the popular-artist pool hands over artists.
//
// Every title/artist pair below was verified against the iTunes Search API
// (`?term=<title>+<artist>&entity=song`) for a playable 30s preview. Re-check
// the whole pool with `node scripts/smoke-test.mjs --pool` — it prints each
// entry's resolved preview or `null` when iTunes dropped one (swap it out).
//
// TO REFRESH: keep the three `flavor` slices roughly even, keep energy/valence
// honest, and re-run the smoke test. Order does not matter — the picker sorts
// by mood distance and rotates per batch, so "next track" keeps meeting new
// entries.
// ============================================================================

export const brainrotTracks = [
  // --- Italian brainrot ---
  { title: 'Tralalero Tralala', artist: 'Gazan', flavor: 'italian', energy: 0.9, valence: 0.85 },
  { title: 'Bombardiro Crocodilo', artist: 'Gazan', flavor: 'italian', energy: 0.9, valence: 0.8 },
  { title: 'Ballerina Cappuccina', artist: 'AtilaKw', flavor: 'italian', energy: 0.85, valence: 0.9 },
  { title: 'Lirilì Larilà', artist: 'R3LAX', flavor: 'italian', energy: 0.85, valence: 0.8 },
  { title: 'Chimpanzini Bananini', artist: 'Beaver Boys', flavor: 'italian', energy: 0.85, valence: 0.9 },
  { title: 'Bombombini Gusini', artist: 'R3LAX', flavor: 'italian', energy: 0.9, valence: 0.85 },
  { title: 'Cappuccino Assassino', artist: 'VanMilli', flavor: 'italian', energy: 0.8, valence: 0.75 },
  { title: 'Tung Tung Tung Sahur (Italian Brainrot)', artist: 'W&W', flavor: 'italian', energy: 0.95, valence: 0.85 },
  { title: 'Frigo Camelo', artist: 'DJ Tralalero Tralala', flavor: 'italian', energy: 0.85, valence: 0.8 },

  // --- International meme ---
  { title: '6 7', artist: 'The Memix', flavor: 'meme', energy: 0.9, valence: 0.85 },
  { title: 'Sigma Boy', artist: 'Betsy', flavor: 'meme', energy: 0.85, valence: 0.8 },
  { title: 'Sigma', artist: 'Tevvez', flavor: 'meme', energy: 0.85, valence: 0.65 },
  { title: 'Skibidi Toilet', artist: 'Lil Big Stack', flavor: 'meme', energy: 0.85, valence: 0.8 },
  { title: 'Skibidi Dop Yes Yes Yes Phonk', artist: 'Skibidi Toilet', flavor: 'meme', energy: 0.9, valence: 0.75 },
  { title: 'Astronomia', artist: 'Vicetone', flavor: 'meme', energy: 0.85, valence: 0.7 },
  { title: 'Raining Tacos', artist: 'Parry Gripp', flavor: 'meme', energy: 0.65, valence: 0.9 },
  { title: 'Sneaky Snitch', artist: 'Kevin MacLeod', flavor: 'meme', energy: 0.55, valence: 0.7 },
  { title: 'PPAP (Pen Pineapple Apple Pen)', artist: 'PIKOTARO', flavor: 'meme', energy: 0.7, valence: 0.85 },

  // --- OPM / Pinoy novelty ---
  { title: 'Kaloka', artist: 'Donkgedank', flavor: 'opm', energy: 0.8, valence: 0.9 },
  { title: 'Walang Imposible', artist: 'MC Shady', flavor: 'opm', energy: 0.75, valence: 0.8 },
  { title: 'Paro Paro G', artist: 'DJ Sandy', flavor: 'opm', energy: 0.95, valence: 0.9 },
  { title: 'Budots (Mix No. 1)', artist: 'Mr. Budots', flavor: 'opm', energy: 0.95, valence: 0.85 },
  { title: 'Walang Basagan Ng Trip', artist: 'Jugs', flavor: 'opm', energy: 0.7, valence: 0.8 },
  { title: 'Tulong', artist: 'Borhuh', flavor: 'opm', energy: 0.7, valence: 0.7 },
  { title: 'Pirmeng Lowbat', artist: 'Richel B', flavor: 'opm', energy: 0.75, valence: 0.75 },
  { title: 'Chismis', artist: 'Flow G', flavor: 'opm', energy: 0.75, valence: 0.7 },
];

/** Energetic enough that the deck may reach for the pool at all. */
const ENERGY_BAR = 0.65;
/** Below this a photo is melancholic/angry — high energy alone must not qualify. */
const VALENCE_FLOOR = 0.45;
/** Playful words in mood/scene/tags may qualify a photo on their own… */
const PLAYFUL_WORDS = new Set([
  'party', 'parties', 'dance', 'dancing', 'fun', 'funny', 'playful', 'chaotic',
  'silly', 'goofy', 'meme', 'memes', 'hype', 'crazy', 'wild', 'festival',
  'carnival', 'celebration', 'celebrate', 'joke', 'prank',
]);
/** …but only when the photo is actually happy (valence), not just loud. */
const PLAYFUL_VALENCE_BAR = 0.6;

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * True when this photo's vibe can carry brainrot music: energetic AND not
 * gloomy, OR playful keywords with a happy valence. An ineligible photo
 * means findTracks spends zero extra API calls and builds exactly the deck
 * it builds today.
 */
export function brainrotEligible(analysis) {
  if (!analysis) return false;
  if (num(analysis.energy, 0.5) >= ENERGY_BAR && num(analysis.valence, 0.5) >= VALENCE_FLOOR) return true;
  const hay = new Set(
    [analysis.mood, analysis.scene, ...(analysis.tags || [])]
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
  const playful = [...PLAYFUL_WORDS].some((w) => hay.has(w));
  return playful && num(analysis.valence, 0.5) >= PLAYFUL_VALENCE_BAR;
}

/** Evenly rotates a list so every batch explores a different slice of it. */
const rotate = (arr, n) => {
  if (arr.length < 2) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

/**
 * The brainrot entries to search for this photo: mood-closest first, flavors
 * interleaved (so one batch never returns three Italian cuts), rotated by
 * `batch` so "next track" keeps meeting new entries.
 */
export function brainrotFor(analysis, { batch = 0, limit = 2 } = {}) {
  const energy = num(analysis?.energy, 0.5);
  const valence = num(analysis?.valence, 0.5);
  const distance = (a) => Math.abs(a.energy - energy) + Math.abs(a.valence - valence);

  const flavors = [...new Set(brainrotTracks.map((t) => t.flavor))];
  const buckets = Object.fromEntries(
    flavors.map((f) => [
      f,
      rotate(
        brainrotTracks.filter((t) => t.flavor === f).sort((a, b) => distance(a) - distance(b)),
        batch,
      ),
    ]),
  );
  const order = rotate(flavors, batch);

  const picks = [];
  while (picks.length < limit) {
    // Preferred flavor first; fall back to the others without draining them.
    let next = null;
    for (let i = 0; i < order.length && !next; i++) {
      next = buckets[order[(picks.length + i) % order.length]].shift();
    }
    if (!next) break;
    picks.push(next);
  }
  return picks;
}
