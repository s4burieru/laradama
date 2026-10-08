// ============================================================================
// F1 TRACK POOL — "any Formula 1 photo gets F1 music"
// ----------------------------------------------------------------------------
// When the uploaded photo is F1-flavoured (car, helmet, podium, the four
// driver meme songs, or just an f1-keyword in the mood call), findTracks
// favours this pool over the generic mood/popular mix. A specific recognized
// driver still outranks everything: their customMatches entry pins their own
// chant as card #1 and the pool fills the rest.
//
// `flavor` drives the card tag pill (`f1 · driver` / `· anthem` / `· meme`);
// `energy`/`valence` pick which entries fit the photo's vibe (f1For).
//
// Entries verified against iTunes Search API with a free 30s preview —
// re-check with `node scripts/smoke-test.mjs --pool`
// (it lists every entry with a playable preview in scripts/smoke-test.mjs).
// ============================================================================

export const f1Tracks = [
  { title: '33 Max Verstappen', artist: 'Carte Blanq & Maxx Power', flavor: 'driver', energy: 0.95, valence: 0.85 },
  { title: 'Lewis Hamilton', artist: 'Maxx Power & Carte Blanq', flavor: 'driver', energy: 0.9, valence: 0.8 },
  { title: 'Charles Leclerc', artist: 'Carte Blanq & Maxx Power', flavor: 'driver', energy: 0.85, valence: 0.85 },
  { title: 'Lando Norris', artist: 'Maxx Power & Carte Blanq', flavor: 'driver', energy: 0.9, valence: 0.8 },
  { title: 'Formula 1 Theme', artist: 'Brian Tyler', flavor: 'anthem', energy: 0.7, valence: 0.6 },
  { title: 'grand prix!', artist: 'gio.', flavor: 'anthem', energy: 0.8, valence: 0.7 },
  { title: 'GRAND PRIX', artist: 'PXRKX', flavor: 'anthem', energy: 0.8, valence: 0.65 },
  { title: 'Grand Prix', artist: 'Kep1er', flavor: 'anthem', energy: 0.85, valence: 0.8 },
  { title: 'Drive to Survive', artist: 'Jimmy Thackery & The Drivers', flavor: 'anthem', energy: 0.65, valence: 0.6 },
  { title: 'Drive to Survive', artist: 'Neon Nox', flavor: 'meme', energy: 0.75, valence: 0.65 },
  { title: 'Motorsport My Team (MotorSports)', artist: 'Offke23', flavor: 'meme', energy: 0.7, valence: 0.7 },
  { title: 'Turbo', artist: 'F1', flavor: 'meme', energy: 0.8, valence: 0.7 },
];

/** Normalise for case/punctuation-blind matching. */
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Strong F1 signals — tokens or phrases inside the photo's scans. */
const F1_TOKENS = new Set([
  'f1', 'f1racing', 'f1team', 'formula', 'formula1',
  'grandprix',
  'redbull', 'mclaren', 'ferrari', 'mercedes', 'haas', 'alpine', 'astonmartin', 'sauber', 'williams',
  'verstappen', 'maxverstappen', 'hamilton', 'leclerc', 'norris', 'piastri', 'alonso', 'sainz', 'perez',
  'motorsport', 'podium', 'pitstop', 'paddock', 'qualifying', 'poleposition',
]);
const F1_PHRASES = [
  'formula 1', 'formula one', 'grand prix', 'red bull racing', 'red bull', 'drive to survive',
  'f1 car', 'f1 driver', 'f1 podium', 'f1 victory', 'pole position', 'pit stop', 'season opener',
  'checkered flag', 'motorsport',
];

/**
 * True when the vision profile reads as F1: any driver name, any team, the
 * "formula 1" / "grand prix" phrase, or an F1 unit (f1, podium, qualifying…).
 * Bearish on single words like "racing" alone — image-to-music shouldn't
 * become the F1 theme every time someone uploads a racehorse.
 */
export function f1Eligible(analysis) {
  if (!analysis) return false;
  const hay = norm(
    [
      analysis.mood,
      analysis.scene,
      ...(analysis.tags || []),
      ...(analysis.genres || []),
      ...(analysis.searchQueries || []),
    ].join(' '),
  );
  if (!hay) return false;
  const tokens = new Set(hay.split(' ').filter(Boolean));
  for (const t of F1_TOKENS) if (tokens.has(t)) return true;
  for (const p of F1_PHRASES) if (hay.includes(p)) return true;
  return false;
}

/** Evenly rotates a list so every batch explores a different slice of it. */
const rotate = (arr, n) => {
  if (arr.length < 2) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

/**
 * Pool picks for this photo: mood-distance to its energy/valence, interleaving
 * flavors (driver / anthem / meme) so a batch never returns four driver
 * chants. Rotated per batch and filtered against `seen` so "next track" keeps
 * producing unseen candidates.
 */
export function f1For(analysis, { batch = 0, limit = 4, seen = new Set() } = {}) {
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const energy = num(analysis?.energy, 0.5);
  const valence = num(analysis?.valence, 0.5);
  const distance = (a) => Math.abs(a.energy - energy) + Math.abs(a.valence - valence);

  const flavors = [...new Set(f1Tracks.map((t) => t.flavor))];
  const buckets = Object.fromEntries(
    flavors.map((f) => [
      f,
      rotate(
        f1Tracks.filter((t) => t.flavor === f).sort((a, b) => distance(a) - distance(b)),
        batch,
      ),
    ]),
  );
  const order = rotate(flavors, batch);

  const picks = [];
  while (picks.length < limit) {
    let next = null;
    for (let i = 0; i < order.length && !next; i++) {
      next = buckets[order[(picks.length + i) % order.length]].shift();
    }
    if (!next) break;
    const key = `${next.title.toLowerCase()}::${next.artist.toLowerCase()}`;
    if (!seen.has(key)) picks.push(next);
  }
  return picks;
}
