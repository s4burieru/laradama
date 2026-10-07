/**
 * Vision layer — reads the uploaded photo and returns a music-matching profile.
 * Primary: Gemini free tier via the local /api/gemini dev proxy (key never in frontend).
 * Fallback: local canvas color analysis (no key, no network) so matching never dies.
 */

import { recognizableEntries, subjectBlock } from './customMatch.js';

/** Ordered candidates — index 1 is the busy-day fallback. */
export const VISION_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];

/** Schema + prompt are built per call so custom scans can extend them (and an
 *  empty customMatches list leaves the request byte-identical to the old one).
 *  Exported so the schema/prompt can be validated against the real API. */
export function buildSchema(customIds) {
  const schema = {
    type: 'object',
    properties: {
      mood: { type: 'string' },
      scene: { type: 'string' },
      timeOfDay: { type: 'string' },
      palette: { type: 'array', items: { type: 'string' } },
      energy: { type: 'number' },
      valence: { type: 'number' },
      warmth: { type: 'number' },
      tags: { type: 'array', items: { type: 'string' } },
      genres: { type: 'array', items: { type: 'string' } },
      searchQueries: { type: 'array', items: { type: 'string' } },
      photoWhy: { type: 'string' },
    },
    propertyOrdering: [
      'mood', 'scene', 'timeOfDay', 'palette', 'energy', 'valence', 'warmth',
      'tags', 'genres', 'searchQueries', 'photoWhy',
    ],
  };
  if (customIds.length) {
    // Gemini rejects "" as an enum member, so "none" means "not about any target".
    schema.properties.customId = { type: 'string', enum: ['none', ...customIds] };
    schema.propertyOrdering.push('customId');
  }
  return schema;
}

export function buildPrompt(custom) {
  const base = `You are the matching engine of "Laradama", an image-to-music app.
Analyze this photo and output ONLY JSON matching the schema.

Rules:
- palette: 3-5 dominant colors as hex strings (e.g. "#F4A261"), brightest/dominant first.
- energy: 0 (very calm) .. 1 (very intense). valence: 0 (melancholic/sad) .. 1 (happy/joyful). warmth: 0 (cool blues) .. 1 (warm reds/oranges).
- mood: 2-4 words (e.g. "warm nostalgia", "electric nightlife").
- tags: 4-6 short lowercase mood/visual tags (e.g. "golden hour", "misty", "neon").
- genres: 2-4 music genres that fit this image's mood and energy.
- searchQueries: 3 short music search phrases that would find songs matching this image (e.g. "chill lofi golden hour", "upbeat indie summer").
- photoWhy: 1-2 sentences explaining what in THIS photo (colors, light, scene) suggests that mood, for a "Why this song?" panel. Wrap the 2-3 key visual phrases in <b> tags. No other HTML.`;
  if (!custom) return base;
  return `${base}
- customId: ${custom}
If the photo is clearly about (or memes) one of those targets, return its customId;
if you are not confident it is about that exact target, return "none".`;
}

/** Downscale to max 768px so requests stay fast and quota-friendly. Returns {mimeType, data} or null. */
async function toGeminiPart(dataUrl) {
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, 768 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    const mime = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const out = canvas.toDataURL(mime, 0.85);
    return { mimeType: mime, data: out.slice(out.indexOf(',') + 1) };
  } catch {
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
    return { mimeType: mime, data: b64 };
  }
}

function coerceAnalysis(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('empty analysis');
  const num = (v, d) => (Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : d);
  return {
    source: 'gemini',
    mood: String(raw.mood || '').trim() || 'quiet mood',
    scene: String(raw.scene || '').trim(),
    timeOfDay: String(raw.timeOfDay || '').trim(),
    palette: Array.isArray(raw.palette) ? raw.palette.filter((c) => /^#[0-9a-f]{3,8}$/i.test(String(c))).slice(0, 5) : [],
    energy: num(raw.energy, 0.5),
    valence: num(raw.valence, 0.5),
    warmth: num(raw.warmth, 0.5),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 6) : [],
    genres: Array.isArray(raw.genres) ? raw.genres.map(String).slice(0, 4) : [],
    searchQueries: Array.isArray(raw.searchQueries) ? raw.searchQueries.map(String).slice(0, 3) : [],
    photoWhy: String(raw.photoWhy || '').trim(),
    customId: typeof raw.customId === 'string' ? raw.customId.trim() : '',
  };
}

