/* Smoke test for the music + Spotify layers (no browser APIs involved).
 * `node scripts/smoke-test.mjs --pool` additionally verifies every brainrot
 * pool entry still resolves a playable iTunes preview. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { findTracks, findTrackForTitle } from '../src/lib/music.js';
import { isPopularArtist, popularArtistsFor } from '../src/data/popularArtists.js';
import { f1Eligible, f1For, f1Tracks } from '../src/data/f1Tracks.js';
import { brainrotEligible, brainrotFor, brainrotTracks } from '../src/data/brainrotTracks.js';
import { resolveSpotifyTrack, spotifySearchUrl } from '../src/lib/spotify.js';
import { activeEntries, hamming, subjectBlock } from '../src/lib/customMatch.js';

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

// High-energy twin of the profile above — same shape, party vibes: this is the
// one whose deck should carry the brainrot quota.
const hype = {
  ...analysis,
  mood: 'rowdy house party',
  scene: 'packed dance floor',
  energy: 0.85,
  valence: 0.8,
  tags: ['strobe lights', 'party', 'dance floor'],
  genres: ['edm', 'dance'],
  searchQueries: ['party edm dance', 'hype club mix'],
};

console.log('--- findTracks(analysis) ---');
console.log(
  'artist picks for this photo:',
  popularArtistsFor(analysis, { batch: 0, limit: 3 }).map((a) => `${a.name} (${a.region})`).join(', '),
);
console.log(`brainrot eligible: ${brainrotEligible(analysis)} (calm profile — expect false)`);
const t0 = Date.now();
const tracks = await findTracks(analysis);
console.log(`found ${tracks.length} tracks in ${Date.now() - t0}ms`);
for (const t of tracks) {
  console.log(` [${t.source}] ${t.title} — ${t.artist} (${t.genre}) score=${t.score.toFixed(1)}${isPopularArtist(t.artist) ? ' ★popular' : ''}${t.brainrot ? ` ◆brainrot(${t.brainrot})` : ''}${t.f1 ? ` ◆f1(${t.f1})` : ''} audio=${t.audioUrl.slice(0, 60)}...`);
}
console.log(` popular artists in deck: ${tracks.filter((t) => isPopularArtist(t.artist)).length}/${tracks.length}`);
console.log(` brainrot in deck: ${tracks.filter((t) => t.brainrot).length}/${tracks.length} (calm profile — expect 0)`);
console.log(` f1 in deck: ${tracks.filter((t) => t.f1).length}/${tracks.length} (calm profile — expect 0)`);
if (tracks[0]) {
  console.log('\n--- resolveSpotifyTrack(top track) ---');
  const url = await resolveSpotifyTrack(tracks[0].title, tracks[0].artist);
  console.log('spotify url:', url, '(null = not configured / no confident match → search fallback)');
  console.log('search fallback:', spotifySearchUrl(tracks[0].title, tracks[0].artist));
}

console.log('\n--- f1 (f1 profile) ---');
const f1 = {
  ...analysis,
  mood: 'podium glory',
  scene: 'red bull f1 podium',
  energy: 0.8,
  valence: 0.8,
  tags: ['f1', 'formula 1', 'red bull racing'],
  genres: ['edm', 'dance'],
  searchQueries: ['formula 1 podium edm', 'racing victory anthem'],
};
console.log(`f1 eligible: ${f1Eligible(f1)} (expect true)`);
console.log(
  'picks for this photo:',
  f1For(f1, { batch: 0, limit: 4 }).map((e) => `${e.title} — ${e.artist} (${e.flavor})`).join(' | '),
);
const f0 = Date.now();
const f1Deck = await findTracks(f1);
console.log(`found ${f1Deck.length} tracks in ${Date.now() - f0}ms`);
for (const t of f1Deck) {
  console.log(` [${t.source}] ${t.title} — ${t.artist} score=${t.score.toFixed(1)}${isPopularArtist(t.artist) ? ' ★popular' : ''}${t.f1 ? ` ◆f1(${t.f1})` : ''}${t.brainrot ? ` ◆brainrot(${t.brainrot})` : ''}`);
}
const f1Count = f1Deck.filter((t) => t.f1).length;
console.log(` popular artists in deck: ${f1Deck.filter((t) => isPopularArtist(t.artist)).length}/${f1Deck.length} (floor 1)`);
console.log(` f1 in deck: ${f1Count}/${f1Deck.length} (expect 4-6)`);
if (f1Count < 4) console.log(' !! f1 quota missed — check searchF1 gate / pool previews');

console.log('\n--- brainrot (hype profile) ---');
console.log(`brainrot eligible: ${brainrotEligible(hype)} (party profile — expect true)`);
console.log(
  'picks for this photo:',
  brainrotFor(hype, { batch: 0, limit: 2 }).map((e) => `${e.title} — ${e.artist} (${e.flavor})`).join(' | '),
);
const h0 = Date.now();
const hypeDeck = await findTracks(hype);
console.log(`found ${hypeDeck.length} tracks in ${Date.now() - h0}ms`);
for (const t of hypeDeck) {
  console.log(` [${t.source}] ${t.title} — ${t.artist} score=${t.score.toFixed(1)}${isPopularArtist(t.artist) ? ' ★popular' : ''}${t.brainrot ? ` ◆brainrot(${t.brainrot})` : ''}`);
}
const hypeBrainrot = hypeDeck.filter((t) => t.brainrot).length;
console.log(` popular artists in deck: ${hypeDeck.filter((t) => isPopularArtist(t.artist)).length}/${hypeDeck.length}`);
console.log(` brainrot in deck: ${hypeBrainrot}/${hypeDeck.length} (expect 1-2)`);
if (hypeBrainrot < 1) console.log(' !! brainrot quota missed — check searchBrainrot gate / pool previews');

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
for (const e of activeEntries()) {
  const refs = e.refImages || [];
  const missing = refs.filter((u) => !existsSync(join('public', u)));
  console.log(
    `entry "${e.id}": ${refs.length} ref image(s), hashDistance=${e.hashDistance ?? 'default'} (of 64), ` +
      `description=${e.description ? `${e.description.length} chars` : 'MISSING (new photos of the subject will not be recognized)'}`,
  );
  if (missing.length) console.log(`  !! ref file(s) not found under public/: ${missing.join(', ')}`);
}
console.log('hamming identical:', hamming('a1b2c3d4e5f60718', 'a1b2c3d4e5f60718'), '(expect 0)');
console.log('hamming opposite :', hamming('0000000000000000', 'ffffffffffffffff'), '(expect 64)');

console.log('\n--- findTrackForTitle (pinned entries) ---');
const pinnedEntries = activeEntries();
if (!pinnedEntries.length) {
  console.log('no entries in customMatches.js');
}
for (const pinnedEntry of pinnedEntries) {
  // Same resolution pinnedSong() does: the card credits entry.title/artist,
  // entry.audio (when set) is only what supplies the playable clip.
  const source = pinnedEntry.audio || { title: pinnedEntry.title, artist: pinnedEntry.artist };
  console.log(`entry "${pinnedEntry.id}": card shows "${pinnedEntry.title}" — ${pinnedEntry.artist}`);
  if (pinnedEntry.audio) console.log(`  preview stand-in: "${source.title}" — ${source.artist}`);
  const t0 = Date.now();
  const pinned = await findTrackForTitle(source.title, source.artist);
  console.log(`  took ${Date.now() - t0}ms`);
  console.log(
    pinned
      ? `  preview: [${pinned.source}] ${pinned.title} — ${pinned.artist}\n  audio=${pinned.audioUrl}`
      : '  null → no free preview for this source; card keeps its default player',
  );
  console.log('  spotify link:', pinnedEntry.spotifyId ? `https://open.spotify.com/track/${pinnedEntry.spotifyId}` : '(none — would be resolved)');
}

// `--pool` re-verifies every curated brainrot entry against iTunes the same
// way the README's refresh procedure does: one title+artist search per entry
// (26 calls — two per entry would brush the ~45-call 429 ceiling), the same
// title/artist gate the matcher uses, and a report of whether a 30s preview
// still exists. A `null` entry is dead weight — swap it out of
// brainrotTracks.js.
if (process.argv.includes('--pool')) {
  const pool = [...brainrotTracks.map((t) => ({ ...t, flavor: t.flavor })), ...f1Tracks.map((t) => ({ ...t, flavor: t.flavor }))];
  console.log(`\n--- pools (${brainrotTracks.length} brainrot + ${f1Tracks.length} f1 = ${pool.length} entries) ---`);
  const tokens = (s) => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const sim = (hay, needle) => {
    const A = new Set(tokens(hay));
    const B = tokens(needle);
    return A.size && B.length ? B.filter((w) => A.has(w)).length / B.length : 0;
  };
  let missing = 0;
  for (const e of pool) {
    let verdict = 'null → NO PREVIEW, remove or replace';
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(`${e.title} ${e.artist}`)}&media=music&entity=song&limit=6`;
      const res = await fetch(url);
      const json = await res.json();
      const hit = (json.results || []).find(
        (t) => t.previewUrl && sim(t.trackName, e.title) >= 0.8 && sim(t.artistName, e.artist) >= 0.5,
      );
      if (hit) verdict = `preview ok — "${hit.trackName}" / ${hit.artistName}`;
      else missing += 1;
    } catch (err) {
      verdict = `lookup failed (${err?.message || err})`;
    }
    console.log(`${verdict.startsWith('preview') ? '✓' : '✗'} ${e.title} — ${e.artist} (${e.flavor}) — ${verdict}`);
  }
  console.log(missing ? `${missing} entr(y/ies) need attention` : 'pool fully playable');
}

process.exit(0);
