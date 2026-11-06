# drack · portfolio

Retro console portfolio (Vue 3 + Vite): memory-card projects, a pixel-art CRT
TV for YouTube and a walkman for Last.fm, watched over by Luckyuro.

```sh
npm install
cp .env.example .env.local   # optional, see below
npm run dev
```

## Deploy on Vercel

Only this `frontend/` folder is deployed. `vercel.json` sets the Vite build and
sends every route (`/music`, `/video/...`) to `index.html`.

1. **New Project** on Vercel → import the repository → **Root Directory:
   `frontend`** (the preset is detected as Vite). Or run `vercel --prod` from
   this folder with the Vercel CLI.
2. Environment variables: none are required.
   - `VITE_SITE_URL` (optional): the public address, e.g.
     `https://drack.dev`, for the link-preview tags. Without it the Vercel
     production domain is used.
   - Do **not** add `VITE_LASTFM_API_KEY` or `VITE_YOUTUBE_API_KEY` here:
     `VITE_*` values end up in the public JavaScript.
3. Deploy.

### The API it talks to

Last.fm and the YouTube search go through the serverless functions of the
profile repository (`api/`), deployed at `https://drack112-ten.vercel.app`
(`.env.production` → `VITE_API_BASE`). That project needs:

| Endpoint | File | Env var on the API project |
| --- | --- | --- |
| `/api/lastfm` | `api/lastfm.js` | `LASTFM_API_KEY` |
| `/api/youtube` | `api/youtube.js` | `YOUTUBE_API_KEY` |

Without them the walkman shows "last.fm offline" and FULL SONG ON THE TV falls
back to a YouTube search tab. The 30-second previews (iTunes) need nothing.

## Local env (`.env.local`)

| Variable | Use |
| --- | --- |
| `VITE_LASTFM_API_KEY` | call Last.fm directly in dev, without the API project |
| `VITE_YOUTUBE_API_KEY` | same for the YouTube search |
| `VITE_API_BASE` | where `/api` lives (empty = same domain) |
| `VITE_SITE_URL` | absolute URL for the share card |

The share image (`public/og-image.png`) and the home-screen icon
(`public/apple-touch-icon.png`) are static files.
