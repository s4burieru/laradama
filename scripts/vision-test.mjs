/**
 * Vision smoke test — replays the EXACT requests `src/lib/vision.js` builds
 * (same prompts, schemas, model order, identity gate, both calls in parallel)
 * straight against Gemini, so you can tell a key/model/prompt problem apart
 * from a matching problem without opening a browser.
 *
 *   node scripts/vision-test.mjs                    # public/refs/rene-2.jpg
 *   node scripts/vision-test.mjs path/to/photo.jpg  # any image
 *   VISION_MODEL=gemini-3.5-flash-lite node scripts/vision-test.mjs <image>
 *
 * Prints the mood profile, the identity verdict and the pin/no-pin decision
 * the app would make. One caveat for reading the timings: unlike the app this
 * sends raw bytes (no canvas in Node), so requests here are the worst case —
 * real in-app timings are on the `[vision] …` console lines.
 */
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import {
  buildPrompt, buildSchema, identityPrompt, IDENTITY_SCHEMA, IDENTITY_THRESHOLD, VISION_MODELS,
} from '../src/lib/vision.js';
import { recognizableEntries, subjectBlock, activeEntries, visionRefTargets } from '../src/lib/customMatch.js';

const MIMES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
// One model order for both calls, exactly as the app uses it.
const models = process.env.VISION_MODEL ? [process.env.VISION_MODEL] : VISION_MODELS;

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (!existsSync('.env.local')) return '';
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === 'GEMINI_API_KEY') return m[2].replace(/^["']|["']$/g, '');
  }
  return '';
}

const key = loadKey();
if (!key) {
  console.error('No GEMINI_API_KEY — copy .env.local.example to .env.local and fill it in.');
  process.exit(1);
}

const target = process.argv[2] || 'public/refs/rene-2.jpg';
if (!existsSync(target)) {
  console.error(`image not found: ${target}`);
  process.exit(1);
}
const mime = MIMES[extname(target).toLowerCase()] || 'image/jpeg';
const upload = { mimeType: mime, data: readFileSync(target).toString('base64') };
console.log(`image: ${target} (${(readFileSync(target).length / 1024).toFixed(1)} kB, ${mime})`);

// Reference photos of ONE subject, capped at 2 — exactly what the app attaches.
const allRefs = visionRefTargets(4);
const entryId = allRefs[0]?.id;
const refs = allRefs
  .filter((t) => t.id === entryId)
  .slice(0, 2)
  .map((t) => {
    const file = join('public', t.url);
    if (!existsSync(file)) return null;
    return { id: t.id, mimeType: MIMES[extname(file).toLowerCase()] || 'image/jpeg', data: readFileSync(file).toString('base64') };
  })
  .filter(Boolean);
console.log(`reference photos attached: ${refs.map((r) => r.id).join(', ') || '(none)'}`);

/** Two passes over the model list, same fallthrough as vision.js. */
async function generateJson(body, modelList) {
  const transient = (s) => s === 429 || (s >= 500 && s < 600);
  let lastErr = null;
  for (const model of [...modelList, ...modelList]) {
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body,
      });
    } catch (e) { lastErr = e; break; }
    if (res.status === 401 || res.status === 403) throw new Error(`auth failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    if (res.status === 400 || res.status === 404 || transient(res.status)) {
      lastErr = new Error(`${model} unavailable (${res.status})`);
      continue;
    }
    if (!res.ok) throw new Error(`${model} error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    try {
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      if (!text) throw new Error('no content');
      return JSON.parse(text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('no model answered');
}

// --- call 1: mood analysis (recognition skipped when refs decide customId) ---
const entries = refs.length ? [] : recognizableEntries();
const analysisBody = JSON.stringify({
  contents: [{ role: 'user', parts: [{ text: buildPrompt(refs.length ? '' : subjectBlock()) }, { inlineData: upload }] }],
  generationConfig: { temperature: 0.3, responseMimeType: 'application/json', responseSchema: buildSchema(entries.map((e) => e.id)) },
});

// --- call 2: identity gate (only when the subject has reference photos) ---
const idBody = refs.length
  ? JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: identityPrompt(refs.length) }, { inlineData: upload }, ...refs.map((r) => ({ inlineData: { mimeType: r.mimeType, data: r.data } })) ] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: IDENTITY_SCHEMA },
    })
  : null;

// The app fires both together, so this does too — running them one after the
// other here would report a total wait nobody experiences in the browser.
const moodRun = (async () => {
  const t = Date.now();
  try {
    const out = await generateJson(analysisBody, models);
    console.log(`  mood call OK (${Date.now() - t}ms, first choice ${models[0]})`);
    return out;
  } catch (e) {
    console.log(`  mood call FAILED after ${Date.now() - t}ms — ${e.message}`);
    return null;
  }
})();
const identityRun = idBody
  ? (async () => {
      const t = Date.now();
      try {
        const out = await generateJson(idBody, models);
        console.log(`  identity call OK (${Date.now() - t}ms, first choice ${models[0]})`);
        return out;
      } catch (e) {
        console.log(`  identity call FAILED after ${Date.now() - t}ms — ${e.message}`);
        return null;
      }
    })()
  : Promise.resolve(null);

const [analysis, identity] = await Promise.all([moodRun, identityRun]);
const analysisErr = analysis ? null : new Error('mood call failed');

console.log('\nwhat the app would see:');
if (analysis) {
  console.log('  mood     :', analysis.mood);
  console.log('  genres   :', (analysis.genres || []).join(', '));
  console.log('  photoWhy :', analysis.photoWhy);
} else {
  console.log('  mood     : (unavailable — falls back to local color analysis)');
}

let customId = analysis?.customId || '';
let evidence = analysis?.customEvidence || '';
if (refs.length) {
  const hit = identity && identity.samePerson === true && Number(identity.confidence) >= IDENTITY_THRESHOLD;
  customId = hit ? refs[0].id : '';
  evidence = identity
    ? hit
      ? `face match ${Number(identity.confidence).toFixed(2)} — ${identity.differences || 'no differences'}`
      : `identity miss (${identity.confidence}) — ${identity.differences || ''}`
    : `identity unavailable${analysisErr ? ` (${analysisErr.message})` : ''}`;
  console.log('  identity :', identity ? `samePerson=${identity.samePerson} confidence=${identity.confidence} differences="${identity.differences}"` : '(no answer)');
}
console.log('  customId :', customId || '(none)');
console.log('  evidence :', evidence || '(none)');

const entry = customId ? activeEntries().find((e) => e.id === customId) : null;
console.log(entry ? `\nMATCH -> pinned card: "${entry.title}" — ${entry.artist}` : '\nNO MATCH -> normal mood pipeline (no pinned card)');
