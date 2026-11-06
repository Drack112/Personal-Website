// GET /api/youtube?q=artist+title
// Finds the YouTube video for a song, so the walkman can send the full track to
// the TV. The key stays on the server; answers are cached on the CDN for a week,
// since every search costs 100 of the 10,000 daily quota units.
// Env: YOUTUBE_API_KEY (required).
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ApiError, VideoMatch } from '../shared/api'

type Request = IncomingMessage & { query: Partial<Record<string, string | string[]>> }

interface SearchResponse {
  items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }[]
  error?: { message?: string }
}

function send<T>(res: ServerResponse, status: number, body: T | ApiError, cacheSeconds = 0) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (cacheSeconds) res.setHeader('Vercel-CDN-Cache-Control', `max-age=${cacheSeconds}`)
  res.end(JSON.stringify(body))
}

export default async function handler(req: Request, res: ServerResponse) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return send(res, 503, { error: 503, message: 'YOUTUBE_API_KEY is not set' })

  const raw = req.query.q
  const q = String((Array.isArray(raw) ? raw[0] : raw) ?? '').trim().slice(0, 200)
  if (!q) return send(res, 400, { error: 400, message: 'q is required' })

  const params = new URLSearchParams({ part: 'snippet', type: 'video', videoEmbeddable: 'true', maxResults: '1', q, key })
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { signal: AbortSignal.timeout(5000) })
    const data = (await r.json()) as SearchResponse
    if (!r.ok) return send(res, r.status, { error: r.status, message: data.error?.message || 'YouTube error' })
    const hit = data.items?.[0]
    const match: VideoMatch = hit ? { id: hit.id.videoId, title: hit.snippet.title, channel: hit.snippet.channelTitle } : { id: null }
    return send<VideoMatch>(res, 200, match, 604800)
  } catch (e) {
    return send(res, 502, { error: 502, message: e instanceof Error ? e.message : 'YouTube error' })
  }
}