async function analyzeWithGemini(dataUrl) {
  const part = await toGeminiPart(dataUrl);
  if (!part) throw new Error('image encoding failed');
  const entries = recognizableEntries();
  const subject = subjectBlock();
  const prompt = buildPrompt(subject);
  const schema = buildSchema(entries.map((e) => e.id));
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: part }] }],
    generationConfig: {
      temperature: 0.6,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  // Two passes over the model list — pass 2 exists purely to ride out 503 spikes.
  // Transient/unknown-model statuses fall through to the next candidate instead of
  // aborting, otherwise the fallback model would never be reached.
  const transient = (status) => status === 429 || (status >= 500 && status < 600);
  let lastErr = null;
  for (const model of [...VISION_MODELS, ...VISION_MODELS]) {
    let res;
    try {
      res = await fetch(`/api/gemini/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch (e) {
      lastErr = e;
      break; // dev server / network gone — no point trying other models
    }
    if (res.status === 404 || res.status === 400 || transient(res.status)) {
      lastErr = new Error(`model ${model} unavailable (${res.status})`);
      continue; // try next model (or the retry pass)
    }
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    try {
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      if (!text) throw new Error('Gemini returned no content');
      const clean = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      return coerceAnalysis(JSON.parse(clean));
    } catch (e) {
      lastErr = e; // unparseable output — try the next model
    }
  }
  throw lastErr || new Error('Gemini failed');
}

/** Absolute last resort — static profile so the flow still completes. */
function staticProfile() {
  return {
    source: 'none', mood: 'unplugged', scene: '', timeOfDay: '',
    palette: ['#1ED760', '#121212'], energy: 0.5, valence: 0.5, warmth: 0.5,
    tags: ['no signal'], genres: ['indie'], searchQueries: ['indie chill'], customId: '',
    photoWhy: "We couldn't reach the vision API, so this pick is matched from a default profile.",
  };
}

/** Fully local fallback: derive mood/palette/energy from the photo's pixels. */
export function analyzeImageLocal(dataUrl) {
  if (!dataUrl) return Promise.resolve(staticProfile());
  return new Promise((resolve) => {
    const done = (a) => resolve(a);
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const s = 48;
          const canvas = document.createElement('canvas');
          canvas.width = s;
          canvas.height = s;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, s, s);
          const { data } = ctx.getImageData(0, 0, s, s);
          let r = 0, g = 0, b = 0, lSum = 0, satSum = 0;
          const buckets = new Map();
          for (let i = 0; i < data.length; i += 4) {
            const R = data[i], G = data[i + 1], B = data[i + 2];
            r += R; g += G; b += B;
            const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
            lSum += (mx + mn) / 2;
            satSum += mx === 0 ? 0 : (mx - mn) / mx;
            const key = `${R >> 5}-${G >> 5}-${B >> 5}`;
            buckets.set(key, (buckets.get(key) || 0) + 1);
          }
          const n = data.length / 4;
          r /= n; g /= n; b /= n;
          const light = lSum / n / 255;
          const sat = Math.min(1, satSum / n);
          const warmth = r / (r + g + b || 1);
          const hex = (R, G, B) => '#' + [R, G, B].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
          const palette = [...buckets.entries()]
            .sort((x, y) => y[1] - x[1])
            .slice(0, 5)
            .map(([key]) => {
              const [R, G, B] = key.split('-').map((v) => parseInt(v, 10) * 32 + 16);
              return hex(R, G, B);
            });
          const warm = warmth > 0.38;
          const bright = light > 0.55;
          const vivid = sat > 0.4;
          const mood = warm ? (bright ? 'warm glow' : 'amber hush') : (bright ? 'airy calm' : 'cool shadows');
          const energy = Math.min(1, 0.35 + sat * 0.5 + (bright ? 0.15 : 0));
          const valence = Math.min(1, (warm ? 0.55 : 0.4) + (bright ? 0.3 : 0) + sat * 0.15);
          const tags = [warm ? 'warm tones' : 'cool tones', bright ? 'bright' : 'low light', vivid ? 'vivid' : 'muted', 'color-matched'];
          const genres = warm && vivid ? ['indie pop', 'funk'] : bright ? ['chillhop', 'ambient pop'] : ['lofi', 'downtempo'];
          done({
            source: 'local',
            customId: '',
            mood,
            scene: '',
            timeOfDay: '',
            palette,
            energy: +energy.toFixed(2),
            valence: +valence.toFixed(2),
            warmth: +warmth.toFixed(2),
            tags,
            genres,
            searchQueries: [
              `${genres[0]} ${warm ? 'warm' : 'chill'}`,
              `${bright ? 'upbeat' : 'mellow'} ${genres[1]}`,
              `${mood} instrumental`,
            ],
            photoWhy: `Your photo's <b>${warm ? 'warm' : 'cool'} palette</b> and <b>${bright ? 'bright light' : 'low light'}</b> set a <b>${mood}</b> tone — matched by color, straight on your device.`,
          });
        } catch {
          done(staticProfile());
        }
      };
      img.onerror = () => done(staticProfile());
      img.src = dataUrl;
    } catch {
      resolve(staticProfile());
    }
  });
}

export async function analyzeImage(dataUrl) {
  try {
    return await analyzeWithGemini(dataUrl);
  } catch (err) {
    console.warn('[vision] Gemini unavailable, using local color analysis:', err?.message || err);
    return analyzeImageLocal(dataUrl);
  }
}
