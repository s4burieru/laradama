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

Laradama generates a shareable story from the user's image and recommended music —
either an **animated video with the music baked in** (the primary "Post to Story"
path) or a static PNG ("Download image"), in a format optimized for social media
stories.

Five templates ship (`clean`, `meme`, `vinyl`, `neon`, `collage`), previewed
live in the story modal. Each template's editable values — sizes, colours,
layout, copy **and motion** — live in a single config, `src/data/storyTemplates.js`,
that the live preview (`src/components/StoryPreview.jsx`), the PNG still and the
video export all read. Because they share those numbers they can never drift; to
restyle or retime a template, edit its object (its `anim` block for the motion) —
no CSS or canvas changes needed.

### The still image (PNG)

1. **Render** — `src/lib/storyImage.js` redraws the selected template with
   Canvas2D at **1080×1920** (the 9:16 story canvas) and returns a PNG blob.
   Every size in the config is authored in "design px" against the modal's 150px
   preview, so the canvas multiplies them by `S = width / 150` and stays
   pixel-proportional to the live preview. The photo comes in as a data URL, so
   the canvas never goes origin-tainted, and `document.fonts.load()` guarantees
   the Montserrat weights are resident before the text is drawn.
   The still is the *settled frame* of the same motion the video animates
   (`draw(0, { still: true })` — entrances finished, loops at phase 0), so a
   template's PNG looks exactly like it did before motion existed.
   The render runs **as soon as the modal opens a template** (and again on
   every template/track/photo change), not at click time: it takes seconds,
   and browsers revoke a click's user activation after ~5s — once that lapses
   `navigator.share`, `window.open` and the `instagram://` jump are all
   refused. The buttons just reuse the pre-rendered blob.
2. **Share** — `src/lib/storyShare.js` hands the file to `navigator.share({
   files })` (Web Share Level 2): the only API that can push a file into the
   native share sheet from a web page, and mobile browsers are the only place
   it exists. The blob goes **straight from memory to the OS sheet** — nothing
   touches Downloads — and the user picks Instagram or Facebook directly.
   Cancelling the sheet is not an error; a sheet that refuses to open (or a
   browser without one) reports `failed` and the modal's status line points at
   the Download buttons instead of saving a file the user never asked for.
3. **Save & open (no share sheet)** — where Web Share is missing (desktop,
   older mobile browsers) the primary button relabels itself to
   `Save video & open <platform>` and runs the explicit
   `saveAndOpenStoryFile`: the file is saved as
   `laradama-<platform>-story.<ext>` and the platform is opened — on phones
   the app URL scheme first (`instagram://story-camera`, `fb://…`), falling
   through to the website only if the page never loses focus; on desktop
   straight to the website, where an unregistered protocol would only pop an
   error dialog. The website open is popup-blockable, so a refused popup falls
   back to navigating the current tab — the button can never silently do
   nothing. The modal stays open and spells out the last step ("open
   Instagram, start a Story, pick it").

Two separate **Download** buttons export without opening anything —
**Download image** (the PNG) and **Download video** (the MP4, hidden where the
browser cannot encode one).

### The video (MP4, music included)

"Post to Story" renders **15 seconds** of the animated template with the matched
song's preview as its audio track — `src/lib/storyVideo.js`:

- **Motion** — each template's `anim` config is evaluated by the pure helpers in
  `src/lib/storyMotion.js`, which every renderer shares: the vinyl disc spins
  (its photo rotates inside the clipped circle), the neon EQ bars dance **to the
  track's real frequency bands** (one-pole low/mid/high RMS windows computed per
  video frame from the decoded preview), the neon strip marquee-scrolls, photos
  Ken-Burns-zoom, and text/bars/tiles fade- and pop-in staggered. The live
  preview runs the same helpers on a rAF clock with synthetic EQ levels (it
  cannot hear the track), and honours `prefers-reduced-motion` by freezing on
  the settled frame.
- **Encode** — the canvas paints all 450 frames (15s × 30fps) into a Mediabunny
  `CanvasSource` (WebCodecs H.264 — hardware-accelerated where available) while
  the decoded, 15s-trimmed preview rides an `AudioBufferSource` (AAC) into the
  same MP4 (`fastStart`, so the metadata sits up front for social imports).
  Rendering runs faster than realtime — the modal shows a live percentage — and
  each frame waits on the encoder's own backpressure, so memory stays bounded.
  No `MediaRecorder`, no realtime recording wait.
- **Audio** — iTunes and Audius previews both serve with
  `Access-Control-Allow-Origin: *`, so the fetch is plain CORS. A failed
  fetch/decode — or a track with no free preview (Spotify-only cards) — exports
  a **silent video** (the EQ then bounces to a synthetic stand-in), announced in
  the modal's status line. The fetch + decode is pre-warmed while the user
  browses templates, so the click only pays for encoding.
