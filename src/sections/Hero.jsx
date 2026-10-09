import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, FastForward, ImagePlus, Pause, Play, Plus, Rewind, SkipBack, SkipForward, X } from "lucide-react";
import { findMoreSongs, matchImageToTracks } from "../lib/match.js";
import { spotifySearchUrl } from "../lib/spotify.js";
import { renderStoryImage } from "../lib/storyImage.js";
import { canShareFiles, downloadStoryFile, shareStoryFile } from "../lib/storyShare.js";

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
  { id: "collage", label: "2x2 Collage" },
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

const fmtTime = (s) =>
  Number.isFinite(s) && s >= 0
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
    : "";

/**
 * Warms the browser cache for a track URL with a throwaway element, so that
 * when the card switches to that track playback starts from memory instead of
 * waiting on the network. Entries stay alive for the whole session on purpose.
 */
const warmedAudio = new Map();
const warmAudio = (url) => {
  if (!url || warmedAudio.has(url)) return;
  try {
    const a = new Audio();
    a.preload = "auto";
    a.src = url;
    warmedAudio.set(url, a);
  } catch {
    /* no Audio support → playback still works, just not pre-buffered */
  }
};

/**
 * Track length to show/seek against. Some streamers never report a duration
 * (Infinity), so fall back to how far the media has actually buffered — that
 * keeps the progress bar and the transport controls usable either way.
 */
const effectiveDuration = (el) => {
  if (Number.isFinite(el.duration) && el.duration > 0) return el.duration;
  const buffered = el.buffered;
  return buffered && buffered.length ? buffered.end(buffered.length - 1) : 0;
};

/** Dedupe key for a deck entry — must match the music layer's candidate keys. */
const trackKey = (s) => `${String(s?.title || "").toLowerCase()}::${String(s?.artist || "").toLowerCase()}`;

export function renderStoryTemplate(s, id, uploadedImage = null) {
  const bg = uploadedImage
    ? `background-image:url(${uploadedImage})`
    : `background:${s.gradient}`;
  // Brand mark shared by every template — the same file storyImage.js paints
  // into the exported PNG, so preview and export stay identical.
  const logo = `<img class="ld-story-logo" src="/laradama-logo.png" alt="">`;
  if (id === "clean") {
    return `<div class="ld-story-bg" style="${bg}"></div><div class="ld-story-scrim-b"></div><div class="ld-story-wm">${logo}laradama</div><div class="ld-story-info"><div class="ld-story-title">${s.title}</div><div class="ld-story-artist">${s.artist} · trending now</div></div>`;
  }
  if (id === "meme") {
    return `<div class="ld-story-bg contain" style="${bg}"></div><div class="ld-meme-bar top">${logo}my photo's soundtrack is</div><div class="ld-meme-bar bottom">${s.title}</div>`;
  }
  if (id === "vinyl") {
    return `<div class="ld-story-bg blurbg" style="${bg}"></div><div class="ld-vinyl-disc"><div class="ld-vinyl-photo" style="${bg}"></div><div class="ld-vinyl-grooves"></div><div class="ld-vinyl-hole"></div></div><div class="ld-vinyl-caption">${s.title} — ${s.artist}</div><div class="ld-story-wm corner">${logo}laradama</div>`;
  }
  if (id === "neon") {
    return `<div class="ld-story-bg" style="${bg}"></div><div class="ld-neon-duotone"></div><div class="ld-story-wm">${logo}laradama</div><div class="ld-neon-eq">${"<span></span>".repeat(7)}</div><div class="ld-neon-title">${s.title}</div><div class="ld-neon-wm-strip">laradama &nbsp;•&nbsp; laradama &nbsp;•&nbsp; laradama</div>`;
  }
  if (id === "collage") {
    const tileStyles = Array.from({ length: 4 }, () => {
      const bgStyle = uploadedImage
        ? `background-image:url(${uploadedImage});background-size:cover;background-position:center center;`
        : `background:${s.gradient};background-size:cover;background-position:center center;`;
      return `<span class="ld-collage-tile" style="${bgStyle}"></span>`;
    }).join("");
    return `<div class="ld-collage-grid">${tileStyles}</div><div class="ld-collage-overlay"></div><div class="ld-story-wm">${logo}laradama</div><div class="ld-collage-caption"><span class="ld-collage-label">${s.title}</span><span class="ld-collage-sub">${s.artist}</span></div>`;
  }
  return "";
}

