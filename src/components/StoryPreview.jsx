import { useEffect, useState } from 'react';
import { fillText, templates } from '../data/storyTemplates';
import {
  discAngleDeg,
  entranceP,
  eqHeightsAt,
  kenBurnsScale,
  popScale,
} from '../lib/storyMotion';

/**
 * Live preview of a story template.
 *
 * Renders the template's layers with inline styles built from the config in
 * src/data/storyTemplates.js — the same numbers the PNG export paints with, so
 * what you see here is what gets shared. Every design-px value becomes
 * `calc(N * var(--ld-u))`, where --ld-u (set on the .ld-story-card parent) is
 * 1px of the 150px design width; that keeps the big preview, the thumbnails and
 * the phone 2-up all proportional to the card.
 *
 * With `animated` (the modal's big preview) the layers also *move*: a rAF
 * clock feeds the same pure functions in src/lib/storyMotion.js the canvas
 * exporters run, so the spin / EQ / entrances here match the MP4. The EQ uses a
 * synthetic level stand-in — the preview cannot hear the track, the video
 * export can. Thumbnails stay still, and so does everything under
 * `prefers-reduced-motion` (the card then shows the settled frame, which is
 * exactly the PNG export).
 */

/** 1 design px of the card, expressed so it scales with the container. */
const du = (n) => `calc(${n} * var(--ld-u))`;

/** A top→bottom linear gradient from `{ stop, color }` stops (fractions of height). */
const gradientCss = (stops) =>
  `linear-gradient(180deg, ${stops.map((st) => `${st.color} ${st.stop * 100}%`).join(', ')})`;

