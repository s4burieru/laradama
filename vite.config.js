import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'
import { Buffer } from 'node:buffer'

/**
 * Local-dev API layer (zero cost, keys stay server-side):
 *   POST /api/gemini/...  -> generativelanguage.googleapis.com   (GEMINI_API_KEY injected here)
 *   GET  /api/itunes/...  -> itunes.apple.com                    (keyless, proxy avoids CORS)
 *   GET  /api/spotify/... -> api.spotify.com                     (client-credentials fetched + cached here)
 * These middlewares only run under `npm run dev`; the frontend degrades
 * gracefully when they are absent (local color analysis / Spotify search link).
 */
function devApi({ geminiKey, spotifyId, spotifySecret }) {
  let cachedToken = null // { value, expiresAt }

  async function spotifyToken(res) {
    if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value
    if (!spotifyId || !spotifySecret) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: { message: 'SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing in .env.local' } }))
      return null
    }
    const basic = Buffer.from(`${spotifyId}:${spotifySecret}`).toString('base64')
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    })
    if (!r.ok) {
      res.statusCode = 502
      res.end(JSON.stringify({ error: { message: `Spotify token request failed (${r.status})` } }))
      return null
    }
    const data = await r.json()
    cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
    return cachedToken.value
  }

  const send = (res, status, body) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(typeof body === 'string' ? body : JSON.stringify(body))
  }

  return {
    name: 'laradama-dev-api',
    configureServer(server) {
      // --- Gemini (vision AI) ---
      server.middlewares.use('/api/gemini', async (req, res) => {
        try {
          if (!geminiKey) return send(res, 400, { error: { message: 'GEMINI_API_KEY missing in .env.local — get a free key at https://aistudio.google.com/apikey' } })
          const chunks = []
          for await (const c of req) chunks.push(c)
          const upstream = await fetch(`https://generativelanguage.googleapis.com${req.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
            body: Buffer.concat(chunks),
          })
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await upstream.text())
        } catch (e) {
          send(res, 502, { error: { message: String(e?.message || e) } })
        }
      })

      // --- iTunes (keyless music search / 30s previews) ---
      server.middlewares.use('/api/itunes', async (req, res) => {
        try {
          const upstream = await fetch(`https://itunes.apple.com${req.url}`, {
            headers: { Accept: 'application/json' },
          })
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await upstream.text())
        } catch (e) {
          send(res, 502, { error: { message: String(e?.message || e) } })
        }
      })

      // --- Spotify (resolves a real track URL for the "Listen on Spotify" button) ---
      server.middlewares.use('/api/spotify', async (req, res) => {
        try {
          const token = await spotifyToken(res)
          if (!token) return
          const upstream = await fetch(`https://api.spotify.com/v1${req.url}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          })
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await upstream.text())
        } catch (e) {
          send(res, 502, { error: { message: String(e?.message || e) } })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      devApi({
        geminiKey: env.GEMINI_API_KEY || '',
        spotifyId: env.SPOTIFY_CLIENT_ID || '',
        spotifySecret: env.SPOTIFY_CLIENT_SECRET || '',
      }),
    ],
  }
})
