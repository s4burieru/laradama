// ============================================================================
// CUSTOM SCANS — pinned image → specific song mappings
// ----------------------------------------------------------------------------
// When an upload is recognized as one of these entries, that song is pinned as
// card #1 of the swipe deck (mood-matched songs follow behind it).
//
// HOW TO ADD AN ENTRY
//   1. id         — unique kebab-case slug (also what Gemini returns as customId)
//   2. subject    — label shown on the card badge
//   3. keywords   — names/hints used by the vision model to recognize ANY image
//                   about that person or topic (not just one specific file).
//                   Include text that may appear IN the photo (meme captions,
//                   jersey words) — reading text is what vision models do best.
//   4. description— OPTIONAL but strongly recommended: how the subject LOOKS
//                   (build, hair, uniform, jersey number, logos, context).
//                   This is the only thing that lets the model recognize a
//                   photo you never uploaded as a ref — keywords alone are a
//                   name it cannot attach to pixels.
//   5. refImages  — OPTIONAL: paths under /public (e.g. '/refs/rene-1.jpg').
//                   Two jobs, cheapest first:
//                   a) each file is compared against the upload with a
//                      perceptual hash FIRST (works offline, no API needed) —
//                      it catches itself plus mirrored/lightly re-cropped
//                      copies, never a different picture of the same person;
//                   b) on a miss they are sent to the vision model as reference
//                      photos for a dedicated face-comparison call, which is
//                      the ONLY thing allowed to set customId when refs exist.
//                   So: list every photo you have (the first two are used), and
//                   expect pins for new photos of that person to depend on them.
//   6. hashDistance— OPTIONAL (default 12): differing bits allowed out of 64.
//                   Raise it to tolerate re-encoding/crops, lower it if an
//                   unrelated photo starts matching.
//   7. title / artist — used to find a playable stream (Audius → iTunes).
//                   With no free preview the card keeps its default player,
//                   so the title MUST exist on one of those two sources —
//                   a Spotify-only track reads "no audio" unless it sets the
//                   `audio` stand-in in item 9 (see README).
//   8. spotifyId   — OPTIONAL but recommended: guarantees the "Listen on
//                   Spotify" link.
//                   Verify with https://open.spotify.com/oembed?url=.../track/<id>
//   9. audio       — OPTIONAL { title, artist }: a stand-in track searched for
//                   the PLAYABLE preview when title/artist above are Spotify-only.
//                   The card still shows entry.title / entry.artist / spotifyId;
//                   only the 30s clip comes from this recording (a cover is fine).
//  10. tag        — short pill text for the card
//  11. why        — "Why this song?" copy. Wrap key phrases in <b> tags only.
//
// An empty array disables custom scans entirely (vision prompt stays as-is).
// ============================================================================

