// ============================================================================
// POPULAR ARTIST POOL — the "popular music first" lever in src/lib/music.js
// ----------------------------------------------------------------------------
// Curated well-known acts, international and OPM side by side. The matcher
// searches these by name on iTunes (`attribute=artistTerm` resolves to that
// artist's own catalogue), so a deck comes back full of songs people actually
// know instead of deep mood-fit cuts from nobody's playlist.
//
// `energy` / `valence` describe the act's hits on the same 0..1 scale the
// vision profile uses: `popularArtistsFor()` hands the search the artists whose
// sound fits the photo — popularity decides WHO is eligible, the photo decides
// WHO among them.
//
// TO REFRESH: swap in current chart names (keep `region` and the two mood
// numbers). Order does not matter — the picker sorts by mood distance and
// rotates per batch, so "next track" keeps meeting new artists. Every name was
// checked against the iTunes Search API
// (`?term=<name>&media=music&entity=song&attribute=artistTerm`) for playable
// previews before it went in.
// ============================================================================

export const popularArtists = [
  // --- International ---
  { name: 'Bruno Mars', region: 'international', energy: 0.75, valence: 0.8 },
  { name: 'Taylor Swift', region: 'international', energy: 0.55, valence: 0.7 },
  { name: 'Olivia Rodrigo', region: 'international', energy: 0.5, valence: 0.3 },
  { name: 'The Weeknd', region: 'international', energy: 0.55, valence: 0.4 },
  { name: 'Dua Lipa', region: 'international', energy: 0.8, valence: 0.85 },
  { name: 'Ed Sheeran', region: 'international', energy: 0.45, valence: 0.65 },
  { name: 'Coldplay', region: 'international', energy: 0.55, valence: 0.6 },
  { name: 'Billie Eilish', region: 'international', energy: 0.3, valence: 0.3 },
  { name: 'Ariana Grande', region: 'international', energy: 0.75, valence: 0.75 },
  { name: 'Lady Gaga', region: 'international', energy: 0.8, valence: 0.7 },
  { name: 'Harry Styles', region: 'international', energy: 0.55, valence: 0.7 },
  { name: 'Arctic Monkeys', region: 'international', energy: 0.6, valence: 0.45 },
  { name: 'Imagine Dragons', region: 'international', energy: 0.75, valence: 0.6 },
  { name: 'Katy Perry', region: 'international', energy: 0.85, valence: 0.85 },
  { name: 'Maroon 5', region: 'international', energy: 0.65, valence: 0.7 },
  { name: 'Adele', region: 'international', energy: 0.3, valence: 0.4 },
  { name: 'Rihanna', region: 'international', energy: 0.7, valence: 0.65 },
  { name: 'Shakira', region: 'international', energy: 0.8, valence: 0.8 },
  { name: 'BTS', region: 'international', energy: 0.8, valence: 0.8 },
  { name: 'Tame Impala', region: 'international', energy: 0.4, valence: 0.55 },
  { name: 'Oasis', region: 'international', energy: 0.55, valence: 0.6 },
  { name: 'Goo Goo Dolls', region: 'international', energy: 0.45, valence: 0.6 },
  { name: 'Radiohead', region: 'international', energy: 0.4, valence: 0.3 },
  { name: 'Queen', region: 'international', energy: 0.7, valence: 0.75 },
  { name: 'Twenty One Pilots', region: 'international', energy: 0.65, valence: 0.5 },
  { name: 'Sabrina Carpenter', region: 'international', energy: 0.75, valence: 0.85 },
  { name: 'Lana Del Rey', region: 'international', energy: 0.35, valence: 0.4 },
  { name: 'Sia', region: 'international', energy: 0.6, valence: 0.5 },
  { name: 'Drake', region: 'international', energy: 0.5, valence: 0.5 },
  { name: 'Michael Jackson', region: 'international', energy: 0.75, valence: 0.8 },

  // --- OPM ---
  { name: 'SB19', region: 'opm', energy: 0.75, valence: 0.7 },
  { name: 'BINI', region: 'opm', energy: 0.8, valence: 0.85 },
  { name: 'Ben&Ben', region: 'opm', energy: 0.4, valence: 0.7 },
  { name: 'Cup of Joe', region: 'opm', energy: 0.4, valence: 0.65 },
  { name: 'IV of Spades', region: 'opm', energy: 0.55, valence: 0.7 },
  { name: 'Arthur Nery', region: 'opm', energy: 0.4, valence: 0.6 },
  { name: 'Zack Tabudlo', region: 'opm', energy: 0.6, valence: 0.55 },
  { name: 'Adie', region: 'opm', energy: 0.35, valence: 0.6 },
  { name: 'Moira Dela Torre', region: 'opm', energy: 0.3, valence: 0.5 },
  { name: 'Sarah Geronimo', region: 'opm', energy: 0.75, valence: 0.8 },
  { name: 'KZ Tandingan', region: 'opm', energy: 0.6, valence: 0.55 },
  { name: 'Parokya ni Edgar', region: 'opm', energy: 0.7, valence: 0.8 },
  { name: 'Eraserheads', region: 'opm', energy: 0.6, valence: 0.75 },
  { name: 'Rivermaya', region: 'opm', energy: 0.55, valence: 0.65 },
  { name: 'Bamboo', region: 'opm', energy: 0.6, valence: 0.6 },
  { name: 'Al James', region: 'opm', energy: 0.5, valence: 0.6 },
  { name: 'Shanti Dope', region: 'opm', energy: 0.7, valence: 0.55 },
  { name: 'Hev Abi', region: 'opm', energy: 0.6, valence: 0.55 },
  { name: 'Alamat', region: 'opm', energy: 0.75, valence: 0.75 },
  { name: 'BGYO', region: 'opm', energy: 0.75, valence: 0.8 },
  { name: 'Gloc-9', region: 'opm', energy: 0.7, valence: 0.5 },
  { name: 'Flow G', region: 'opm', energy: 0.7, valence: 0.5 },
  { name: 'Skusta Clee', region: 'opm', energy: 0.6, valence: 0.6 },
  { name: 'Up Dharma Down', region: 'opm', energy: 0.35, valence: 0.45 },
  { name: 'Silent Sanctuary', region: 'opm', energy: 0.4, valence: 0.55 },
  { name: 'Dilaw', region: 'opm', energy: 0.6, valence: 0.7 },
  { name: 'Sunkissed Lola', region: 'opm', energy: 0.45, valence: 0.6 },
  { name: 'December Avenue', region: 'opm', energy: 0.45, valence: 0.6 },
];

