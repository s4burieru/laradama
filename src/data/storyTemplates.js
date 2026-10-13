/**
 * STORY TEMPLATES — the single source of truth.
 *
 * Every editable value a story template uses (sizes, colours, layout, copy)
 * lives in this one file, expressed in "design px" measured against a 150px-wide
 * card — the size of the modal's big preview. Two renderers read it:
 *
 *   • src/components/StoryPreview.jsx  → the live preview (picker + modal)
 *   • src/lib/storyImage.js            → the 1080×1920 PNG export
 *
 * Because they share these numbers, the preview and the exported PNG can never
 * drift apart. To restyle a template, edit its object below — no CSS or canvas
 * changes needed. `{title}` and `{artist}` in any `text` field are filled from
 * the matched song at render time. Percent-based values (fractions of the card
 * width/height) are written as 0–1 numbers and labelled with a `*Pct`/`cx`/`cy`
 * style name; everything else is design px.
 *
 * Each template may carry an `anim` block: the motion values behind the video
 * export (`src/lib/storyVideo.js`) and the live preview. The math both renderers
 * run lives in `src/lib/storyMotion.js`; only the numbers live here. `enter` is
 * the entrance fade/rise in ms, `stagger` the per-element delay in seconds,
 * `kenBurns` the photo zoom over the 15s clip (fraction of size), `rpm` the
 * vinyl spin, and the neon `eq`/`strip` values drive the dancing bars and the
 * scrolling marquee. The PNG export draws the *still* frame of the same config:
 * entrance finished, loops at phase 0, so a still PNG never changed shape.
 */

/** Fill `{title}` / `{artist}` placeholders from the song. Shared by both renderers. */
export function fillText(text, song) {
  return String(text ?? '')
    .replaceAll('{title}', song?.title ?? '')
    .replaceAll('{artist}', song?.artist ?? '');
}

/** Brand watermark shared by every template (override fields per template). */
const brand = {
  text: 'laradama',
  logo: '/laradama-logo.png',
  edge: 8, // design px in from the anchored corner
  gap: 0, // design px between the logo and the label
  mark: 26, // design px, square logo box
  size: 9, // design px, label font-size
  weight: 700,
  color: '#fff',
  corner: false, // true → bottom-right, false → top-left
};

