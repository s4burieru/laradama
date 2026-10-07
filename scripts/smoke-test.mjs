/* Smoke test for the music + Spotify layers (no browser APIs involved). */
import { findTracks, findTrackForTitle } from '../src/lib/music.js';
import { isPopularArtist, popularArtistsFor } from '../src/data/popularArtists.js';
import { resolveSpotifyTrack, spotifySearchUrl } from '../src/lib/spotify.js';
import { activeEntries, entryById, hamming, subjectBlock } from '../src/lib/customMatch.js';

const analysis = {
  source: 'gemini',
  mood: 'warm nostalgia',
  scene: 'sunset beach',
  timeOfDay: 'golden hour',
  palette: ['#F4A261', '#E76F51'],
  energy: 0.55,
  valence: 0.72,
  warmth: 0.8,
  tags: ['golden hour', 'calm waves', 'warm'],
  genres: ['indie pop', 'chill'],
  searchQueries: ['chill indie sunset', 'warm acoustic evening'],
  photoWhy: 'test why',
};

console.log('--- findTracks(analysis) ---');
console.log(
  'artist picks for this photo:',
  popularArtistsFor(analysis, { batch: 0, limit: 3 }).map((a) => `${a.name} (${a.region})`).join(', '),
);
const t0 = Date.now();
const tracks = await findTracks(analysis);
console.log(`found ${tracks.length} tracks in ${Date.now() - t0}ms`);
for (const t of tracks) {
  console.log(` [${t.source}] ${t.title} — ${t.artist} (${t.genre}) score=${t.score.toFixed(1)}${isPopularArtist(t.artist) ? ' ★popular' : ''} audio=${t.audioUrl.slice(0, 70)}...`);
}
console.log(` popular artists in deck: ${tracks.filter((t) => isPopularArtist(t.artist)).length}/${tracks.length}`);
if (tracks[0]) {
  console.log('\n--- resolveSpotifyTrack(top track) ---');
  const url = await resolveSpotifyTrack(tracks[0].title, tracks[0].artist);
  console.log('spotify url:', url, '(null = not configured / no confident match → search fallback)');
  console.log('search fallback:', spotifySearchUrl(tracks[0].title, tracks[0].artist));
}

// The deck refills itself: every later batch must return tracks the deck has
// not shown yet, otherwise "next track" would just loop the first 6 songs.
console.log('\n--- findTracks batch refill (unlimited next) ---');
const seen = new Set(tracks.map((t) => `${t.title.toLowerCase()}::${t.artist.toLowerCase()}`));
console.log(`batch 0: ${tracks.length} tracks (${seen.size} unique)`);
for (const batch of [1, 2, 3]) {
  const t0 = Date.now();
  const more = await findTracks(analysis, { exclude: [...seen], batch });
  const fresh = more.filter((x) => !seen.has(`${x.title.toLowerCase()}::${x.artist.toLowerCase()}`));
  fresh.forEach((x) => seen.add(`${x.title.toLowerCase()}::${x.artist.toLowerCase()}`));
  console.log(` batch ${batch}: +${fresh.length} new of ${more.length} returned, ${Date.now() - t0}ms`);
  console.log(
    `   popular: ${more.filter((x) => isPopularArtist(x.artist)).length}/${more.length} | artists: ${[
      ...new Set(more.map((x) => x.artist)),
    ].join(', ')}`,
  );
}
console.log(`total unique after 4 batches: ${seen.size} ${seen.size >= 12 ? '(deck keeps growing)' : '(deck is drying up)'}`);

console.log('\n--- custom scans ---');
console.log('entries:', activeEntries().map((e) => e.id).join(', ') || '(none)');
console.log('vision subject block:\n' + (subjectBlock() || '(disabled)'));
console.log('hamming identical:', hamming('a1b2c3d4e5f60718', 'a1b2c3d4e5f60718'), '(expect 0)');
console.log('hamming opposite :', hamming('0000000000000000', 'ffffffffffffffff'), '(expect 64)');

const pinnedEntry = entryById('rene-baterbonia');
console.log('\n--- findTrackForTitle(pinned entry) ---');
if (!pinnedEntry) {
  console.log('no rene-baterbonia entry in customMatches.js');
} else {
  console.log(`looking for "${pinnedEntry.title}" — ${pinnedEntry.artist}`);
  const t0 = Date.now();
  const pinned = await findTrackForTitle(pinnedEntry.title, pinnedEntry.artist);
  console.log(`took ${Date.now() - t0}ms`);
  console.log(
    pinned
      ? `preview: [${pinned.source}] ${pinned.title} — ${pinned.artist}`
      : 'null → no free preview for this exact track; card keeps its default player',
  );
  console.log('spotify link:', pinnedEntry.spotifyId ? `https://open.spotify.com/track/${pinnedEntry.spotifyId}` : '(none — would be resolved)');
}

process.exit(0);