- **Share** — the MP4 (`laradama-<platform>-story.mp4`) rides the same paths as
  the PNG: sheet-only on mobile (`navigator.share({files})`, nothing written to
  Downloads), explicit save-and-open on browsers without a sheet, and the two
  Download buttons for the manual route.
- **Support** — `canExportVideo()` probes for real WebCodecs encoders (H.264 at
  1080×1920 + AAC) once on load. iOS Safari (16.4+) and current Chrome (desktop
  and Android) qualify; anything without them keeps the PNG flow end-to-end and
  the buttons label themselves "image". Mediabunny is code-split behind the
  modal, so none of its bytes load on the initial page.


## Local Setup

Copy `.env.local.example` to `.env.local` and fill it in (`.env.local` is
git-ignored, the example file is not), then start the dev server. Vite reads env
files **at startup only** — restart `npm run dev` after editing.

| key | powers | without it |
| --- | --- | --- |
| `GEMINI_API_KEY` | subject/custom-scan recognition (stage 2) and the photo's "why" copy | local color analysis only — **custom scans can never fire**, so a new photo of a pinned subject is matched by mood like any other picture |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | "Listen on Spotify" resolving to a real track URL | search-URL fallback on that button |
| *(none needed)* | iTunes/Audius matching, the perceptual-hash stage | — |

Free Gemini key: <https://aistudio.google.com/apikey>

## Custom Scans

Pinned image → specific song mappings, defined in `src/data/customMatches.js`.
When an upload is recognized as one of these entries, that song is pinned as the
first card of the swipe deck (mood-matched songs follow behind it).

Recognition runs in two stages, cheapest first:

1. **Perceptual hash** — if an entry lists `refImages` (files dropped into
   `public/refs/`), the upload is compared against them offline. Catches the
   exact file, plus — through four hashes per file (`base`, `hflip`, `vflip`,
   `crop`) — mirrored, flipped and lightly re-cropped copies of it. Skipped
   entirely when no entry has images.
   **A different photo of the same person never matches here.** dHash sees
   pixels, not faces: two different shots of one subject land ~20-30 bits apart
   out of 64, while the threshold is 12. List *every* photo you have as a ref;
   each one only covers itself.
2. **Identity check** — when the entry has `refImages`, the upload plus two of
   those photos are sent to Gemini as their **own request**: it describes both
   faces and writes the differences down *before* answering
   (`samePerson` / `confidence`), and only a hit at confidence ≥ **0.8** sets
   `customId`. The separate call is deliberate — letting the mood call guess
   instead pinned unrelated photos twice during development (a team portrait
   and a group selfie both came back "same face" at 0.95). Costs one extra
   vision call per upload, and requires `GEMINI_API_KEY`; without it the upload
   simply falls back to normal mood matching (see *Troubleshooting* below).
   Entries with `keywords` but no refs keep the cheaper path: keywords and
   `description` ride along inside the mood call.

`refImages` are therefore what make a **new** photo of the person pin — list
every photo you have (the first two feed the face check, all of them feed the
hash stage). Keep the `description` too: it still drives recognition for
entries without refs, and for photos where the face is not visible but the
jersey or meme text is. Text that appears *in* the photo is worth putting in
`keywords` as well — reading text is what vision models do best.

Adding an entry:

```js
// entries below copied from src/data/customMatches.js — rene-baterbonia has
// refImages + identity check; the four F1 drivers (max-verstappen,
// lewis-hamilton, charles-leclerc, lando-norris) ship with refImages: [] and
// rely on the keyword/description mood-call path until photos land in public/refs/.
{
  id: 'rene-baterbonia',            // unique slug, returned as customId
  subject: 'Rene Baterbonia',       // badge shown on the card
  keywords: ['rene baterbonia', 'bituin ng mindanao'],
                                    // names + text that may appear in the photo
  description: 'Young Filipino basketball player, slim build, short black hair, ' +
               'jersey number 2 (Ateneo / Pilipinas / DAVRAA)…',
                                    // how he LOOKS — required for new photos
  refImages: ['/refs/rene-1.jpg', '/refs/rene-2.jpg', '/refs/rene-3.jpg'],
                                    // hash refs + face-compare refs, under /public
  hashDistance: 12,                 // optional, of 64 — default 12
  title: 'BITUIN NG MINDANAO',
  artist: 'UGAT NG LAHI',
  spotifyId: '7m37yuaoYE9UN3fjXP2Dg4', // verify via open.spotify.com/oembed
  audio: { title: 'Bituin Ng Mindanao (Reggae Version)', artist: 'Kaki' },
                                  // optional: stand-in that supplies the preview
  tag: 'meme · opm',
  why: '…why it fits, key phrases in <b>tags</b>…',
}
```