export const templates = {
  clean: {
    id: 'clean',
    label: 'Clean',
    backdrop: 'cover', // cover | contain | blur
    anim: { enter: 600, rise: 8, kenBurns: 0.06 },
    scrim: [
      // vertical shading laid over the photo
      { stop: 0, color: 'rgba(0, 0, 0, 0)' },
      { stop: 0.5, color: 'rgba(0, 0, 0, 0)' },
      { stop: 1, color: 'rgba(0, 0, 0, 0.85)' },
    ],
    watermark: { ...brand },
    info: {
      inset: 10, // design px from the bottom / left / right edges
      title: { text: '{title}', size: 9, weight: 700, lineHeight: 1.2, color: '#fff' },
      artist: {
        text: '{artist}',
        size: 7,
        weight: 400,
        lineHeight: 1.2,
        color: 'rgba(255, 255, 255, 0.75)',
        marginTop: 1,
      },
    },
  },

  meme: {
    id: 'meme',
    label: 'Meme',
    backdrop: 'cover',
    anim: { enter: 420, stagger: 0.12, rise: 6 },
    bar: {
      bg: '#fff',
      color: '#000',
      weight: 700,
      uppercase: true,
      align: 'center',
      lineHeight: 1.25,
      padY: 5,
      padX: 6,
    },
    top: { text: "my photo's soundtrack is", size: 8 },
    bottom: { text: '{title}', size: 8 },
    // Logo sits *outside* the bottom bar, resting on top of it: `bottom` is the
    // design-px gap between the bar's top edge and the logo's bottom edge,
    // `right` the inset from the card's right edge. Both renderers anchor it to
    // the bar (not the card), so it follows the bar upward as the title wraps
    // onto more lines.
    logo: { src: brand.logo, bottom: 0, right: 3, size: 30 },
  },
    collage: {
    id: 'collage',
    label: '2x2 Collage',
    cols: 2,
    rows: 2,
    anim: { enter: 500, stagger: 0.09, tilePop: 0.06, kenBurns: 0.05 },
    pad: 10,
    gap: 2,
    bg: '#0d0d0d',
    bottomReserve: 28, // design px reserved at the bottom for the caption bar
    tile: { border: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, radius: 0 },
    scrim: [
      { stop: 0, color: 'rgba(0, 0, 0, 0.08)' },
      { stop: 0.75, color: 'rgba(0, 0, 0, 0.18)' },
      { stop: 1, color: 'rgba(0, 0, 0, 0.68)' },
    ],
    bar: { height: 34, bg: 'rgba(0, 0, 0, 0.4)' },
    brand: { text: brand.text, logo: brand.logo, mark: 28, gap: 0, size: 11, weight: 600, color: '#fff', y: 0 },
  },

  vinyl: {
    id: 'vinyl',
    label: 'Vinyl',
    backdrop: 'blur',
    anim: { enter: 500, rise: 6, rpm: 20, kenBurns: 0.05 },
    disc: {
      cx: 0.5, // centre as a fraction of card width
      cy: 0.38, // centre as a fraction of card height
      size: 0.62, // diameter as a fraction of card width
      bg: '#111',
      shadowBlur: 24,
      shadowY: 8,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
    },
    photo: { inset: 0.12 }, // inner photo circle, fraction of the disc
    grooves: { widths: [25, 18, 11, 4], color: 'rgba(255, 255, 255, 0.05)' },
    hole: { size: 0.08, bg: '#141416', ring: 2, ringColor: 'rgba(255, 255, 255, 0.14)' },
    caption: {
      title: { text: '{title}', size: 8, weight: 600 },
      artist: { text: '{artist}', size: 6, weight: 400, marginTop: 2 },
      lineHeight: 1.2,
      color: '#fff',
      padX: 10,
      gap: -10, // slightly overlaps the disc edge
      watermarkGap: 8, // design px between the caption and watermark
    },
    watermark: { ...brand, corner: false },
  },

  neon: {
    id: 'neon',
    label: 'Neon',
    backdrop: 'cover',
    anim: { enter: 700, kenBurns: 0.05, eq: { min: 6, max: 58 }, strip: { loopSeconds: 9 } },
    duotone: {
      gradient: 'linear-gradient(160deg, rgba(30, 215, 96, 0.55), rgba(255, 107, 74, 0.5))',
      fallback: 'rgba(30, 215, 96, 0.4)',
      blend: 'color',
    },
    watermark: { ...brand },
    eq: {
      width: 3,
      gap: 3,
      bottom: 0.24, // baseline as a fraction of card height
      color: '#fff',
      heights: [14, 30, 44, 22, 38, 18, 26], // still-frame bar heights (design px)
    },
    title: {
      text: '{title}',
      size: 8,
      weight: 500,
      lineHeight: 5,
      letterSpacing: '0.02em',
      color: '#fff',
      bottom: 0.13,
      padX: 8,
      shadowBlur: 8,
      shadowColor: 'rgba(0, 0, 0, 0.6)',
    },
    strip: {
      text: 'laradama  •  laradama  •  laradama',
      size: 6,
      weight: 400,
      lineHeight: 1.2,
      padY: 3,
      bg: 'rgba(0, 0, 0, 0.5)',
      color: 'rgba(255, 255, 255, 0.65)',
      letterSpacing: '0.04em',
    },
  },

};

/** Registry ({ id, label }) in declaration order — drives the picker + carousel. */
export const storyTemplates = Object.values(templates).map(({ id, label }) => ({ id, label }));