export const customMatches = [
  {
    id: 'rene-baterbonia',
    subject: 'Rene Baterbonia',
    // Names/meme text — text that may appear INSIDE the photo, which vision
    // models can read directly.
    keywords: [
      'rene baterbonia',
      'baterbonia',
      'rene mindanao',
      'rene talacogon',
      'talacogon agusan',
      'bituin ng mindanao',
      'ugat ng lahi',
    ],
    // What Rene LOOKS like — the only way a photo you never uploaded as a ref
    // can ever be recognized. Keep it visual: build, hair, uniform, number.
    description:
      'Rene is a young Filipino basketball player: slim athletic build, short straight black hair, ' +
      'usually shown full-body on a court or against a plain studio wall holding a Molten basketball. ' +
      'He wears jersey number 2 — a white/blue Ateneo uniform, a blue Pilipinas (Philippines) uniform, ' +
      'or a red DAVRAA uniform with gold trim. He is from Talacogon, Agusan del Sur, in Mindanao, ' +
      'and is joked about as the homegrown hero of that town.',
    refImages: ['/refs/rene-1.jpg', '/refs/rene-2.jpg', '/refs/rene-3.jpg'],
    hashDistance: 12, // headroom for re-encodes / light crops of the refs above
    title: 'BITUIN NG MINDANAO',
    artist: 'UGAT NG LAHI',
    spotifyId: '7m37yuaoYE9UN3fjXP2Dg4',
    // Spotify-only original → this cover supplies the in-app 30s preview.
    audio: { title: 'Bituin Ng Mindanao (Reggae Version)', artist: 'Kaki' },
    tag: 'meme · opm',
    why: 'This meme points straight at <b>Rene of Talacogon</b>, and <b>BITUIN NG MINDANAO</b> is the <b>UGAT NG LAHI</b> anthem shouting that same island pride — a kid from Mindanao with nothing but a dream. Its <b>anthemic reggae build</b> matches the pride energy the joke is riding on.',
  },
  {
    id: 'max-verstappen',
    subject: 'Max Verstappen',
    keywords: ['max verstappen', 'verstappen', 'red bull racing', 'f1', 'formula 1', '33 max'],
    description:
      'Max Verstappen: Dutch Formula 1 driver, short light-brown hair, often wearing Red Bull Racing navy-blue overalls, ' +
      'a racing helmet or white/blue/red Red Bull cap, usually smiling; scenes of him hold a trophy or sit in an F1 cockpit count too.',
    // Add ['/refs/max-1.jpg', '/refs/max-2.jpg'] once you drop photos into public/refs/ — until then only the
    // keyword/description mood-call path can pin this entry (no perceptual-hash prefilter, no face check).
    refImages: ['/refs/max-1.jpg', '/refs/max-2.jpg', '/refs/max-3.jpg'],
    playlist: 'f1',
    hashDistance: 12,
    title: '33 Max Verstappen',
    artist: 'Carte Blanq & Maxx Power',
    tag: 'meme · f1',
    why: '<b>Max</b> is one of one — number 1 on the grid — and <b>33 Max Verstappen</b> is the internet chanting that fact at you. Its <b>rave-phonk loop</b> is exactly the same manic energy as a Verstappen qualifying lap.',
  },
  {
    id: 'lewis-hamilton',
    subject: 'Lewis Hamilton',
    keywords: ['lewis hamilton', 'hamilton', 'ferrari formula 1', 'mercedes f1', 'f1', 'formula 1', 'lewis capaldi'],
    description:
      'Lewis Hamilton: British Formula 1 driver, Black driver with cornrows, often in a red Ferrari overall (since 2025) or teal Mercedes gear, wearing a racing helmet, baseball cap and headphones.',
    refImages: [],
    playlist: 'f1',
    hashDistance: 12,
    title: 'Lewis Hamilton',
    artist: 'Maxx Power & Carte Blanq',
    tag: 'meme · f1',
    why: '<b>Lewis Hamilton</b> has been carried for his entire career — now <b>Maxx Power & Carte Blanq</b> have given him a whole chant track. Same <b>hard-driving rave-phonk</b> as a Hamilton qualifying hero lap.',
  },
  {
    id: 'charles-leclerc',
    subject: 'Charles Leclerc',
    keywords: ['charles leclerc', 'leclerc', 'ferrari f1', 'f1', 'formula 1', 'monza'],
    description:
      'Charles Leclerc: Monegasque Formula 1 driver, light brown hair with a center part, red Ferrari overall, number 16, Ferrari team cap and helmet.',
    refImages: [],
    playlist: 'f1',
    hashDistance: 12,
    title: 'Charles Leclerc',
    artist: 'Carte Blanq & Maxx Power',
    tag: 'meme · f1',
    why: '<b>Charles Leclerc</b>: all raw <b>Ferrari red</b> passion and a helmet-cam smile — <b>Carte Blanq & Maxx Power</b> set it to the same reckless dance-floor energy as a Monza qualifying run.',
  },
  {
    id: 'lando-norris',
    subject: 'Lando Norris',
    keywords: ['lando norris', 'norris', 'mclaren f1', 'f1', 'formula 1', 'papaya'],
    description:
      'Lando Norris: young British Formula 1 driver, shaggy light-brown hair, red beard, orange McLaren papaya overall, number 4, white/orange McLaren helmet and cap.',
    refImages: [],
    playlist: 'f1',
    hashDistance: 12,
    title: 'Lando Norris',
    artist: 'Maxx Power & Carte Blanq',
    tag: 'meme · f1',
    why: '<b>Lando Norris</b>: the grid\'s coolest goofball, all grins and burnouts — <b>Maxx Power & Carte Blanq</b> bottle that same <b>laid-back rave-phonk</b> groove as a post-race Lando press conference.',
  },
  {
    id: 'tung-tung-sahur',
    subject: 'Tung Tung Tung Sahur',
    keywords: ['tung tung sahur', 'tungtung', 'sahur', 'tung tung', 'sahoor'],
    description:
      'Tung Tung Tung Sahur: a meme-subject image of an anthropomorphic wooden log/tree-stump creature with a carved face, ' +
      'two legs, usually holding a wooden bat, often split-screen with meme text "TUNG TUNG TUNG SAHUR". Not a real person — ' +
      'AI-style Italian brainrot rendering.',
    // Ref images (hash + face check) PLUS subject recognition via keywords —
    // refs already cover the uploaded file; the mood-call keywords keep other
    // renderings of the same meme in view.
    refImages: ['/refs/tungtungsahur-1.jpg', '/refs/tungtungsahur-2.png'],
    // When this scan pins, the mood deck behind it runs on the brainrot pool —
    // the same way a recognised F1 driver runs on the F1 pool.
    playlist: 'brainrot',
    hashDistance: 12,
    title: 'Tung Tung Tung Sahur (Italian Brainrot)',
    artist: 'W&W',
    tag: 'brainrot · meme',
    why: 'The <b>Tung Tung Tung Sahur</b> meme itself — the whole point of the deck is to hand that wooden-warrior image its own ' +
      'chant. <b>W&W\'s</b> <b>tung-tung-sahur</b> style <b>high-energy edm/hardstyle</b> drop is the same frantic rhythm as the meme.',
  },
];
