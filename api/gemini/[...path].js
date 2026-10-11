/**
 * Production Gemini proxy for Vercel — the deployed twin of the dev-only
 * middleware in `vite.config.js`. The frontend calls relative
 * `/api/gemini/v1beta/models/<model>:generateContent` in both environments;
 * locally that hits the Vite dev server, on Vercel it hits this function.
 * The key stays server-side either way (never in client code).
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

const GENERATE_RE = /^v1beta\/models\/[a-zA-Z0-9._-]+:generateContent$/;

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

  // Catch-all query param: ['v1beta', 'models', 'gemini-3.5-flash-lite:generateContent']
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || '');
  // Only the exact endpoint the app calls — this can never become an open
  // relay for arbitrary requests billed to our key.
  if (!GENERATE_RE.test(path)) return send(res, 404, 'Not found');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 400, 'GEMINI_API_KEY missing in this deployment — add it under Vercel Settings → Environment Variables and redeploy');
  }

  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/${path}`, {
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
