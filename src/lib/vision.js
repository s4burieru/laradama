/**
 * Vision layer — reads the uploaded photo and returns a music-matching profile.
 * Primary: Gemini free tier via the local /api/gemini dev proxy (key never in frontend).
 * Fallback: local canvas color analysis (no key, no network) so matching never dies.
 */

import { recognizableEntries, subjectBlock, visionRefTargets, dHashFromDataUrl } from './customMatch.js';

/**
 * One model order for every Gemini call the app makes — mood writing, identity
 * check, track rerank. `gemini-3.5-flash-lite` leads because it is ~10x faster
 * (measured 2.5-3.5s vs 23-54s) and the prompts carry the quality, not the
 * model: describe-both-faces-then-compare kept it honest on the negative
 * controls, and the mood/rerank outputs are short structured objects rather
 * than prose. Flash is the backstop for unparseable output or an outage,
 * 3.8-flash last (it answers well but is the slowest and the one that 503s).
 */
export const VISION_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];

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
    // customEvidence forces the model to name its proof — a model that has to
    // write "he also wears a black suit" stops itself far more often than one
    // that can silently pick the only non-"none" value available.
    schema.properties.customId = { type: 'string', enum: ['none', ...customIds] };
    schema.properties.customEvidence = { type: 'string' };
    schema.propertyOrdering.push('customId', 'customEvidence');
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
- customEvidence: the concrete evidence behind that customId (one short
  sentence), or empty when customId is "none".
Each target line may include a "Looks like:" description of the person or thing.
Match ONLY on a distinctive marker of that target: the description, text visible
in the photo (captions, jersey words, logos), or unmistakable context.
Shared ethnicity, age, build or a similar setting is NOT a match, and never pick
a customId just because one is available — when unsure, return "none".`;
}

/**
 * Identity check — stage 2 for entries that have reference photos.
 *
 * This is its OWN call on purpose: asking the big analysis schema for a
 * `customId` (or for a bare yes/no) let the model rubber-stamp "same face" for
 * anyone — measured, a different person and a group photo both came back as
 * matches at 0.95 confidence. Forcing it to describe each face and write the
 * differences down FIRST is what makes it say no when it should, on every model
 * tier tested (3.5-flash, 3.5-flash-lite).
 */
export const IDENTITY_THRESHOLD = 0.8; // below this a "same person" is noise

export const IDENTITY_SCHEMA = {
  type: 'object',
  properties: {
    uploadFace: { type: 'string' },
    referenceFace: { type: 'string' },
    differences: { type: 'string' },
    samePerson: { type: 'boolean' },
    confidence: { type: 'number' },
  },
  propertyOrdering: ['uploadFace', 'referenceFace', 'differences', 'samePerson', 'confidence'],
};

export function identityPrompt(refCount) {
  return `You are verifying IDENTITY across photos.
The FIRST image is the photo to check. The ${refCount} image(s) after it are reference photos of the person we are looking for.
Answer ONLY this JSON, every string under 10 words, never repeat words:
{"uploadFace":"age, hair, eyebrows, nose, mouth, face shape",
 "referenceFace":"age, hair, eyebrows, nose, mouth, face shape",
 "differences":"strongest visible differences, or none",
 "samePerson": true, "confidence": 0.9}
