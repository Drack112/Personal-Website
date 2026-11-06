// Response shapes of the site's own API (the Vercel functions in api/), shared by
// the functions that send them and the composables that read them.

// any failure, with the HTTP status repeated in `error`
export interface ApiError {
  error: number
  message: string
}

// --- /api/lastfm/* -----------------------------------------------------------------

export interface Track {
  name: string
  artist: string
  album: string
  image: string // cover URL, '' when Last.fm only has its placeholder
  url: string
  nowPlaying: boolean
  uts: number | null // when it was scrobbled (unix seconds), null while playing
}

export interface TopArtist {
  name: string
  playcount: number
  url: string
}

// GET /api/lastfm/recent
export interface RecentTracks {
  tracks: Track[] // newest first
  total: number // all-time scrobbles
}

// GET /api/lastfm/top-artists
export interface TopArtists {
  artists: TopArtist[] // last 7 days
}

// GET /api/lastfm/track-length?artist=&track=
export interface TrackLength {
  seconds: number // 0 when Last.fm doesn't know it
}

// --- /api/youtube ------------------------------------------------------------------

// GET /api/youtube?q=artist+title
export interface VideoMatch {
  id: string | null // null when nothing embeddable was found
  title?: string
  channel?: string
}
