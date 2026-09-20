import { useRef, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";

const skinTabs = [
  { id: "phone", label: "Phone" },
  { id: "browser", label: "Browser" },
  { id: "float", label: "Floating" },
];

export const songs = [
  {
    title: "Golden Hour Drift",
    artist: "Wren Solace",
    tag: "warm · nostalgic",
    gradient: "linear-gradient(135deg,#FF9A5A,#E8497A)",
    why: "Your photo's <b>warm backlight</b> and <b>soft golden tones</b> read as relaxed and nostalgic. This track's <b>mid-tempo groove</b> and <b>dreamy layering</b> match that feeling — it's been trending in golden-hour edits this week.",
  },
  {
    title: "Static Bloom",
    artist: "Nightflor",
    tag: "moody · electric",
    gradient: "linear-gradient(135deg,#3B2FD9,#B23BD9)",
    why: "Cool blue tones and high-contrast backlighting in your photo read as moody and electric. This track's slow synth build and restrained tempo mirror that tension — trending among late-night, city-lights edits.",
  },
  {
    title: "Paper Cranes",
    artist: "Mika Ude",
    tag: "soft · minimal",
    gradient: "linear-gradient(135deg,#F7C6D9,#C9B6F0)",
    why: "The soft pastel palette and minimal composition in your image felt quiet and intentional. This stripped-back acoustic track carries that same restraint — currently trending in slow-living content.",
  },
  {
    title: "Concrete Bloom",
    artist: "Jinho & the Static",
    tag: "urban · energetic",
    gradient: "linear-gradient(135deg,#3A3A3E,#1ED760)",
    why: "Sharp shadows and motion blur in your photo read as urban and kinetic. This track's punchy bassline and upbeat tempo match that energy — one of this week's fastest-climbing tracks.",
  },
];

export const storyTemplates = [
  { id: "clean", label: "Clean" },
  { id: "meme", label: "Meme" },
  { id: "vinyl", label: "Vinyl" },
  { id: "neon", label: "Neon" },
];

const stats = [
  { value: "2.3s", label: "avg. match time" },
  { value: "40+", label: "moods recognized" },
  { value: "∞", label: "swipes to reshuffle" },
];

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="#1ED760" strokeWidth="1.6" />
    <path
      d="M7 10.2c3-1 7-.6 9.3.9M7.3 13.2c2.4-.7 5.6-.4 7.6.8M7.6 16.1c2-.5 4.4-.3 6 .6"
      stroke="#1ED760"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="5" stroke="#fff" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="3.6" stroke="#fff" strokeWidth="1.7" />
    <circle cx="16.4" cy="7.6" r="1" fill="#fff" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M14 8.5h2V5.3c-.35-.05-1.55-.15-2.95-.15-2.9 0-4.9 1.77-4.9 5.02V13H5.3v3.6h2.85V21h3.6v-4.4h2.75l.44-3.6h-3.19V10.5c0-1.04.28-1.75 2.05-1.75z"
      fill="#fff"
    />
  </svg>
);

export function renderStoryTemplate(s, id, uploadedImage = null) {
  const bg = uploadedImage
    ? `background-image:url(${uploadedImage})`
    : `background:${s.gradient}`;
  if (id === "clean") {
    return `<div class="ld-story-bg" style="${bg}"></div><div class="ld-story-scrim-b"></div><div class="ld-story-wm"><span class="ld-dotmark"></span>Laradama</div><div class="ld-story-info"><div class="ld-story-title">${s.title}</div><div class="ld-story-artist">${s.artist} · trending now</div></div>`;
  }
  if (id === "meme") {
    return `<div class="ld-story-bg contain" style="${bg}"></div><div class="ld-meme-bar top">my photo's soundtrack is</div><div class="ld-meme-bar bottom">${s.title}</div>`;
  }
  if (id === "vinyl") {
    return `<div class="ld-story-bg blurbg" style="${bg}"></div><div class="ld-vinyl-disc"><div class="ld-vinyl-photo" style="${bg}"></div><div class="ld-vinyl-grooves"></div><div class="ld-vinyl-hole"></div></div><div class="ld-vinyl-caption">${s.title} — ${s.artist}</div><div class="ld-story-wm corner"><span class="ld-dotmark"></span>laradama.ai</div>`;
  }
  if (id === "neon") {
    return `<div class="ld-story-bg" style="${bg}"></div><div class="ld-neon-duotone"></div><div class="ld-neon-eq">${"<span></span>".repeat(7)}</div><div class="ld-neon-title">${s.title}</div><div class="ld-neon-wm-strip">LARADAMA.AI &nbsp;•&nbsp; LARADAMA.AI &nbsp;•&nbsp; LARADAMA.AI</div>`;
  }
  return "";
}