Playback: the entry's title/artist are searched on Audius, then iTunes, gated on
title **and** artist similarity so a same-named song by someone else is never
played. If neither source has a free preview (common for new releases), the card
keeps its default progress-bar player — no inline Spotify embed.

Pick a `title` that actually exists on **Audius or iTunes**: a Spotify-only
release has no free preview, so with nothing else set the card sits at
**`no audio`** with its play button disabled (the *Listen on Spotify* link still
works). The Rene entry is Spotify-only — *Bituin ng Mindanao* by **UGAT NG LAHI**
— so it sets `audio: { title, artist }` to a recording that does have an iTunes
preview (Kaki's reggae cover). The card still reads **BITUIN NG MINDANAO /
UGAT NG LAHI** and keeps the original Spotify id; only the 30s clip comes from the
stand-in, and the title+artist gate still rejects any *other* recording. Check an
entry with `node scripts/smoke-test.mjs`: it prints the resolved preview URL, or
`null` when even the stand-in has no free source.

### Why didn't my photo pin its song?

Every scan logs exactly one decision line to the browser console — upload once
and read it:

- `[custom-scan] hash hit → "rene-baterbonia" (distance 4/64)` — stage 1 fired:
  the upload *is* (a mirror/crop of) one of the `refImages`.
- `[custom-scan] no hash hit → vision source="gemini" customId="rene-baterbonia" (face match 0.95 — none)`
  → stage 2 fired: the identity call said "same person". The parenthetical is
  `customEvidence`; on a rejection it reads `identity miss (0.9) — <differences>`
  and names what the model saw as different, which is usually the clue you need.
  A trailing `[cached]` means this exact photo was already judged this session
  and no API call was made.
- `vision source="local" … customId=""` → **Gemini never ran.** The warning above
  it (`[vision] Gemini unavailable …`) has the reason; the usual one is a missing
  `GEMINI_API_KEY` in `.env.local`. Recognition is impossible without it.
- `customId="" (identity miss …)` → Gemini compared the faces and said no. If you
  believe the photo *is* the person, add a clearer reference photo (front-facing,
  decent light) — the face check only ever sees the first two refs.
- `customId="" (identity error …)` → the identity call failed (429/503/unparseable
  output). The app fails safe and pins nothing rather than pinning wrong.

### How fast is a scan?

A scan makes at most **two** Gemini calls (mood + identity), fired together —
and track search starts the moment mood returns rather than waiting for the
face check, so the identity verdict, the pinned card's title lookup and the
track search all overlap. Each stage logs its own duration:

- `[vision] mood call 4.1s` — mood/scene writing.
- `[vision] identity call 2.1s → hit` — the face check. A hit or miss is
  remembered for the session, so the same photo next time logs
  `[vision] identity cache 0.0s` and spends no quota.
- `[vision] rerank 1.9s (gemini-3.5-flash-lite)` — optional card-ordering pass.
  Skipped entirely when a card is already pinned (that card is #1 anyway, and
  `findTracks` has already ranked the rest by photo fit); a failure here just
  leaves the deck in default order.

Both calls run on `VISION_MODELS`, which leads with `gemini-3.5-flash-lite`:
measured ~10× faster than the strong model (2.5–3.5s vs 23–54s), with the
prompts carrying the quality — describe-both-faces-then-compare is what kept it
honest on the negative controls, and the mood/rerank outputs are short
structured objects rather than prose. `gemini-3.5-flash` and `gemini-3.8-flash`
follow as backstops for unparseable output or an outage.

The rest of the wait is bounded too: the identity upload is downscaled to 512px
(refs to 256px — a face comparison does not need the 768px the mood call uses);
two consecutive **429**s end the retry loop instead of spending another 30–60s
collecting more of them; the pinned card's title lookup queries Audius and
iTunes in parallel; and Spotify link resolution is capped at 3s — links are
best-effort, and the button falls back to a Spotify search link without one.
A hash hit skips all of it: it is a local color analysis only.

Replay both calls outside the browser with
`node scripts/vision-test.mjs path/to/photo.jpg` — it prints the mood profile,
the identity verdict and the pin/no-pin decision the app would make.
`node scripts/smoke-test.mjs` prints each entry's ref images, threshold and
description length, warns when a `refImages` file is missing from `public/`, and
confirms the pinned card resolves a playable preview.

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

## Brainrot Matching

`src/data/brainrotTracks.js` curates 26 meme cuts — Italian brainrot
(Tralalero Tralala, Bombardiro Crocodilo…), international memes (6 7, Sigma,
Skibidi…) and Pinoy novelty (Budots/Paro Paro G, Kaloka, Walang Imposible…) —
but the matcher only reaches for them when the photo's vibe can carry it:

- **Eligibility** — `brainrotEligible()`: `energy ≥ 0.65` **and**
  `valence ≥ 0.45` (energetic but not gloomy), **or** playful keywords in the
  mood/scene/tags (`party`, `meme`, `dance`, `silly`…) with `valence ≥ 0.6`.
  An ineligible photo pays **zero** extra iTunes calls and builds exactly the
  deck it built before this feature existed.
- **Selection** — `brainrotFor()` picks the two pool entries closest to the
  photo's energy/valence, interleaving the three flavors and rotating per
  batch, so "next track" keeps meeting new cuts.
- **Search** — iTunes only (Audius' catalogue is nearly meme-free), one
  `title + artist` query per pick, gated on title ≥ 0.8 **and** artist ≥ 0.5
  token overlap — the same bars as `findTrackForTitle`, so a same-named song
  by an unrelated act never plays. Hits are tagged `brainrot: <flavor>`.
- **Ranking** — a pool credit is worth **+4**: brainrot beats an obscure mood
  hit but never outpoints a popular artist's **+10**.
- **Deck** — `deckFor()` takes `minBrainrot: 1` (max **2** of 6) for eligible
  photos, promoted from the tail into a mood-fit slot — never a popular slot,
  so the popular floor of 3 still holds. Both quotas can starve gracefully:
  no playable pick simply means no quota.
- **Card** — the tag pill reads `brainrot · italian` / `· meme` / `· opm`
  instead of the mood/genre pill.

iTunes' ~45-call/429 budget is unaffected for calm photos (nothing is added
to their query list) and costs at most 2 extra memoized queries per batch for
eligible ones; a 429 degrades the brainrot leg the same way it already
degrades the rest — the deck still fills from Audius and the mood/artist
searches.

Verify the whole thing with `node scripts/smoke-test.mjs` — it runs a calm
profile (expects `brainrot in deck: 0/6`) and a party profile (expects 1–2,
prints `◆brainrot(<flavor>)` per card) — and re-check every pool entry's
preview with `node scripts/smoke-test.mjs --pool`, which prints a `✗ … null`
line for anything iTunes has dropped (swap those entries out).

## F1 Matching

`src/data/f1Tracks.js` curates 12 F1 tracks — the four driver meme chants
(33 Max Verstappen, Lewis Hamilton, Charles Leclerc, Lando Norris), anthems
(Formula 1 Theme, Grand Prix variants), and memes (Turbo — F1, Drive to
Survive…) — and any photo whose analysis reads as F1 gets F1 music in its
deck:

- **Eligibility** — `f1Eligible()`: driver names/teams, `formula 1` /
  `grand prix`, or F1 vocabulary (`f1`, `podium`, `qualifying`, `paddock`…)
  anywhere in the mood/scene/tags/genres/searchQueries. When true, the F1
  pool is searched by title and merged into the deck ahead of mood hits.
- **Priority** — an F1-eligible photo also runs the custom-scan layer first:
  a recognized driver pins their own chant as card #1 (the card is deduped
  out of the mood deck), everything after that is from the F1 pool.
  An unrecognized F1 photo (random car, helmet, podium…) still gets the F1
  pool as the whole playlist.
