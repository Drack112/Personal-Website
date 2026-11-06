// GET /api/lastfm/recent | /api/lastfm/top-artists | /api/lastfm/track-length?artist=&track=
// Talks to Last.fm with the key kept on the server and answers with the small,
// clean shapes in shared/api.ts. Answers are cached on Vercel's CDN, so Last.fm
// sees a fraction of the visitors' polling.
// Env: LASTFM_API_KEY (required), LASTFM_USER (defaults to Drack112).
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ApiError, RecentTracks, TopArtists, Track, TrackLength } from '../../shared/api'

type Request = IncomingMessage & { query: Partial<Record<string, string | string[]>> }

const USER = process.env.LASTFM_USER || 'Drack112'
// Last.fm's grey star, served when a track has no cover
const PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

// what Last.fm sends for a track in user.getrecenttracks
interface RawTrack {
  name: string
  url: string
  artist: { '#text'?: string; name?: string }
  album?: { '#text': string }
  image?: { size: string; '#text': string }[]
  '@attr'?: { nowplaying?: string }
  date?: { uts: string }
}

const param = (req: Request, name: string) => {
  const v = req.query[name]
  return String((Array.isArray(v) ? v[0] : v) ?? '').trim().slice(0, 200)
}

function send<T>(res: ServerResponse, status: number, body: T | ApiError, cacheSeconds = 0) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (cacheSeconds) res.setHeader('Vercel-CDN-Cache-Control', `max-age=${cacheSeconds}`)
  res.end(JSON.stringify(body))
}

// a Last.fm failure, with the HTTP status this API should answer with
class LastfmError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function lastfm<T>(key: string, params: Record<string, string>): Promise<T> {
  const q = new URLSearchParams({ ...params, api_key: key, format: 'json' })
  const r = await fetch(`https://ws.audioscrobbler.com/2.0/?${q}`, { signal: AbortSignal.timeout(5000) })
  const data = (await r.json()) as T & { error?: number; message?: string }
  // Last.fm sometimes reports errors with a 200; its error 6 means "not found"
  if (!r.ok || data.error) throw new LastfmError(data.message || `Last.fm ${r.status}`, data.error === 6 ? 404 : 502)
  return data
}

const toTrack = (t: RawTrack): Track => {
  const img = t.image?.find((i) => i.size === 'extralarge') ?? t.image?.find((i) => i.size === 'large')
  return {
    name: t.name,
    artist: t.artist['#text'] || t.artist.name || '',
    album: t.album?.['#text'] || '',
    image: img && !img['#text'].includes(PLACEHOLDER) ? img['#text'] : '',
    url: t.url,
    nowPlaying: Boolean(t['@attr']?.nowplaying),
    uts: t.date ? Number(t.date.uts) : null,
  }
}

export default async function handler(req: Request, res: ServerResponse) {
  const key = process.env.LASTFM_API_KEY
  if (!key) return send(res, 503, { error: 503, message: 'LASTFM_API_KEY is not set' })

  const view = param(req, 'view')
  try {
    if (view === 'recent') {
      const data = await lastfm<{ recenttracks: { track?: RawTrack | RawTrack[]; '@attr'?: { total: string } } }>(key, {
        method: 'user.getrecenttracks',
        user: USER,
        limit: '10',
      })
      // a single scrobble comes back as an object instead of an array
      const tracks = ([] as RawTrack[]).concat(data.recenttracks.track ?? []).map(toTrack)
      return send<RecentTracks>(res, 200, { tracks, total: Number(data.recenttracks['@attr']?.total || 0) }, 10)
    }

    if (view === 'top-artists') {
      const data = await lastfm<{ topartists: { artist: { name: string; playcount: string; url: string }[] } }>(key, {
        method: 'user.gettopartists',
        user: USER,
        period: '7day',
        limit: '6',
      })
      const artists = data.topartists.artist.map((a) => ({ name: a.name, playcount: Number(a.playcount), url: a.url }))
      return send<TopArtists>(res, 200, { artists }, 600)
    }

    if (view === 'track-length') {
      const artist = param(req, 'artist')
      const track = param(req, 'track')
      if (!artist || !track) return send(res, 400, { error: 400, message: 'artist and track are required' })
      const data = await lastfm<{ track?: { duration?: string } }>(key, { method: 'track.getInfo', artist, track })
      // Last.fm gives milliseconds; a song's length hardly changes, so cache it for a day
      return send<TrackLength>(res, 200, { seconds: Math.round(Number(data.track?.duration || 0) / 1000) }, 86400)
    }

    return send(res, 404, { error: 404, message: `unknown view "${view}"` })
  } catch (e) {
    const status = e instanceof LastfmError ? e.status : 502
    return send(res, status, { error: status, message: e instanceof Error ? e.message : 'Last.fm error' })
  }
}