export default function Hero() {
  const fileInputRef = useRef(null);
  const demoRef = useRef(null);

  const [idx, setIdx] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [skin, setSkin] = useState("phone");
  const [swipeDir, setSwipeDir] = useState(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState("clean");
  const [currentPlatform, setCurrentPlatform] = useState("Instagram");

  const song = songs[idx];

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target.result);
      setIdx(0);
      setWhyOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSwipe = (dir) => {
    if (swipeDir) return;
    setSwipeDir(dir);
    setTimeout(() => {
      setIdx((i) => (i + 1) % songs.length);
      setWhyOpen(false);
      setSwipeDir(null);
    }, 240);
  };

  const watchMatch = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const templateInner = (s, id) => renderStoryTemplate(s, id, uploadedImage);

  const openStoryModal = (platform) => {
    setCurrentPlatform(platform);
    setCurrentTemplate("clean");
    setModalOpen(true);
  };

  const closeStoryModal = () => setModalOpen(false);

  const handleShare = () => {
    const t = storyTemplates.find((x) => x.id === currentTemplate);
    alert(
      `This would post the "${t.label}" Story — your photo, "${song.title}" by ${song.artist}, and the Laradama watermark — to your ${currentPlatform} Story.`,
    );
    closeStoryModal();
  };

  const swipeStyle = swipeDir
    ? {
        transform: `translateX(${swipeDir === "skip" ? "-140%" : "140%"}) rotate(${swipeDir === "skip" ? "-10" : "10"}deg)`,
        opacity: 0,
      }
    : undefined;

  return (
    <>
      <section className="relative overflow-hidden bg-[#121212]">
      <div className="mx-auto grid max-w-295 grid-cols-1 items-center gap-10 px-6 pt-16 pb-24 sm:px-8 xl:grid-cols-2">
        {/* Left copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-none border border-laradama-brand/25 bg-laradama-brand/10 px-3 py-1.5 font-mono text-xs tracking-[0.02em] text-laradama-brand">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-none bg-laradama-brand" />
            NOW MATCHING TRENDING TRACKS
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-laradama-ink sm:text-5xl sm:leading-[1.04] xl:text-6xl">
            Every image <br />
            has a <span className="text-laradama-brand">soundtrack.</span>
          </h1>
          <p className="mt-6 max-w-120 text-lg leading-relaxed text-laradama-dim">
            Upload or capture a photo. Laradama App reads its mood, color, and
            motion, then matches it to a trending song — instantly. Don't like
            the pick? Swipe for another.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={openFilePicker}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-none bg-laradama-brand px-6 py-3.5 text-[15.5px] font-bold text-[#06170C] transition hover:-translate-y-0.5 hover:bg-laradama-brand-hover sm:w-auto"
            >
              <Plus size={17} strokeWidth={2.4} /> Upload a photo
            </button>
            <button
              type="button"
              onClick={watchMatch}
              className="inline-flex w-full items-center justify-center gap-2 rounded-none border border-laradama-line px-6 py-3 text-[15px] font-semibold text-laradama-ink transition hover:border-laradama-dimmer hover:bg-laradama-elevated sm:w-auto"
            >
              Watch it match <ArrowRight size={16} />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <p className="mt-3 font-mono text-xs tracking-[0.02em] text-laradama-dimmer">
            Try it — pick any photo, your match updates live in the demo →
          </p>
          <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-6 sm:gap-x-7">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span className="font-display text-[22px] font-bold text-laradama-ink">{s.value}</span>
                <span className="text-xs text-laradama-dimmer">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right interactive demo */}
        <div className="relative mx-auto w-full">
          <div className="ld-frame-tabs">
            {skinTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSkin(t.id)}
                className={`ld-frame-tab ${skin === t.id ? "active" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ld-phone-stage">
            <div className="ld-floaty a" />
            <div className="ld-floaty b" />
            <div ref={demoRef} className={`ld-device-frame ld-skin-${skin}`}>
              <div className="ld-phone-notch" />
              <div className="ld-browser-bar">
                <span className="ld-bdot r" />
                <span className="ld-bdot y" />
                <span className="ld-bdot g" />
                <span className="ld-browser-url">laradama.ai/match</span>
              </div>
              <div className="ld-phone-screen">
                <div className="ld-phone-topbar">
                  {uploadedImage ? (
                    <>
                      <div className="ld-topbar-photo">
                        <img src={uploadedImage} alt="Your uploaded photo" />
                        <span className="ld-tlabel">MATCHED FROM YOUR PHOTO</span>
                      </div>
                      <button type="button" className="ld-change-photo-btn" onClick={openFilePicker}>
                        change
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="ld-tlabel">STEP 1 — ADD A PHOTO</span>
                      <span className="ld-tlabel">0 / 4</span>
                    </>
                  )}
                </div>
{!uploadedImage && (
                <div className="ld-phone-upload-cta" id="phoneUploadCta" role="button" tabIndex={0} onClick={openFilePicker} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFilePicker(); }}>
                  <div className="ld-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#1ED760" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#1ED760" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h4>Upload a photo</h4>
                  <p>Drop in an image and Laradama will match it to a trending song, right here.</p>
                </div>
                )}
                {uploadedImage && (
                <div className="ld-card-stack">
                  <div
                    className="ld-song-card"
                    style={swipeStyle}
                  >
                    <div className="ld-art">
                      <div
                        className="ld-art-blur"
                        style={
                          uploadedImage
                            ? { backgroundImage: `url(${uploadedImage})` }
                            : { background: song.gradient }
                        }
                      />
                      {uploadedImage && (
                        <div
                          className="ld-art-fit"
                          style={{ backgroundImage: `url(${uploadedImage})` }}
                        />
                      )}
                      <div className="ld-scrim" />
                      <div className="ld-photo-badge">
                        <img src={uploadedImage || ""} style={uploadedImage ? undefined : { display: "none" }} alt="" />
                        <span>{uploadedImage ? "YOUR PHOTO" : song.tag.toUpperCase()}</span>
                      </div>
                      <div className="ld-eq">
                        <span style={{ animationDelay: "0s" }} />
                        <span style={{ animationDelay: ".15s" }} />
                        <span style={{ animationDelay: ".3s" }} />
                        <span style={{ animationDelay: ".1s" }} />
                        <span style={{ animationDelay: ".25s" }} />
                      </div>
                      <span className="ld-tagpill">{song.tag}</span>
                    </div>
                    <div className="ld-info">
                      <div className="ld-title">{song.title}</div>
                      <div className="ld-artist">{song.artist}</div>
                      <div className="ld-progress"><div /></div>
                      <div className="ld-time-row">
                        <span>0:42</span>
                        <span>2:58</span>
                      </div>
                      <span className="ld-share-label">LISTEN & SHARE</span>
                      <div className="ld-action-row">
                        <button className="ld-spotify-btn" id="spotifyBtn" type="button" aria-label="Listen on Spotify" onClick={() => window.open("https://open.spotify.com/search/" + encodeURIComponent(`${song.title} ${song.artist}`), "_blank")}>
                          <SpotifyIcon /> Listen on Spotify
                        </button>
                        <button className="ld-icon-btn ig" id="igBtn" type="button" aria-label="Add to Instagram Story" title="Add to Instagram Story" onClick={() => openStoryModal("Instagram")}>
                          <InstagramIcon />
                        </button>
                        <button className="ld-icon-btn fb" id="fbBtn" type="button" aria-label="Add to Facebook Story" title="Add to Facebook Story" onClick={() => openStoryModal("Facebook")}>
                          <FacebookIcon />
                        </button>
                      </div>
                      <button className="ld-why-toggle" id="ldWhyToggle" type="button" onClick={() => setWhyOpen((v) => !v)}>
                        <span>✦</span> Why this song?
                      </button>
                      <div className={`ld-why-panel${whyOpen ? " open" : ""}`} id="ldWhyPanel">
                        <span className="ld-why-label">✦ AI EXPLANATION</span>
                        <span dangerouslySetInnerHTML={{ __html: song.why }} />
                      </div>
                    </div>
                  </div>
                  <div className="ld-swipe-controls">
                    <button className="ld-swipe-btn skip" id="skipBtn" type="button" aria-label="Skip this song" onClick={() => handleSwipe("skip")}>
                      <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#ff8080" strokeWidth="2.2" strokeLinecap="round" /></svg>
                    </button>
                    <button className="ld-swipe-btn keep" id="keepBtn" type="button" aria-label="Keep this song" onClick={() => handleSwipe("keep")}>
                      <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#06170C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>
)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
{/* ===== STORY TEMPLATE MODAL (clean / meme / vinyl / neon) ===== */}
      <div
        className={`ld-modal-overlay ${modalOpen ? "open" : ""}`}
        id="storyModal"
        onClick={(e) => { if (e.target.id === "storyModal") closeStoryModal(); }}
      >
        <div className="ld-modal-panel">
          <div className="ld-modal-head">
            <div>
              <h3>Choose a story template</h3>
              <p>
                Your photo, the track, and a Laradama watermark — pick a style before
                posting to <span id="modalPlatform">{currentPlatform}</span>.
              </p>
            </div>
            <button className="ld-modal-close" id="modalClose" aria-label="Close" onClick={closeStoryModal}>✕</button>
          </div>
          <div
            className="ld-story-card ld-big"
            id="bigPreview"
            dangerouslySetInnerHTML={{ __html: templateInner(song, currentTemplate) }}
          />
          <div className="ld-template-grid" id="templateGrid">
            {storyTemplates.map((t) => (
              <div
                key={t.id}
                className={`ld-thumb-wrap${currentTemplate === t.id ? " selected" : ""}`}
                onClick={() => setCurrentTemplate(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setCurrentTemplate(t.id); }}
              >
                <div
                  className="ld-story-card thumb"
                  dangerouslySetInnerHTML={{ __html: templateInner(song, t.id) }}
                />
                <span className="ld-thumb-label">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="ld-modal-actions">
            <button className="ld-btn-ghost" id="modalCancel" onClick={closeStoryModal}>Cancel</button>
            <button className="ld-btn-primary" id="modalShare" onClick={handleShare}>Post to Story</button>
          </div>
        </div>
      </div>
  </>
  );
}