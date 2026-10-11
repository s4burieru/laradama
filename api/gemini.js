/**
 * Production Gemini proxy for Vercel — the deployed twin of the dev-only
 * middleware in `vite.config.js`. The frontend calls `/api/gemini?model=<id>`
 * in both environments; locally that hits the Vite dev server, on Vercel it
 * hits this function. The key stays server-side either way (never in client
 * code).
 *
 * The model rides in a QUERY PARAM on purpose: a plain `api/gemini.js` maps to
 * the single-segment route `/api/gemini` — Vercel's most basic routing case.
 * The earlier `api/gemini/[...path].js` catch-all only registered a
 * single-segment route in practice, so the app's real multi-segment URL
 * (`/api/gemini/v1beta/models/<id>:generateContent`) died at Vercel's router
 * with NOT_FOUND and never reached the function.
 *
 * Status codes and response bodies are forwarded VERBATIM: `src/lib/vision.js`
 * and `src/lib/match.js` branch on 400/401/403/404/429/5xx and on the error
 * message text to decide between aborting and trying the next model — wrapping
 * responses would break that fallback logic.
 *
 * Requires GEMINI_API_KEY in the Vercel project's Environment Variables
 * (Settings → Environment Variables, Production + Preview). `.env.local` is
 * git-ignored and is never read by Vercel.
 */

import process from 'node:process';

// Model ids only — no slashes, no path traversal, so this endpoint can never
// be used as an open relay to arbitrary upstream URLs on our key.
const MODEL_RE = /^[a-zA-Z0-9.-]+$/;

const send = (res, status, message) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: { message } }));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, `Method ${req.method} not allowed`);
  }

  // Vercel populates req.query from the URL; parse manually too so the
  // handler behaves identically if query parsing is ever absent.
  const query = req.query?.model ?? new URL(req.url || '', 'http://localhost').searchParams.get('model') ?? '';
  const model = String(query);
  if (!MODEL_RE.test(model)) return send(res, 404, 'Not found');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 400, 'GEMINI_API_KEY missing in this deployment — add it under Vercel Settings → Environment Variables and redeploy');
  }

  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      // Vercel parses JSON bodies into req.body; re-serializing is semantically
      // identical (JSON object key order is preserved by modern engines).
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}),
    });
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.end(await upstream.text());
  } catch (e) {
    send(res, 502, String(e?.message || e));
  }
}
