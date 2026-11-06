# drack · portfolio

Retro console portfolio (Vue 3 + Vite): memory-card projects, a pixel-art CRT
TV for YouTube and a walkman for Last.fm, watched over by Luckyuro.

```sh
npm install
npm run dev        # the app, using the deployed /api
npx vercel dev     # the app and the api/ functions together, to work on the API
```

## API

Last.fm and the YouTube search go through this project's own serverless
functions in `api/` (TypeScript), so the API keys stay on the server and the
answers are cached on Vercel's CDN. The response types live in
`shared/api.ts` and are used by both the functions and the composables
(`useLastfm`, `useRequests`, through `src/lib/api.ts`).

| Endpoint | File | Returns | CDN cache |
| --- | --- | --- | --- |
| `GET /api/lastfm/recent` | `api/lastfm/[view].ts` | `RecentTracks` | 10 s |
| `GET /api/lastfm/top-artists` | `api/lastfm/[view].ts` | `TopArtists` | 10 min |
| `GET /api/lastfm/track-length?artist=&track=` | `api/lastfm/[view].ts` | `TrackLength` | 1 day |
| `GET /api/youtube?q=` | `api/youtube.ts` | `VideoMatch` | 1 week |

Errors come back as `ApiError` (`{ error, message }`) with the same HTTP
status.

In development, `npm run dev` forwards `/api` to the deployed site (set
`API_PROXY` to point it elsewhere), so no keys are needed. To change the
functions themselves, use `npx vercel dev`: it runs Vite and `api/` together
with the same routing as production, reading the keys from `.env`.

## Environment variables

Set them in Vercel → Project → Settings → Environment Variables. Locally,
only `npx vercel dev` needs them (in `.env`).

| Variable | Use |
| --- | --- |
| `LASTFM_API_KEY` | Last.fm API key, for `/api/lastfm/*` |
| `LASTFM_USER` | whose scrobbles to show (default `Drack112`) |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key, for `/api/youtube` |
| `VITE_SITE_URL` | public address for the link-preview tags (default: the Vercel production domain) |
| `API_PROXY` | `npm run dev` only: where `/api` goes (default: the production site) |

Only `VITE_*` values end up in the browser bundle, so the keys never use that
prefix. Without `LASTFM_API_KEY` the walkman shows "last.fm offline"; without
`YOUTUBE_API_KEY` FULL SONG ON THE TV falls back to a YouTube search tab. The
30-second previews (iTunes) need nothing.

## Deploy on Vercel

Only this `frontend/` folder is deployed. `vercel.json` sets the Vite build and
sends every route (`/music`, `/video/...`) to `index.html`, except `/api/*`,
which the functions answer.

1. **New Project** on Vercel → import the repository (Root Directory:
   `frontend` if it is a subfolder; the preset is detected as Vite).
2. Add the environment variables above.
3. Deploy (every push to `master` deploys production).

The share image (`public/og-image.png`) and the home-screen icon
(`public/apple-touch-icon.png`) are static files.