/** Background for a photo slot: the uploaded image (cover) or the song gradient. */
const photoBg = (song, uploadedImage, fallback = '#0a0a0a') =>
  uploadedImage
    ? { backgroundImage: `url(${uploadedImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: song?.gradient || fallback };

/** Ken Burns helper: a scale transform only when the template actually zooms. */
const zoomXf = (cfg, t, still) => {
  const k = kenBurnsScale(cfg.anim, t, still);
  return k !== 1 ? { transform: `scale(${k})` } : undefined;
};

/**
 * Elapsed seconds while `active`, else null (= draw the still frame). Honors
 * prefers-reduced-motion: those users get the settled layout, never motion.
 */
function useMotionTime(active) {
  const [elapsed, setElapsed] = useState(null);
  useEffect(() => {
    if (!active) return undefined;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const start = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      setElapsed((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return elapsed;
}

/** The Laradama logo + label, flush to a corner. */
function Watermark({ cfg, inline = false }) {
  const anchor = inline
    ? {}
    : cfg.center
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    : cfg.corner
      ? { bottom: du(cfg.edge), right: du(cfg.edge) }
      : { top: du(cfg.edge), left: du(cfg.edge) };
  return (
    <div
      style={{
        position: inline ? 'relative' : 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: du(cfg.gap),
        fontFamily: 'var(--font-display)',
        fontWeight: cfg.weight,
        fontSize: du(cfg.size),
        color: cfg.color,
        zIndex: 2,
        ...anchor,
      }}
    >
      <img
        src={cfg.logo}
        alt=""
        style={{ display: 'block', width: du(cfg.mark), height: du(cfg.mark), borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }}
      />
      {cfg.text}
    </div>
  );
}

function Clean({ cfg, song, uploadedImage, t, still }) {
  const p = entranceP(cfg.anim, t, still);
  const rise = (1 - p) * (cfg.anim?.rise ?? 0);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, ...photoBg(song, uploadedImage), ...zoomXf(cfg, t, still) }} />
      <div style={{ position: 'absolute', inset: 0, background: gradientCss(cfg.scrim) }} />
      <Watermark cfg={cfg.watermark} />
      <div
        style={{
          position: 'absolute',
          left: du(cfg.info.inset),
          right: du(cfg.info.inset),
          bottom: du(cfg.info.inset),
          zIndex: 2,
          opacity: p,
          transform: rise ? `translateY(${du(rise)})` : undefined,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: cfg.info.title.weight,
            color: cfg.info.title.color,
            fontSize: du(cfg.info.title.size),
            lineHeight: cfg.info.title.lineHeight,
          }}
        >
          {fillText(cfg.info.title.text, song)}
        </div>
        <div
          style={{
            color: cfg.info.artist.color,
            fontSize: du(cfg.info.artist.size),
            lineHeight: cfg.info.artist.lineHeight,
            marginTop: du(cfg.info.artist.marginTop),
          }}
        >
          {fillText(cfg.info.artist.text, song)}
        </div>
      </div>
    </>
  );
}

function Meme({ cfg, song, uploadedImage, t, still }) {
  const rise = cfg.anim?.rise ?? 0;
  const barBase = (p, dir) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    background: cfg.bar.bg,
    color: cfg.bar.color,
    fontFamily: 'var(--font-display)',
    fontWeight: cfg.bar.weight,
    textTransform: cfg.bar.uppercase ? 'uppercase' : 'none',
    textAlign: cfg.bar.align,
    lineHeight: cfg.bar.lineHeight,
    padding: `${du(cfg.bar.padY)} ${du(cfg.bar.padX)}`,
    boxSizing: 'border-box',
    zIndex: 2,
    opacity: p,
    transform: (1 - p) * rise ? `translateY(${du((1 - p) * rise * dir)})` : undefined,
  });
  const pTop = entranceP(cfg.anim, t, still);
  const pBottom = entranceP(cfg.anim, t - (cfg.anim?.stagger ?? 0), still);
  return (
    <>
      {/* Backdrop mode comes from the config the canvas export also reads. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...photoBg(song, uploadedImage, '#000'),
          backgroundSize: cfg.backdrop === 'contain' ? 'contain' : 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000',
        }}
      />
      <div style={{ ...barBase(pTop, -1), top: 0, fontSize: du(cfg.top.size) }}>
        {fillText(cfg.top.text, song)}
      </div>
      <div
        style={{
          ...barBase(pBottom, 1),
          bottom: 0,
          fontSize: du(cfg.bottom.size),
        }}
      >
        {fillText(cfg.bottom.text, song)}
        {/* The logo lives *outside* the bar, resting on its top edge.
            `bottom: 100%` anchors it to the bar's own top edge, so it rides
            up automatically as the title wraps onto more lines — and the bar
            itself stays free to grow with the text (no reserved min-height
            or right padding), exactly like the canvas export lays it out. */}
        <img
          src={cfg.logo.src}
          alt=""
          style={{
            position: 'absolute',
            right: du(cfg.logo.right),
            bottom: '100%',
            marginBottom: du(cfg.logo.bottom),
            width: du(cfg.logo.size),
            height: du(cfg.logo.size),
            borderRadius: '50%',
            objectFit: 'contain',
          }}
        />
      </div>
    </>
  );
}

function Vinyl({ cfg, song, uploadedImage, t, still }) {
  const grooves = cfg.grooves.widths.map((w) => `inset 0 0 0 ${du(w)} ${cfg.grooves.color}`).join(', ');
  const discBottom = `${(cfg.disc.cy + cfg.disc.size / 2) * 100}%`;
  const captionTop = `calc(${discBottom} + ${du(cfg.caption.gap)})`;
  const watermarkBottom = du(cfg.watermark.edge);
  const angle = discAngleDeg(cfg.anim, t, still);
  const capP = entranceP(cfg.anim, t, still);
  const capRise = (1 - capP) * (cfg.anim?.rise ?? 0);
  const kb = kenBurnsScale(cfg.anim, t, still);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...photoBg(song, uploadedImage),
          filter: 'blur(16px) brightness(0.4)',
          transform: `scale(${1.3 * kb})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${cfg.disc.cx * 100}%`,
          top: `${cfg.disc.cy * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: `${cfg.disc.size * 100}%`,
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          background: cfg.disc.bg,
          boxShadow: `0 ${du(cfg.disc.shadowY)} ${du(cfg.disc.shadowBlur)} ${cfg.disc.shadowColor}`,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden', // the spinning photo square stays clipped round
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: `${cfg.photo.inset * 100}%`,
            borderRadius: '50%',
            ...photoBg(song, uploadedImage, cfg.disc.bg),
            transform: angle ? `rotate(${angle}deg)` : undefined,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: grooves }} />
        <div style={{ width: `${cfg.hole.size * 100}%`, aspectRatio: '1 / 1', borderRadius: '50%', background: cfg.hole.bg, boxShadow: `0 0 0 ${du(cfg.hole.ring)} ${cfg.hole.ringColor}`, zIndex: 3 }} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `calc(${captionTop} + ${du(cfg.caption.gap)})`,
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          color: cfg.caption.color,
          lineHeight: cfg.caption.lineHeight,
          padding: `0 ${du(cfg.caption.padX)}`,
          zIndex: 2,
          opacity: capP,
          transform: capRise ? `translateY(${du(capRise)})` : undefined,
        }}
      >
        <div style={{ fontSize: du(cfg.caption.title.size), fontWeight: cfg.caption.title.weight }}>
          {fillText(cfg.caption.title.text, song)}
        </div>
        <div style={{ marginTop: du(cfg.caption.artist.marginTop), fontSize: du(cfg.caption.artist.size), fontWeight: cfg.caption.artist.weight }}>
          {fillText(cfg.caption.artist.text, song)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: '50%', bottom: watermarkBottom, transform: 'translateX(-50%)', zIndex: 4 }}>
        <Watermark cfg={{ ...cfg.watermark, center: false }} inline />
      </div>
    </>
  );
}

