/**
 * Spotify layer — resolves the matched song to a real Spotify track URL
 * via the local /api/spotify dev proxy (client-credentials stays server-side).
 * Returns null when Spotify isn't configured or no confident match exists;
 * the caller then falls back to a Spotify search link (works with no keys at all).
 */

function tokenScore(a, b) {
  const A = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const B = b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (!A.size || !B.length) return 0;
  const hits = B.filter((w) => A.has(w)).length;
  return hits / B.length;
}

export async function resolveSpotifyTrack(title, artist) {
  try {
    const q = encodeURIComponent(`${title} ${artist}`);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    let res;
    try {
      res = await fetch(`/api/spotify/search?q=${q}&type=track&limit=5`, {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }
    if (!res.ok) return null; // not configured / rate-limited / offline → search-link fallback
    const json = await res.json();
    const items = json?.tracks?.items || [];
    if (!items.length) return null;

    // Accept the top result only if it actually resembles our matched song.
    const top = items[0];
    const titleSim = tokenScore(top.name, title);
    const artistSim = tokenScore(top.artists?.map((a) => a.name).join(' ') || '', artist);
    if (titleSim < 0.5 || artistSim < 0.5) return null;
    return `https://open.spotify.com/track/${top.id}`;
  } catch {
    return null;
  }
}

export const spotifySearchUrl = (title, artist) =>
  `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