Rules:
- true ONLY when facial features clearly match a reference photo — same person, any age, outfit, angle, framing or lighting.
- A different person is ALWAYS false, even when they share ethnicity, age, build, hairstyle, a sport or a setting.
- Write the real differences first; if you can see any clear one, samePerson must be false.
- Report your actual confidence; you will be rejected below ${IDENTITY_THRESHOLD}.`;
}

/** Downscale to `maxSize` (768px for mood — the whole scene matters; 512px for
 *  identity — a face check needs far less) so requests stay fast and
 *  quota-friendly. Returns {mimeType, data} or null. */
async function toGeminiPart(dataUrl, maxSize = 768) {
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
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
    customEvidence: typeof raw.customEvidence === 'string' ? raw.customEvidence.trim() : '',
  };
}

/** url -> {mimeType, data} for a reference photo capped at 256px, once per session. */
const refPartCache = new Map();

async function refPart(url) {
  if (refPartCache.has(url)) return refPartCache.get(url);
  let part;
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    const data = canvas.toDataURL('image/jpeg', 0.82);
    part = { mimeType: 'image/jpeg', data: data.slice(data.indexOf(',') + 1) };
  } catch {
    part = null; // ref not reachable — the prompt just falls back to keywords/description
  }
  refPartCache.set(url, part);
  return part;
}

/**
 * Reference photos of ONE subject — the first entry that has any, max 2.
 * Keeping a single subject per call is what makes the identity verdict
 * attributable to that entry.
 */
async function referenceParts() {
  const targets = visionRefTargets(4);
  if (!targets.length) return [];
  const entryId = targets[0].id;
  const out = [];
  for (const t of targets.filter((x) => x.id === entryId).slice(0, 2)) {
    const part = await refPart(t.url);
    if (part) out.push({ id: t.id, ...part });
  }
  return out;
}

/**
 * POSTs one request, riding out model outages: two passes over the model list
 * (pass 2 exists purely to absorb 503 spikes). Transient/unknown-model statuses
 * fall through to the next candidate instead of aborting, otherwise the
 * fallback model would never be reached — EXCEPT a rate limit: two 429s in a
 * row mean the key's quota is gone, and finishing the loop would spend another
 * 30-60s of round trips just to collect more 429s. Config/auth problems
 * (missing GEMINI_API_KEY, rejected key) fail every model identically, so they
 * abort at once with the server's own message. Returns the parsed JSON.
 */
async function generateJson(body, modelList = VISION_MODELS) {
  const transient = (status) => status === 429 || (status >= 500 && status < 600);
  const detailOf = async (res) => {
    const text = await res.text().catch(() => '');
    return (text.match(/"message"\s*:\s*"([^"]+)"/) || [])[1] || text.slice(0, 200);
  };
  let lastErr = null;
  let rateLimited = 0; // only CONSECUTIVE 429s mean "quota exhausted, stop"
  for (const model of [...modelList, ...modelList]) {
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
    if (res.status !== 429) rateLimited = 0;
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Gemini auth failed (${res.status}) — ${await detailOf(res)}`);
    }
    if (res.status === 400) {
      const detail = await detailOf(res);
      if (/api[ _-]?key|credential|permission/i.test(detail)) {
        throw new Error(`Gemini rejected the request (400) — ${detail}`);
      }
      lastErr = new Error(`model ${model} unavailable (400)${detail ? ` — ${detail}` : ''}`);
      continue;
    }
    if (res.status === 404 || transient(res.status)) {
      lastErr = new Error(`model ${model} unavailable (${res.status})`);
      if (res.status === 429 && ++rateLimited >= 2) break; // quota gone — fail fast
      continue; // try next model (or the retry pass)
    }
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    try {
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      if (!text) throw new Error('Gemini returned no content');
      const clean = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      lastErr = e; // unparseable output — try the next model
    }
  }
  throw lastErr || new Error('Gemini failed');
}

/**
 * Mood/scene analysis of the upload.
 * `skipRecognition` drops custom-scan duties from this call — whenever
 * reference photos exist they are handled by verifyIdentity() instead, so the
 * model is never asked to recognize a person twice (and never asked to guess
 * from prose what it could be shown).
 */
async function analyzeWithGemini(dataUrl, skipRecognition = false) {
  const part = await toGeminiPart(dataUrl);
  if (!part) throw new Error('image encoding failed');
  const entries = skipRecognition ? [] : recognizableEntries();
  const subject = skipRecognition ? '' : subjectBlock();
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: buildPrompt(subject) }, { inlineData: part }] }],
    generationConfig: {
      temperature: 0.3, // classification-ish output: low temperature = fewer invented matches
      responseMimeType: 'application/json',
      responseSchema: buildSchema(entries.map((e) => e.id)),
    },
  });
  return coerceAnalysis(await generateJson(body));
}

/**
 * Identity verdicts for (subject, photo), reused for the rest of the session.
 * Keyed on the upload's dHash plus a fingerprint of the reference set, so
 * re-uploading the same picture — or the same file after a reload — costs zero
 * API calls, while editing `refImages` invalidates it. Version-bump the prefix
 * when the prompt or threshold changes; stale entries are dropped on load.
 * Only conclusive verdicts are stored: an error (429, unparseable) must stay
 * retryable. sessionStorage is a speed-up, not a dependency — private mode or
 * no window just means the cache lives in memory for this page.
 */
const IDENTITY_CACHE_KEY = 'laradama:identity-verdicts';
const IDENTITY_CACHE_VERSION = 'v1:';
const identityCache = (() => {
  const mem = new Map();
  let store = null;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      store = window.sessionStorage;
      const raw = store.getItem(IDENTITY_CACHE_KEY);
      if (raw) {
        for (const [k, v] of Object.entries(JSON.parse(raw))) {
          if (k.startsWith(IDENTITY_CACHE_VERSION)) mem.set(k, v);
        }
      }
    }
  } catch {
    store = null;
  }
  return {
    get: (k) => mem.get(k),
    set(k, v) {
      mem.set(k, v);
      if (!store) return;
      try {
        while (mem.size > 200) mem.delete(mem.keys().next().value);
        store.setItem(IDENTITY_CACHE_KEY, JSON.stringify(Object.fromEntries(mem)));
      } catch {
        /* quota exceeded — the in-memory copy still serves this session */
      }
    },
  };
})();

const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;