function Neon({ cfg, song, uploadedImage, t, still }) {
  const baseY = cfg.eq.bottom; // baseline, fraction of height from the top edge going up
  const heights = eqHeightsAt(cfg.anim, null, t, still, cfg.eq.heights);
  const titleP = entranceP(cfg.anim, t, still);
  const stripText = fillText(cfg.strip.text, song);
  const loopSeconds = cfg.anim?.strip?.loopSeconds ?? 9;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, ...photoBg(song, uploadedImage), ...zoomXf(cfg, t, still) }} />
      <div style={{ position: 'absolute', inset: 0, background: cfg.duotone.gradient, mixBlendMode: cfg.duotone.blend, zIndex: 1 }} />
      <Watermark cfg={cfg.watermark} />
      {/* Bars sit on the eq baseline and grow upward — still-frame heights,
          dancing ones once the card is animated. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${baseY * 100}%`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: du(cfg.eq.gap),
          zIndex: 2,
        }}
      >
        {heights.map((h, i) => (
          <span key={i} style={{ display: 'block', width: du(cfg.eq.width), height: du(h), background: cfg.eq.color }} />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${cfg.title.bottom * 100}%`,
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: cfg.title.weight,
          color: cfg.title.color,
          fontSize: du(cfg.title.size),
          lineHeight: cfg.title.lineHeight,
          letterSpacing: cfg.title.letterSpacing,
          textShadow: `0 0 ${du(cfg.title.shadowBlur * titleP)} ${cfg.title.shadowColor}`,
          padding: `0 ${du(cfg.title.padX)}`,
          zIndex: 2,
          opacity: titleP,
        }}
      >
        {fillText(cfg.title.text, song)}
      </div>
      {still ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            background: cfg.strip.bg,
            color: cfg.strip.color,
            fontFamily: 'var(--font-mono)',
            fontSize: du(cfg.strip.size),
            lineHeight: cfg.strip.lineHeight,
            padding: `${du(cfg.strip.padY)} 0`,
            textAlign: 'center',
            letterSpacing: cfg.strip.letterSpacing,
            zIndex: 2,
          }}
        >
          {stripText}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            background: cfg.strip.bg,
            color: cfg.strip.color,
            fontFamily: 'var(--font-mono)',
            fontSize: du(cfg.strip.size),
            lineHeight: cfg.strip.lineHeight,
            padding: `${du(cfg.strip.padY)} 0`,
            overflow: 'hidden',
            letterSpacing: cfg.strip.letterSpacing,
            zIndex: 2,
          }}
        >
          {/* Two identical copies; the -50% keyframe shifts exactly one, so the
              loop is seamless. The trailing separator matches the canvas. */}
          <div className="ld-strip-marquee" style={{ animationDuration: `${loopSeconds}s` }} aria-hidden="true">
            <span>{stripText}{'\u00A0\u00A0•\u00A0\u00A0'}</span>
            <span>{stripText}{'\u00A0\u00A0•\u00A0\u00A0'}</span>
          </div>
        </div>
      )}
    </>
  );
}