/** Same even rotation the music layer uses, so every batch explores a new slice. */
const rotate = (arr, n) => {
  if (arr.length < 2) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

/** "Lady Gaga & Bruno Mars" -> "lady gaga bruno mars" (accent- and punctuation-blind). */
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const POOL_NAMES = popularArtists.map((a) => norm(a.name)).filter((n) => n.length > 2);
const POOL_TOKENS = new Set(POOL_NAMES.flatMap((n) => n.split(' ')));
/** Words that join credits without changing who is singing. */
const CONNECTORS = new Set(['feat', 'ft', 'featuring', 'with', 'and', 'x', 'vs', 'plus', 'the', 'of', 'ni']);

/**
 * True when a track credit is one of the pool's acts — features and collabs
 * between pool acts included. Anything else in the credit has to be another
 * pool act or a joining word, which is what keeps "Drake Bell" from passing as
 * Drake and "… Tribute Band" from passing as the band itself.
 */
export function isPopularArtist(artist) {
  const hay = norm(artist);
  if (hay.length < 3) return false;
  const padded = ` ${hay} `;
  const hit = POOL_NAMES.find((n) => padded.includes(` ${n} `));
  if (!hit) return false;
  const rest = padded.replace(` ${hit} `, ' ').trim();
  return rest
    .split(' ')
    .filter(Boolean)
    .every((w) => POOL_TOKENS.has(w) || CONNECTORS.has(w));
}

/**
 * The artists to search by name for this photo: closest to its energy/valence
 * first, OPM and international interleaved (starting with whichever region
 * already fits better), rotated by `batch` so "next track" keeps introducing
 * new artists instead of looping the same three.
 */
export function popularArtistsFor(analysis, { batch = 0, limit = 3 } = {}) {
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const energy = num(analysis?.energy, 0.5);
  const valence = num(analysis?.valence, 0.5);
  const distance = (a) => Math.abs(a.energy - energy) + Math.abs(a.valence - valence);

  const ordered = rotate(
    [...popularArtists].sort((a, b) => distance(a) - distance(b)),
    batch * Math.max(1, limit),
  );
  const buckets = {
    opm: ordered.filter((a) => a.region === 'opm'),
    international: ordered.filter((a) => a.region === 'international'),
  };
  const first = distance(buckets.international[0]) < distance(buckets.opm[0]) ? 'international' : 'opm';
  const other = first === 'opm' ? 'international' : 'opm';

  const picks = [];
  while (picks.length < limit && (buckets[first].length || buckets[other].length)) {
    const takeFirst = picks.length % 2 === 0 || !buckets[other].length;
    picks.push(buckets[takeFirst && buckets[first].length ? first : other].shift());
  }
  return picks;
}
