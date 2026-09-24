import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play, Shuffle } from "lucide-react";
import { regionFilters, trendingSources, trendingTracks } from "../data/trendingTracks";

// Seconds a random trending pick stays on screen before it rotates.
const ROTATE_SECONDS = 30;
const ROTATE_MS = ROTATE_SECONDS * 1000;

// Large Spotify player height (full interactive embed, not the compact 152px).
const EMBED_HEIGHT_CLASS = "h-[352px]";

const poolFor = (region) => trendingTracks.filter((track) => region === "all" || track.region === region);

const pickRandom = (pool, excludeId = null) => {
  const choices = pool.length > 1 ? pool.filter((track) => track.id !== excludeId) : pool;
  return choices[Math.floor(Math.random() * choices.length)];
};

export default function TrendingMusicPlayer() {
  const wrapperRef = useRef(null);
  const [region, setRegion] = useState("all");
  const [track, setTrack] = useState(() => pickRandom(poolFor("all")));
  const [autoRotate, setAutoRotate] = useState(true);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [embedReady, setEmbedReady] = useState(false);

  // Only rotate while the player is on screen and the tab is in the foreground,
  // so the Spotify iframe is never reloaded in the background.
  const rotating = autoRotate && onScreen && tabVisible;

  const rotate = useCallback(
    (nextRegion = region) => {
      setTrack((current) => pickRandom(poolFor(nextRegion), current?.id));
    },
    [region],
  );

  const handleRegionChange = (nextRegion) => {
    if (nextRegion === region) return;
    const pool = poolFor(nextRegion);
    setRegion(nextRegion);
    setTrack((current) => (pool.some((entry) => entry.id === current.id) ? current : pickRandom(pool)));
  };

  useEffect(() => {
    const syncTabVisibility = () => setTabVisible(!document.hidden);
    syncTabVisibility();
    document.addEventListener("visibilitychange", syncTabVisibility);
    return () => document.removeEventListener("visibilitychange", syncTabVisibility);
  }, []);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver((entries) => setOnScreen(entries[0].isIntersecting), { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Reset the embed skeleton on every track switch.
  useEffect(() => {
    setEmbedReady(false);
  }, [track.id]);

  // Re-arms on every track change, so manual picks always get a full countdown.
  useEffect(() => {
    if (!rotating) return undefined;
    const timeout = window.setTimeout(() => rotate(region), ROTATE_MS);
    return () => window.clearTimeout(timeout);
  }, [rotating, region, rotate, track.id]);

  const poolSize = poolFor(region).length;
  const source = trendingSources[track.region];

  // Small "up next" queue so the right side doesn't feel empty.
  // Shows 3 other tracks from the current filter, excluding the now-playing one.
  const upNext = useMemo(() => {
    const pool = poolFor(region).filter((entry) => entry.id !== track.id);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [region, track.id]);

  const playTrack = (id) => {
    const found = trendingTracks.find((entry) => entry.id === id);
    if (found) setTrack(found);
  };

  return (
    <div ref={wrapperRef} className="mx-auto w-full max-w-295 text-left">
      <div className="border border-[#808080] bg-[#151515] px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-laradama-brand sm:text-xs">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-dot bg-laradama-brand" />
            live · {poolSize} trending now
          </span>
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter trending by region">
            {regionFilters.map((filter) => {
              const active = region === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleRegionChange(filter.id)}
                  className={[
                    "rounded-none px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition sm:text-[11px]",
                    active
                      ? "bg-laradama-brand font-bold text-[#06170c]"
                      : "bg-[#1c1c1c] text-[#8f8f8f] hover:text-white",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div className="flex flex-col">
            <div className="relative overflow-hidden rounded-none bg-black">
              {!embedReady && (
                <div aria-hidden="true" className="absolute inset-0 z-10 flex flex-col justify-between bg-[#121212] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-20 w-20 animate-pulse bg-[#232323] sm:h-24 sm:w-24" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse bg-[#232323]" />
                      <div className="h-3 w-1/3 animate-pulse bg-[#1e1e1e]" />
                    </div>
                  </div>
                  <div className="h-12 animate-pulse bg-[#1a1a1a]" />
                </div>
              )}
              <iframe
                key={track.id}
                src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
                title={`Spotify player: ${track.title} by ${track.artist}`}
                className={`block w-full border-0 ${EMBED_HEIGHT_CLASS}`}
                onLoad={() => setEmbedReady(true)}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>

          <div className="flex flex-col justify-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-laradama-brand sm:text-[11px]">
              #{track.rank} · {source.chart}
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">{track.title}</h3>
            <p className="mt-1 text-sm text-[#a3a3a3]">{track.artist}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => rotate(region)}
                className="inline-flex items-center justify-center gap-2 rounded-none bg-laradama-brand px-5 py-2.5 text-xs font-bold text-[#06170c] transition hover:bg-laradama-brand-hover"
              >
                <Shuffle className="h-3.5 w-3.5" strokeWidth={2.5} /> Next
              </button>
              <button
                type="button"
                onClick={() => setAutoRotate((value) => !value)}
                aria-pressed={autoRotate}
                className="inline-flex items-center justify-center gap-2 rounded-none bg-[#232323] px-5 py-2.5 text-xs font-bold text-[#e5e5e5] transition hover:text-laradama-brand"
              >
                {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {autoRotate ? "Pause" : "Play"}
              </button>
            </div>

            <div className="mt-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6f6f6f]">
                Up next
              </p>
              <ul className="mt-3 space-y-1">
                {upNext.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => playTrack(entry.id)}
                      className="group flex w-full items-center justify-between gap-3 bg-transparent px-2 py-2 text-left transition hover:bg-[#1e1e1e]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-[#e8e8e8] group-hover:text-white">
                          {entry.title}
                        </span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[#707070]">
                          #{entry.rank} · {entry.artist}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#555] transition group-hover:text-laradama-brand" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
