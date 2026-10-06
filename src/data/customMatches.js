// ============================================================================
// CUSTOM SCANS — pinned image → specific song mappings
// ----------------------------------------------------------------------------
// When an upload is recognized as one of these entries, that song is pinned as
// card #1 of the swipe deck (mood-matched songs follow behind it).
//
// HOW TO ADD AN ENTRY
//   1. id       — unique kebab-case slug (also what Gemini returns as customId)
//   2. subject  — label shown on the card badge
//   3. keywords — names/hints used by the vision model to recognize ANY image
//                 about that person or topic (not just one specific file)
//   4. refImages— OPTIONAL: paths under /public (e.g. '/refs/rene-1.png').
//                 When present, uploads are compared against them with a
//                 perceptual hash FIRST (works offline, no API needed).
//   5. title / artist — used to find a playable stream (Audius → iTunes).
//                 With no free preview the card keeps its default player,
//                 so the title MUST exist on one of those two sources —
//                 a Spotify-only track reads "no audio" (see README).
//   6. spotifyId — OPTIONAL but recommended: guarantees the "Listen on
//                 Spotify" link.
//                 Verify with https://open.spotify.com/oembed?url=.../track/<id>
//   7. tag      — short pill text for the card
//   8. why      — "Why this song?" copy. Wrap key phrases in <b> tags only.
//
// An empty array disables custom scans entirely (vision prompt stays as-is).
// ============================================================================

export const customMatches = [
  {
    id: 'rene-baterbonia',
    subject: 'Rene Baterbonia',
    keywords: ['rene baterbonia', 'baterbonia', 'rene mindanao'],
    refImages: [],
    title: 'SIGAW NG MINDANAO',
    artist: 'UGAT NG LAHI',
    spotifyId: '5dGheUXVcZWcfOIIDSvP3v',
    tag: 'meme · opm',
    why: 'This meme points straight at <b>Rene of Talacogon</b>, and <b>SIGAW NG MINDANAO</b> is the <b>UGAT NG LAHI</b> anthem shouting that same island pride — a kid from Mindanao with nothing but a dream. Its <b>anthemic reggae build</b> matches the pride energy the joke is riding on.',
  },
];