export default function Hero() {
  const fileInputRef = useRef(null);
  const demoRef = useRef(null);

  const [idx, setIdx] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [swipeDir, setSwipeDir] = useState(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState("clean");
  const [currentPlatform, setCurrentPlatform] = useState("Instagram");
  // Share/export outcome shown under the modal's buttons. `working` is the only
  // busy phase — everything else is a terminal message the user can read.
  const [share, setShare] = useState({ phase: "idle", message: "" });
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | analyzing | ready
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const audioRef = useRef(null);
  const matchIdRef = useRef(0);
  // True while playback *should* be on — survives autoplay blocks so we can
  // retry the moment the browser allows it (first interaction / buffered data).
  const wantPlayRef = useRef(true);
  // Deck refill state: the analysis profile of the current photo, every track
  // key already shown, how many refill batches have run, and whether the free
  // sources are exhausted for this photo.
  const analysisRef = useRef(null);
  const seenRef = useRef(new Set());
  const batchRef = useRef(0);
  const moreRef = useRef(false);
  const exhaustedRef = useRef(false);
  const emptyRef = useRef(0);

  const pool = matches.length ? matches : songs;
  const song = pool[idx % pool.length];
  const analyzing = status === "analyzing";
  const hasAudio = Boolean(song.audioUrl) && !analyzing;
  const progressPct =
    hasAudio && progress.duration > 0
      ? `${Math.min(100, (progress.current / progress.duration) * 100)}%`
      : hasAudio
        ? "0%"
        : "34%";

  // Small readout next to the transport buttons.
  let statusLabel = "paused";
  if (!hasAudio) statusLabel = analyzing ? "matching…" : fetchingMore ? "loading more…" : "no audio";
  else if (buffering) statusLabel = "buffering…";
  else if (playing) statusLabel = "playing";
  else if (fetchingMore) statusLabel = "loading more…";

  const openFilePicker = () => fileInputRef.current?.click();

  const removePhoto = () => {
    // Ignore any match/refill request still running for the removed photo.
    matchIdRef.current += 1;
    moreRef.current = false;
    analysisRef.current = null;
    seenRef.current = new Set();
    batchRef.current = 0;
    exhaustedRef.current = false;
    emptyRef.current = 0;
    fileInputRef.current.value = "";
    setUploadedImage(null);
    setMatches([]);
    setIdx(0);
    setStatus("idle");
    setSwipeDir(null);
    setWhyOpen(false);
    setFetchingMore(false);
    setShare({ phase: "idle", message: "" });
  };

  /**
   * Tops the deck up with tracks it has not shown yet, so "next" never reaches
   * the end of the list. Runs in the background (start it while there are still
   * a few songs of runway left) and gives up only after the sources come back
   * empty twice for the same photo.
   */
  const prefetchMore = async () => {
    const analysis = analysisRef.current;
    if (!analysis || moreRef.current || exhaustedRef.current) return;
    const matchId = matchIdRef.current;
    moreRef.current = true;
    setFetchingMore(true);
    try {
      const more = await findMoreSongs(analysis, [...seenRef.current], batchRef.current + 1);
      if (matchId !== matchIdRef.current) return; // a newer upload superseded this one
      batchRef.current += 1;
      const fresh = more.filter((s) => s?.title && s?.audioUrl && !seenRef.current.has(trackKey(s)));
      if (!fresh.length) {
        emptyRef.current += 1;
        if (emptyRef.current >= 2) exhaustedRef.current = true; // no more matches for this photo
        return;
      }
      emptyRef.current = 0;
      fresh.forEach((s) => seenRef.current.add(trackKey(s)));
      setMatches((prev) => [...prev, ...fresh]);
    } catch (err) {
      console.warn("[match] could not refill the deck:", err); // network blip → retry on the next Next
    } finally {
      moreRef.current = false;
      if (matchId === matchIdRef.current) setFetchingMore(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const matchId = ++matchIdRef.current;
      setUploadedImage(dataUrl);
      setIdx(0);
      setWhyOpen(false);
      setMatches([]);
      setStatus("analyzing");
      // Reset the refill bookkeeping for the new photo.
      analysisRef.current = null;
      seenRef.current = new Set();
      batchRef.current = 0;
      exhaustedRef.current = false;
      emptyRef.current = 0;
      // Real match: vision AI → music sources → Spotify (all free tiers).
      // On any failure `songs` comes back empty and the mock songs stay visible.
      matchImageToTracks(dataUrl)
        .then(({ songs: real, analysis }) => {
          if (matchId !== matchIdRef.current) return; // a newer upload superseded this one
          const list = real || [];
          analysisRef.current = analysis || null;
          seenRef.current = new Set(list.map(trackKey));
          setMatches(list);
          setStatus("ready");
          prefetchMore(); // queue the next batch so the first "next" is instant
        })
        .catch((err) => {
          console.warn("[match] falling back to demo songs:", err);
          if (matchId !== matchIdRef.current) return;
          setStatus("ready");
        });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /**
   * One step forward through the deck. While there are still only a few songs
   * of runway left, kick off a refill in the background — the list keeps
   * growing, so "next" lands on a fresh track instead of wrapping around.
   */
  const advance = () => {
    if (pool.length - idx <= 3) prefetchMore();
    setIdx((i) => i + 1);
    setWhyOpen(false);
  };

  const handleSwipe = (dir) => {
    if (swipeDir || analyzing) return;
    setSwipeDir(dir);
    setTimeout(() => {
      advance();
      setSwipeDir(null);
    }, 240);
  };

  // Keep the (invisible) audio element in sync with the currently shown match.
  // The source is attached the instant a match is ready (with preload="auto")
  // so sound starts without a warm-up hop, and the *next* track is fetched into
  // the cache in parallel so swiping never waits on the network.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    setProgress({ current: 0, duration: 0 });
    const url = song.audioUrl || "";
    if (url && !analyzing) {
      wantPlayRef.current = true;
      if (el.getAttribute("src") !== url) {
        // Setting the src starts the fetch; play() then waits for the first
        // frames — no extra load() call in between to restart the request.
        el.setAttribute("src", url);
      }
      el.play().catch(() => {}); // autoplay blocked → retried below on canplay / first interaction
      warmAudio(pool[(idx + 1) % pool.length]?.audioUrl);
    } else {
      wantPlayRef.current = false;
      el.pause();
      if (el.getAttribute("src")) {
        el.removeAttribute("src");
        el.load();
      }
    }
  }, [song.audioUrl, analyzing, idx, matches, pool]);

  // Chrome/Safari block the very first play() until the page has been touched
  // once. Retry on the first pointer/key event so the music starts on its own.
  useEffect(() => {
    const onFirstGesture = () => {
      const el = audioRef.current;
      if (el && wantPlayRef.current && el.getAttribute("src") && el.paused) {
        el.play().catch(() => {});
      }
      if (el && !el.paused) {
        window.removeEventListener("pointerdown", onFirstGesture);
        window.removeEventListener("keydown", onFirstGesture);
      }
    };
    window.addEventListener("pointerdown", onFirstGesture);
    window.addEventListener("keydown", onFirstGesture);
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, []);

  const startIfWanted = () => {
    const el = audioRef.current;
    if (el && wantPlayRef.current && el.getAttribute("src") && el.paused) {
      el.play().catch(() => {});
    }
  };

  const toggleAudio = () => {
    const el = audioRef.current;
    if (!el || !el.getAttribute("src")) return;
    if (el.paused) {
      wantPlayRef.current = true;
      el.play().catch(() => {});
    } else {
      wantPlayRef.current = false;
      el.pause();
    }
  };

  const seekBy = (delta) => {
    const el = audioRef.current;
    if (!el || !el.getAttribute("src")) return;
    const dur = effectiveDuration(el);
    if (!dur) return;
    const next = Math.min(dur, Math.max(0, el.currentTime + delta));
    el.currentTime = next;
    setProgress({ current: next, duration: dur });
  };

  const seekTo = (e) => {
    const el = audioRef.current;
    if (!el || !el.getAttribute("src")) return;
    const dur = effectiveDuration(el);
    if (!dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * dur;
    setProgress({ current: el.currentTime, duration: dur });
  };

  const onProgressKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); seekBy(5); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seekBy(-5); }
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleAudio(); }
  };

  const nextTrack = () => {
    if (swipeDir || analyzing) return;
    advance();
  };

  /**
   * One step back through the deck — the pair to "next". The deck only ever
   * grows in front of us, so every track we already passed is still in `pool`
   * and going back needs no refill; it just rewinds `idx` and restarts the
   * audio from the top of that track.
   */
  const prevTrack = () => {
    if (swipeDir || analyzing || idx === 0) return;
    setIdx((i) => Math.max(0, i - 1));
    setWhyOpen(false);
  };

  const onAudioEnded = () => {
    setPlaying(false);
    nextTrack(); // keep the music going — roll straight into the next match
  };

  const onAudioTime = (e) => {
    const el = e.currentTarget;
    setProgress({ current: el.currentTime, duration: effectiveDuration(el) });
  };

  const watchMatch = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const templateInner = (s, id) => renderStoryTemplate(s, id, uploadedImage);

  // Everything the story modal needs: the panel to keep Tab inside, the four
  // tiles for the arrow-key cursor, and whatever opened it so focus can go back.
  const modalPanelRef = useRef(null);
  const thumbRefs = useRef([]);
  const modalOpenerRef = useRef(null);
  const templateScrollerRef = useRef(null);

  const scrollTemplates = (direction) => {
    const scroller = templateScrollerRef.current;
    if (scroller) {
      scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth" });
    }
  };

  /** Select a template by its index in `storyTemplates` (0-based). */
  const selectTemplate = (i) => {
    const pick = storyTemplates[i];
    if (!pick) return;
    setCurrentTemplate(pick.id);
    // the previous "Saved …" line belongs to the old template
    setShare({ phase: "idle", message: "" });
  };

  /** ←/→ (and ↑/↓) walk the picker, wrapping at both ends, and take focus. */
  const onThumbKeyDown = (e, i) => {
    const steps = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const n = storyTemplates.length;
    let next = null;
    if (e.key in steps) next = (i + steps[e.key] + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault();
    selectTemplate(next);
    thumbRefs.current[next]?.focus();
  };

  /** Keep Tab inside the dialog — the page behind it is still focusable. */
  const trapFocus = (e) => {
    if (e.key !== "Tab") return;
    const panel = modalPanelRef.current;
    if (!panel) return;
    const items = Array.from(
      panel.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!panel.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  };

  // Escape closes the story modal (the ✕ and the overlay already do), and the
  // moment it opens focus lands on the selected tile, so ←/→ start browsing
  // without a Tab hunt first.
  useEffect(() => {
    if (!modalOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => {
      const i = storyTemplates.findIndex((t) => t.id === currentTemplate);
      thumbRefs.current[i < 0 ? 0 : i]?.focus();
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [modalOpen, currentTemplate]);

  // ...and when it closes, focus goes back to the button that opened it, so
  // the next Tab doesn't start over at the top of the page. Runs for every
  // close path (✕, overlay, Esc, Cancel, a successful share).
  useEffect(() => {
    if (modalOpen) return undefined;
    const opener = modalOpenerRef.current;
    modalOpenerRef.current = null;
    if (opener && document.contains(opener) && typeof opener.focus === "function") opener.focus();
    return undefined;
  }, [modalOpen]);

  const shareBusy = share.phase === "working";
  // Web Share only ships on mobile browsers — the primary button says so.
  const shareSupported = useMemo(() => canShareFiles(), []);
  const shareTone =
    share.phase === "error"
      ? " bad"
      : share.phase === "downloaded" || share.phase === "shared"
        ? " ok"
        : "";

  const openStoryModal = (platform, opener = null) => {
    // remember the actual control that opened it — `document.activeElement` is
    // only reliable after a real mouse/keyboard focus, not a programmatic click
    modalOpenerRef.current = opener || document.activeElement;
    setCurrentPlatform(platform);
    // the last picked template is remembered — reopening shouldn't cost a
    // re-selection every time
    setShare({ phase: "idle", message: "" });
    setModalOpen(true);
  };

  const closeStoryModal = () => setModalOpen(false);

  /**
   * Story image render, pre-started while the modal is open.
   *
   * Rasterising 1080x1920 takes seconds — longer than browsers keep a click's
   * user activation alive (5s), after which `navigator.share`, `window.open`
   * and the `instagram://` jump are all refused. So the PNG renders in the
   * background as soon as a template is showing, and the buttons below reuse
   * it instead of rendering at click time.
   */
  const storyRenderRef = useRef(null); // { key, blob: Promise<Blob> }
  const storyRenderSeqRef = useRef(0);
  const [preparing, setPreparing] = useState(false);
  const storyKey = `${currentTemplate}|${song?.title || ""}|${song?.artist || ""}|${uploadedImage ? uploadedImage.length : 0}`;

  const startStoryRender = () => {
    const pending = renderStoryImage({ song, templateId: currentTemplate, uploadedImage });
    const seq = ++storyRenderSeqRef.current;
    storyRenderRef.current = { key: storyKey, blob: pending };
    setPreparing(true);
    pending
      .catch((err) => {
        console.warn("[story] could not render the Story image:", err);
        // drop the failed entry so the next click tries again
        if (storyRenderRef.current?.blob === pending) storyRenderRef.current = null;
      })
      .finally(() => {
        if (storyRenderSeqRef.current === seq) setPreparing(false);
      });
    return pending;
  };

  const storyBlob = () => {
    const cached = storyRenderRef.current;
    return cached && cached.key === storyKey ? cached.blob : startStoryRender();
  };

  // Pre-render while the modal shows a template (and whenever it changes).
  useEffect(() => {
    if (!modalOpen) return undefined;
    storyBlob();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, storyKey]);

  /** Reuse the pre-rendered PNG when it matches; render on demand otherwise. */
  const renderStory = async () => {
    setShare({ phase: "working", message: "Rendering your Story image…" });
    return storyBlob();
  };

  const exportFailed = (err) => {
    console.warn("[story] could not export the Story image:", err);
    setShare({ phase: "error", message: "Couldn't render the Story image — try another template." });
  };

  const handleShare = async () => {
    if (shareBusy) return;
    try {
      const blob = await renderStory();
      const res = await shareStoryFile(blob, { platform: currentPlatform, song });
      setShare({ phase: res.phase, message: res.message });
      // Only a real share closes the modal — on the save-and-open path it stays
      // up so the "open Instagram and pick this file" instructions are readable.
      if (res.phase === "shared") closeStoryModal();
    } catch (err) {
      exportFailed(err);
    }
  };

  const handleDownload = async () => {
    if (shareBusy) return;
    try {
      const blob = await renderStory();
      const res = await downloadStoryFile(blob, { platform: currentPlatform });
      setShare({ phase: res.phase, message: res.message });
    } catch (err) {
      exportFailed(err);
    }
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
      <div className="mx-auto grid max-w-375 grid-cols-1 items-center gap-10 px-6 pt-16 pb-24 sm:px-8 xl:grid-cols-[1.1fr_1.6fr]">
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
           Upload or take a photo. Laradama App analyzes its mood, colors, and movement to find a trending song that fits the vibe. 
           Not your type of song? Simply swipe to discover another match.
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
          <audio
            ref={audioRef}
            hidden
            preload="auto"
            onTimeUpdate={onAudioTime}
            onLoadedMetadata={onAudioTime}
            onDurationChange={onAudioTime}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={onAudioEnded}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => { setBuffering(false); startIfWanted(); }}
          />
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
        <div className="relative mx-auto w-full translate-y-2 xl:translate-y-4">
          <div className="ld-phone-stage">
            <div className="ld-floaty a" />
            <div className="ld-floaty b" />
            <div ref={demoRef} className="ld-device-frame">
              <div className="ld-browser-bar">
                <span className="ld-bdot r" />
                <span className="ld-bdot y" />
                <span className="ld-bdot g" />
                <span className="ld-browser-url">laradama.app/match</span>
              </div>
              <div className="ld-phone-screen">
                <div className="ld-phone-topbar">
                  {uploadedImage ? (
                    <>
                      <div className="ld-topbar-photo">
                        <img src={uploadedImage} alt="Your uploaded photo" />
                        <span className="ld-tlabel">MATCHED FROM YOUR PHOTO</span>
                      </div>
                      <div className="ld-photo-actions">
                        <button
                          type="button"
                          className="ld-change-photo-btn"
                          onClick={openFilePicker}
                          aria-label="Change photo"
                          title="Change photo"
                        >
                          <ImagePlus size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="ld-change-photo-btn ld-remove-photo-btn"
                          onClick={removePhoto}
                          aria-label="Remove photo"
                          title="Remove photo"
                        >
                          <X size={17} aria-hidden="true" />
                        </button>
                      </div>
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
                      {song.custom && (
                        <span className="ld-pinpill" title="Pinned by a custom scan">
                          Pinned · {song.custom.subject}
                        </span>
                      )}
                      <div className="ld-eq">
                        <span style={{ animationDelay: "0s" }} />
                        <span style={{ animationDelay: ".15s" }} />
                        <span style={{ animationDelay: ".3s" }} />
                        <span style={{ animationDelay: ".1s" }} />
                        <span style={{ animationDelay: ".25s" }} />
                      </div>
                      <span className="ld-tagpill">{analyzing ? "analyzing…" : song.tag}</span>
                    </div>
                    <div className="ld-info">
                      <div className="ld-title">{analyzing ? "Matching your photo…" : song.title}</div>
                      <div className="ld-artist">{analyzing ? "checking custom scans, then mood & color" : song.artist}</div>
                      <div
                        className="ld-progress"
                        role="slider"
                        aria-label="Seek within the track"
                        aria-valuemin={0}
                        aria-valuemax={Math.round(progress.duration) || 0}
                        aria-valuenow={Math.round(progress.current) || 0}
                        tabIndex={hasAudio ? 0 : -1}
                        title={hasAudio ? "Click to seek" : "Upload a photo to play your match"}
                        onClick={seekTo}
                        onKeyDown={onProgressKeyDown}
                      >
                        <div style={{ width: progressPct }} />
                      </div>
                      <div className="ld-time-row">
                        <span>{hasAudio ? fmtTime(progress.current) || "0:00" : "0:42"}</span>
                        <span className="ld-tp-status">{statusLabel}</span>
                        <span>{hasAudio ? fmtTime(progress.duration) || "0:00" : "2:58"}</span>
                      </div>
                      <div className="ld-transport">
                        <div className="ld-tp-controls">
                          <button
                            className="ld-tp-btn"
                            type="button"
                            onClick={prevTrack}
                            disabled={analyzing || idx === 0}
                            aria-label="Go back to the previous track"
                            title="Previous track"
                          >
                            <SkipBack size={14} strokeWidth={2.2} />
                          </button>
                          <button
                            className="ld-tp-btn"
                            type="button"
                            onClick={() => seekBy(-10)}
                            disabled={!hasAudio}
                            aria-label="Rewind 10 seconds"
                            title="Rewind 10s"
                          >
                            <Rewind size={14} strokeWidth={2.2} />
                          </button>
                          <button
                            className={`ld-tp-btn primary${buffering ? " buffering" : ""}`}
                            type="button"
                            onClick={toggleAudio}
                            disabled={!hasAudio}
                            aria-label={playing ? "Pause" : "Play"}
                            title={playing ? "Pause" : "Play"}
                          >
                            {playing ? (
                              <Pause size={15} strokeWidth={2.4} fill="currentColor" />
                            ) : (
                              <Play size={15} strokeWidth={2.4} fill="currentColor" />
                            )}
                          </button>
                          <button
                            className="ld-tp-btn"
                            type="button"
                            onClick={() => seekBy(10)}
                            disabled={!hasAudio}
                            aria-label="Fast forward 10 seconds"
                            title="Fast forward 10s"
                          >
                            <FastForward size={14} strokeWidth={2.2} />
                          </button>
                          <button
                            className={`ld-tp-btn${fetchingMore ? " buffering" : ""}`}
                            type="button"
                            onClick={nextTrack}
                            disabled={analyzing || pool.length < 2}
                            aria-label="Skip to the next track"
                            title={fetchingMore ? "Loading more tracks…" : "Next track"}
                          >
                            <SkipForward size={14} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                      <span className="ld-share-label">LISTEN & SHARE</span>
                      <div className="ld-action-row">
                        <button className="ld-spotify-btn" id="spotifyBtn" type="button" aria-label="Listen on Spotify" disabled={analyzing} title={analyzing ? "Matching your photo…" : "Listen on Spotify"} onClick={() => window.open(song.spotifyUrl || spotifySearchUrl(song.title, song.artist), "_blank")}>
                          <SpotifyIcon /> Listen on Spotify
                        </button>
                        <button className="ld-icon-btn ig" id="igBtn" type="button" aria-label="Add to Instagram Story" disabled={analyzing} title={analyzing ? "Matching your photo…" : "Add to Instagram Story"} onClick={(e) => openStoryModal("Instagram", e.currentTarget)}>
                          <InstagramIcon />
                        </button>
                        <button className="ld-icon-btn fb" id="fbBtn" type="button" aria-label="Add to Facebook Story" disabled={analyzing} title={analyzing ? "Matching your photo…" : "Add to Facebook Story"} onClick={(e) => openStoryModal("Facebook", e.currentTarget)}>
                          <FacebookIcon />
                        </button>
                      </div>
                      <button className="ld-why-toggle" id="ldWhyToggle" type="button" onClick={() => setWhyOpen((v) => !v)}>
                        <span>✦</span> Why this song?
                      </button>
                      <div className={`ld-why-panel${whyOpen ? " open" : ""}`} id="ldWhyPanel">
                        <span className="ld-why-label">✦ AI EXPLANATION</span>
                        <span dangerouslySetInnerHTML={{ __html: analyzing ? "Checking it against custom scans, then reading your photo&rsquo;s colors, mood, and motion&hellip;" : song.why }} />
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
        <div
          className="ld-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="storyModalTitle"
          ref={modalPanelRef}
          onKeyDown={trapFocus}
        >
          <div className="ld-modal-head">
            <div>
              <h3 id="storyModalTitle">Choose a story template</h3>
              <p>
                Your photo, the track, and a laradama watermark — pick a style before
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
          {/* Radiogroup + roving tabindex: one Tab stop, ←/→ to browse. */}
          <div className="ld-template-picker">
            <button
              className="ld-template-scroll"
              type="button"
              aria-label="Scroll to previous templates"
              onClick={() => scrollTemplates(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <div
              className="ld-template-grid"
              id="templateGrid"
              role="radiogroup"
              aria-label="Story templates"
              ref={templateScrollerRef}
            >
              {storyTemplates.map((t, i) => {
                const selected = currentTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    className={`ld-thumb-wrap ld-thumb-btn${selected ? " selected" : ""}`}
                    ref={(el) => { thumbRefs.current[i] = el; }}
                    onClick={() => selectTemplate(i)}
                    onKeyDown={(e) => onThumbKeyDown(e, i)}
                  >
                    <span
                      className="ld-story-card thumb"
                      dangerouslySetInnerHTML={{ __html: templateInner(song, t.id) }}
                    />
                    <span className="ld-thumb-check" aria-hidden="true">✓</span>
                    <span className="ld-thumb-label">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              className="ld-template-scroll"
              type="button"
              aria-label="Scroll to next templates"
              onClick={() => scrollTemplates(1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
          <p className="ld-template-hint">
            <kbd>←</kbd> <kbd>→</kbd> switch template · <kbd>Esc</kbd> close
          </p>
          {/* Sticky: Download / Post stay visible while the panel scrolls. */}
          <div className="ld-modal-foot">
            <div className="ld-modal-actions">
              <button className="ld-btn-ghost" id="modalCancel" onClick={closeStoryModal}>Cancel</button>
              <button className="ld-btn-ghost" id="modalDownload" onClick={handleDownload} disabled={shareBusy}>
                Download
              </button>
              <button className="ld-btn-primary" id="modalShare" onClick={handleShare} disabled={shareBusy}>
                {shareBusy ? "Rendering…" : shareSupported ? "Post to Story" : `Save & open ${currentPlatform}`}
              </button>
            </div>
            <p className={`ld-share-status${shareTone}`} role="status" aria-live="polite">
              {share.message || (preparing ? "Getting your Story image ready…" : "")}
            </p>
          </div>
        </div>
      </div>
  </>
  );
}