/**
 * Stage 2 — upload vs. the entry's reference photos, as its own request.
 * Returns `{ status: 'hit' | 'miss' | 'error', confidence, why }`; the caller
 * maps 'hit' to the entry id. Anything but a confident hit means no pin, so a
 * flaky model or a rate limit fails safe (no wrong song) rather than wrong.
 * Runs on VISION_MODELS (fast model first) and caches verdicts.
 */
async function verifyIdentity(dataUrl, refs) {
  const t0 = Date.now();
  // dHash of the upload identifies "this exact photo" without hashing bytes.
  let key;
  try {
    // A verdict only holds for THIS reference set: its fingerprint changes as
    // soon as refImages (or their 256px encoding) changes.
    const fp = refs.map((r) => `${r.id}#${r.data.length}`).join(',');
    key = `${IDENTITY_CACHE_VERSION}${fp}::${await dHashFromDataUrl(dataUrl)}`;
  } catch {
    key = null; // undecodable image — no cache, but the call below still works
  }
  const cached = key ? identityCache.get(key) : null;
  if (cached) {
    console.debug(`[vision] identity cache ${secs(Date.now() - t0)} → ${cached.status}`);
    return { ...cached, cached: true };
  }

  const upload = await toGeminiPart(dataUrl, 512); // faces don't need 768
  if (!upload) return { status: 'error', why: 'image encoding failed' };
  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [
        { text: identityPrompt(refs.length) },
        { inlineData: upload },
        ...refs.map((r) => ({ inlineData: { mimeType: r.mimeType, data: r.data } })),
      ],
    }],
    generationConfig: {
      temperature: 0, // deterministic comparison, no creativity wanted here
      responseMimeType: 'application/json',
      responseSchema: IDENTITY_SCHEMA,
    },
  });

  let verdict;
  try {
    const raw = await generateJson(body);
    const confidence = Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : 0;
    const why = String(raw.differences || raw.referenceFace || '').trim();
    verdict =
      raw.samePerson === true && confidence >= IDENTITY_THRESHOLD
        ? { status: 'hit', id: refs[0].id, confidence, why }
        : { status: 'miss', confidence, why };
  } catch (e) {
    verdict = { status: 'error', why: e?.message || String(e) };
  }
  if (key && verdict.status !== 'error') identityCache.set(key, verdict);
  console.debug(`[vision] identity call ${secs(Date.now() - t0)} → ${verdict.status}`);
  return verdict;
}

/** Absolute last resort — static profile so the flow still completes. */
function staticProfile() {
  return {
    source: 'none', mood: 'unplugged', scene: '', timeOfDay: '',
    palette: ['#1ED760', '#121212'], energy: 0.5, valence: 0.5, warmth: 0.5,
    tags: ['no signal'], genres: ['indie'], searchQueries: ['indie chill'], customId: '', customEvidence: '',
    photoWhy: "We couldn't reach the vision API, so this pick is matched from a default profile.",
  };
}

/** Fully local fallback: derive mood/palette/energy from the photo's pixels.
 *  NOTE: has no way to recognize a custom-scan subject, so it always reports
 *  customId '' — without a reachable Gemini key no pinned card can appear. */
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
            customEvidence: '',
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

/**
 * Full vision pass: mood analysis, plus — when the subject has reference
 * photos — a pending identity check that alone is allowed to set `customId`.
 *
 * The gate is deliberate. With refs configured, a `customId` from the mood call
 * would just be a guess, and guessing pinned the wrong photo twice in testing
 * (a team portrait and a group selfie both matched). So refs present means
 * identity decides alone, and anything short of a confident hit is "no pin" —
 * a wrong song is worse than a missing easter egg.
 *
 * Returns as soon as the MOOD call lands. The identity verdict rides along as
 * `analysis.identity` (a Promise of the verdict, never a rejection): track
 * search only needs the mood profile, so it can start immediately and only the
 * pinned card waits for the face check. Callers that ignore the property lose
 * nothing but the pin.
 */
export async function analyzeImage(dataUrl) {
  const refs = await referenceParts();
  // Started now, awaited later — verifyIdentity never rejects (it reports
  // 'error' instead), which is what makes it safe to float like this.
  const identity = refs.length ? verifyIdentity(dataUrl, refs) : Promise.resolve(null);
  const t0 = Date.now();
  let analysis;
  try {
    analysis = await analyzeWithGemini(dataUrl, refs.length > 0);
    console.debug(`[vision] mood call ${secs(Date.now() - t0)}`);
  } catch (err) {
    console.debug(`[vision] mood call failed after ${secs(Date.now() - t0)}`);
    console.warn(
      '[vision] Gemini unavailable → local color analysis (subject/custom-scan recognition is OFF for this upload):',
      err?.message || err,
    );
    analysis = await analyzeImageLocal(dataUrl);
  }
  analysis.identity = identity;
  return analysis;
}
