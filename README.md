# Laradama

Laradama is an image-to-music web application.

Users can upload or capture an image, and Laradama analyzes
the image's context, mood, energy, and overall vibe to
recommend music that fits the image.

## Planned Technologies

- Vision AI
- Audius API
- Spotify API

## Core Flow

1. User uploads or captures an image
2. Laradama analyzes the image
3. The system identifies the image's mood, context, energy, and vibe
4. Laradama finds suitable music
5. User can play the recommended music
6. User can open the song on Spotify
7. User can customize the generated result
8. User can share the result using a Laradama story template

## Story Sharing

Laradama generates a shareable story from the user's image and recommended music. The story template includes the image, song information, and Laradama branding in a format optimized for social media stories.

Four templates ship (`clean`, `meme`, `vinyl`, `neon`), previewed live in the
story modal. Posting one runs through:

1. **Render** — `src/lib/storyImage.js` redraws the selected template with
   Canvas2D at **1080×1920** (the 9:16 story canvas) and returns a PNG blob.
   Every px value in the `.ld-story-*` CSS is authored for the modal's 150px
   preview, so the canvas multiplies them by `S = width / 150` and stays
   pixel-proportional to it — **a template change in `src/index.css` needs the
   matching change in `storyImage.js`.** The photo comes in as a data URL, so
   the canvas never goes origin-tainted, and `document.fonts.load()` guarantees
   the Montserrat weights are resident before the text is drawn.
   The render runs **as soon as the modal opens a template** (and again on
   every template/track/photo change), not at click time: it takes seconds,
   and browsers revoke a click's user activation after ~5s — once that lapses
   `navigator.share`, `window.open` and the `instagram://` jump are all
   refused. The buttons just reuse the pre-rendered blob.
2. **Share** — `src/lib/storyShare.js` tries `navigator.share({ files })`
   (Web Share Level 2) first: it is the only API that can push an image into
   the native share sheet from a web page, and mobile browsers are the only
   place it exists. There the user picks Instagram or Facebook directly.
3. **Fallback** — where Web Share is missing or throws (anything other than
   the user cancelling), the PNG is saved as `laradama-<platform>-story.png`
   and the platform is opened: on phones the app URL scheme first
   (`instagram://story-camera`, `fb://…`), falling through to the website only
   if the page never loses focus; on desktop straight to the website, where an
   unregistered protocol would only pop an error dialog. The website open is
   popup-blockable, so a refused popup falls back to navigating the current
   tab — the button can never silently do nothing. The modal stays open
   and spells out the last step ("open Instagram, start a Story, pick it"),
   and the primary button relabels itself to `Save & open <platform>` when the
   browser has no share sheet at all.

A separate **Download** button exports the same PNG without opening anything.


## Custom Scans

Pinned image → specific song mappings, defined in `src/data/customMatches.js`.
When an upload is recognized as one of these entries, that song is pinned as the
first card of the swipe deck (mood-matched songs follow behind it).

Recognition runs in two stages, cheapest first:

1. **Perceptual hash** — if an entry lists `refImages` (files dropped into
   `public/refs/`), the upload is compared against them offline. Catches the
   exact file and near-duplicates. Skipped entirely when no entry has images.
2. **Subject recognition** — the entry's `keywords` are injected into the one
   Gemini vision call that already runs, so recognizing a person/topic costs no
   extra API quota. Requires `GEMINI_API_KEY`; without it the upload simply
   falls back to normal mood matching.

Adding an entry:

```js
{
  id: 'rene-baterbonia',            // unique slug, returned as customId
  subject: 'Rene Baterbonia',       // badge shown on the card
  keywords: ['rene baterbonia'],    // what the vision model looks for
  refImages: [],                    // optional: ['/refs/rene-1.png']
  title: 'SIGAW NG MINDANAO',
  artist: 'UGAT NG LAHI',
  spotifyId: '5dGheUXVcZWcfOIIDSvP3v', // verify via open.spotify.com/oembed
  tag: 'meme · opm',
  why: '…why it fits, key phrases in <b>tags</b>…',
}
```

Playback: the entry's title/artist are searched on Audius, then iTunes, gated on
title **and** artist similarity so a same-named song by someone else is never
played. If neither source has a free preview (common for new releases), the card
keeps its default progress-bar player — no inline Spotify embed.

Pick a `title` that actually exists on **Audius or iTunes**: a Spotify-only
release has no free preview, so the card sits at **`no audio`** with its play
button disabled. That is exactly what happened here — *Bituin ng Mindanao* is on
Spotify but on neither free source, so the entry now pins *SIGAW NG MINDANAO*
(track 1 of the same UGAT NG LAHI album), which iTunes previews. Verify any
change with `node scripts/smoke-test.mjs` (`findTrackForTitle(pinned entry)`
must print a preview, not `null`).

An empty `customMatches` array disables the feature entirely — the vision prompt
and schema are then unchanged from the default behavior.

## Popular-First Matching

The matching API (`src/lib/music.js`) prioritizes popular music — international
and OPM — instead of serving only deep mood-fit cuts:

- **Artist pool** — `src/data/popularArtists.js` curates 58 acts (30
  international, 28 OPM), each tagged with the `energy` / `valence` of their
  hits on the same 0..1 scale the vision profile uses.
- **Selection** — `popularArtistsFor()` returns the three acts closest to the
  photo's mood, interleaving both regions (starting with whichever already fits
  better) and rotating them per batch, so "next track" keeps meeting new acts
  rather than looping the same three.
- **Search** — iTunes is queried per artist with `attribute=artistTerm`, which
  resolves to that artist's own catalogue, alongside the usual mood phrases.
  Audius stays mood-driven (its catalogue is mostly unsigned acts, so artist
  queries there return noise) and keeps providing full-length streams.
- **Ranking** — a pool credit is worth **+10**, Audius play counts up to **+4**,
  so a popular track wins any tie on mood fit. `isPopularArtist()` only accepts
  credits that *are* the act (features and pool-to-pool collabs included), so
  "Drake Bell" or a "… Tribute Band" never inherits Drake's boost.
- **Deck** — `deckFor()` takes the 6 best-ranked candidates, guarantees at least
  **3** popular-artist tracks when the search found any (promoted from the
  tail, so the top keeps its mood-fit order), and caps any single artist at
  **2** songs so a deck never becomes one artist's EP.

iTunes answers **429** after roughly 45 quick calls in a session, so search
results are memoized for 5 minutes and a 429 pauses fresh calls for 20s — the
deck then degrades to Audius mood matches instead of failing. Every name in the
pool was checked against
`?term=<name>&media=music&entity=song&attribute=artistTerm` for playable
previews. Verify the whole thing with `node scripts/smoke-test.mjs` — it prints
the artist picks for the photo and `popular artists in deck: x/6` per batch.

## Vision Model Note

`src/lib/vision.js` tries `gemini-3.8-flash` then `gemini-3.5-flash-lite`
(twice over, to ride out spikes). The older `gemini-2.x` ids now return **404**
("no longer available to new users") on current API keys, which silently drops
the app to local color analysis — no Gemini mood profile and no subject
recognition. If matching looks dull or custom scans never hit, check
`VISION_MODELS` first. Transient **429/5xx** responses fall through to the
next model instead of aborting, so a busy API costs at most one extra call
before the local fallback takes over.

## Development Rules

- Use React components
- Use Tailwind CSS for styling
- Keep components reusable
- Do not put API keys in frontend code
- Do not add unnecessary dependencies
- Follow the existing UI/UX prototype