- **Deck** — when F1 is eligible: `minF1: 4, maxF1: 6` of six slots,
  popular floor drops to 1, and the brainrot pool is suppressed (one curated
  pool wins per photo). A calm / non-F1 photo: identical behaviour to before.
- **Card** — the tag pill reads `f1 · <driver|anthem|meme>` instead of the
  mood/genre pill.

The four `customMatches` driver entries (`refImages: []`) still fire only on
a positive Gemini identity / mood-call recognition — until their ref photos
land in `public/refs/` they can miss, which is exactly why the F1 pool exists
as the safety net below them.

## Vision Model Note

`src/lib/vision.js` walks `VISION_MODELS` — `gemini-3.5-flash-lite`,
`gemini-3.5-flash`, `gemini-3.8-flash` — twice over to ride out spikes. The
older `gemini-2.x` ids now return **404** ("no longer available to new users")
on current API keys, which silently drops the app to local color analysis — no
Gemini mood profile and no subject recognition. If matching looks dull or
custom scans never hit, check `VISION_MODELS` first. Transient **5xx/404**
responses fall through to the next model instead of aborting, so a busy API
costs at most one extra call before the local fallback takes over; **429**s fall
through too, but two in a row end the loop immediately — a rate-limited key
will only answer 429 again, and that is the case behind
`[vision] mood call failed after …`.

## Development Rules

- Use React components
- Use Tailwind CSS for styling
- Keep components reusable
- Do not put API keys in frontend code
- Do not add unnecessary dependencies
- Follow the existing UI/UX prototype