function Collage({ cfg, song, uploadedImage, t, still }) {
  const tileCount = cfg.cols * cfg.rows;
  // The caption bar arrives after the last tile has popped.
  const capP = entranceP(cfg.anim, t - tileCount * (cfg.anim?.stagger ?? 0) - 0.15, still);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: cfg.bg }} />
      <div
        style={{
          position: 'absolute',
          top: du(cfg.pad),
          left: du(cfg.pad),
          right: du(cfg.pad),
          bottom: du(cfg.pad + cfg.bottomReserve),
          display: 'grid',
          gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${cfg.rows}, minmax(0, 1fr))`,
          gap: du(cfg.gap),
        }}
      >
        {Array.from({ length: tileCount }, (_, i) => {
          const { scale, alpha } = popScale(cfg.anim, t, i, still);
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: du(cfg.tile.radius),
                boxShadow: `inset 0 0 0 ${du(cfg.tile.borderWidth)} ${cfg.tile.border}`,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                opacity: alpha,
              }}
            >
              <div style={{ position: 'absolute', inset: 0, ...photoBg(song, uploadedImage, '#191919'), ...zoomXf(cfg, t, still) }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: gradientCss(cfg.scrim) }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: du(cfg.bar.height), background: cfg.bar.bg, opacity: capP }}>
        {/* Brand lockup only. */}
        <div
          style={{
            position: 'absolute',
            top: du(cfg.brand.y),
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: du(cfg.brand.gap),
            fontFamily: 'var(--font-display)',
            fontWeight: cfg.brand.weight,
            fontSize: du(cfg.brand.size),
            lineHeight: 1,
            color: cfg.brand.color,
          }}
        >
          <img
            src={cfg.brand.logo}
            alt=""
            style={{ display: 'block', width: du(cfg.brand.mark), height: du(cfg.brand.mark), borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }}
          /          >
          {cfg.brand.text}
        </div>
      </div>
    </>
  );
}

const RENDERERS = { clean: Clean, meme: Meme, vinyl: Vinyl, neon: Neon, collage: Collage };

/**
 * Render a template's layers. Wrap in a `.ld-story-card` (which supplies the
 * positioning context and the --ld-u scale unit).
 *
 * @param {{song: object, templateId: string, uploadedImage?: string|null, animated?: boolean}} props
 */
export default function StoryPreview({
  song,
  templateId,
  uploadedImage = null,
  animated = false,
  className = '',
  id,
  style,
}) {
  const cfg = templates[templateId] || templates.clean;
  const Template = RENDERERS[templateId] || Clean;
  const t = useMotionTime(animated);
  const cardClassName = ['ld-story-card', className].filter(Boolean).join(' ');

  return (
    <span className={cardClassName} id={id} style={style}>
      <Template cfg={cfg} song={song} uploadedImage={uploadedImage} t={t ?? 0} still={t === null} />
    </span>
  );
}
