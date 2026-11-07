import axios from "axios";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type {
  ApiError,
  RecentTracks,
  TopArtists,
  Track,
  TrackLength,
} from "../../shared/api";

const USER = process.env.LASTFM_USER!;
const PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

const lastfmApi = axios.create({
  baseURL: "https://ws.audioscrobbler.com/2.0/",
  timeout: 5000,
});

interface RawTrack {
  name: string;
  url: string;
  artist: { "#text"?: string; name?: string };
  album?: { "#text": string };
  image?: { size: string; "#text": string }[];
  "@attr"?: { nowplaying?: string };
  date?: { uts: string };
}

interface LastfmFailure {
  error?: number;
  message?: string;
}

class LastfmError extends Error {
  readonly status: number;
  constructor(message: string, code?: number) {
    super(message);
    this.status = code === 6 ? 404 : 502;
  }
}

async function lastfm<T>(
  key: string,
  params: Record<string, string>,
): Promise<T> {
  try {
    const { data } = await lastfmApi.get<T & LastfmFailure>("", {
      params: { ...params, api_key: key, format: "json" },
    });
    // Last.fm sometimes reports errors with a 200
    if (data.error)
      throw new LastfmError(data.message || "Last.fm error", data.error);
    return data;
  } catch (e) {
    if (e instanceof LastfmError) throw e;
    const body = axios.isAxiosError<LastfmFailure>(e)
      ? e.response?.data
      : undefined;

    throw new LastfmError(
      body?.message || (e instanceof Error ? e.message : "Last.fm error"),
      body?.error,
    );
  }
}

const param = (req: VercelRequest, name: string) => {
  const v = req.query[name];
  return String((Array.isArray(v) ? v[0] : v) ?? "")
    .trim()
    .slice(0, 200);
};

const toTrack = (t: RawTrack): Track => {
  const img =
    t.image?.find((i) => i.size === "extralarge") ??
    t.image?.find((i) => i.size === "large");
  return {
    name: t.name,
    artist: t.artist["#text"] || t.artist.name || "",
    album: t.album?.["#text"] || "",
    image: img && !img["#text"].includes(PLACEHOLDER) ? img["#text"] : "",
    url: t.url,
    nowPlaying: Boolean(t["@attr"]?.nowplaying),
    uts: t.date ? Number(t.date.uts) : null,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.LASTFM_API_KEY;
  if (!key)
    return res.status(503).json({
      error: 503,
      message: "LASTFM_API_KEY is not set",
    } satisfies ApiError);

  const view = param(req, "view");
  try {
    if (view === "recent") {
      const data = await lastfm<{
        recenttracks: {
          track?: RawTrack | RawTrack[];
          "@attr"?: { total: string };
        };
      }>(key, {
        method: "user.getrecenttracks",
        user: USER,
        limit: "10",
      });
      // a single scrobble comes back as an object instead of an array
      const tracks = ([] as RawTrack[])
        .concat(data.recenttracks.track ?? [])
        .map(toTrack);
      res.setHeader("Vercel-CDN-Cache-Control", `max-age=${10}`);
      return res.status(200).json({
        tracks,
        total: Number(data.recenttracks["@attr"]?.total || 0),
      } satisfies RecentTracks);
    }

    if (view === "top-artists") {
      const data = await lastfm<{
        topartists: {
          artist: { name: string; playcount: string; url: string }[];
        };
      }>(key, {
        method: "user.gettopartists",
        user: USER,
        period: "7day",
        limit: "6",
      });
      const artists = data.topartists.artist.map((a) => ({
        name: a.name,
        playcount: Number(a.playcount),
        url: a.url,
      }));
      res.setHeader("Vercel-CDN-Cache-Control", `max-age=${600}`);
      return res.status(200).json({ artists } satisfies TopArtists);
    }

    if (view === "track-length") {
      const artist = param(req, "artist");
      const track = param(req, "track");
      if (!artist || !track)
        return res.status(400).json({
          error: 400,
          message: "artist and track are required",
        } satisfies ApiError);
      const data = await lastfm<{ track?: { duration?: string } }>(key, {
        method: "track.getInfo",
        artist,
        track,
      });
      res.setHeader("Vercel-CDN-Cache-Control", `max-age=${86400}`);
      return res.status(200).json({
        seconds: Math.round(Number(data.track?.duration || 0) / 1000),
      } satisfies TrackLength);
    }

    return res.status(404).json({
      error: 404,
      message: `unknown view "${view}"`,
    } satisfies ApiError);
  } catch (e) {
    const status = e instanceof LastfmError ? e.status : 502;
    return res.status(404).json({
      error: 404,
      message: e instanceof Error ? e.message : "Last.fm error",
    } satisfies ApiError);
  }
}
