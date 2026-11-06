import { computed, ref } from "vue";
import { LASTFM_USER } from "@/data/profile";

export interface Track {
  name: string;
  artist: string;
  album: string;
  image: string;
  url: string;
  nowPlaying: boolean;
  uts: number | null;
}

export interface TopArtist {
  name: string;
  playcount: number;
  url: string;
}

const KEY = import.meta.env.VITE_LASTFM_API_KEY as string | undefined;
const PROXY = `${(import.meta.env.VITE_API_BASE as string | undefined) ?? ""}/api/lastfm`;

// Last.fm's grey star placeholder, served when a track has no cover
const PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

const tracks = ref<Track[]>([]);
const topArtists = ref<TopArtist[]>([]);
const scrobbles = ref<number | null>(null);

// tape position of the track on top: seconds into it and its length (0 = unknown)
const position = ref({ elapsed: 0, length: 0, at: Date.now() });
const status = ref<"idle" | "loading" | "ready" | "offline">("idle");

async function call<T>(params: Record<string, string>): Promise<T> {
  const q = new URLSearchParams({ ...params, format: "json" });
  const url = KEY
    ? `https://ws.audioscrobbler.com/2.0/?${q}&api_key=${KEY}`
    : `${PROXY}?${q}`;

  const request = await fetch(url);
  if (!request.ok) throw new Error(`Last.fm ${request.status}`);

  const response = await request.json();
  if (response.error) throw new Error(response.message);
  return response as T;
}

interface RawTrack {
  name: string;
  url: string;
  artist: { "#text"?: string; name?: string };
  album: { "#text": string };
  image: { size: string; "#text": string }[];
  "@attr"?: { nowplaying?: string };
  date?: { uts: string };
}

const toTrack = (t: RawTrack): Track => {
  const img =
    (t.image || []).find((i) => i.size === "extralarge") ||
    (t.image || []).find((i) => i.size === "large");

  const image = img && !img["#text"].includes(PLACEHOLDER) ? img["#text"] : "";

  return {
    name: t.name,
    artist: t.artist["#text"] || t.artist.name || "",
    album: t.album?.["#text"] || "",
    image,
    url: t.url,
    nowPlaying: Boolean(t["@attr"]?.nowplaying),
    uts: t.date ? Number(t.date.uts) : null,
  };
};

async function trackLength(t?: Track): Promise<number> {
  if (!t) return 0;
  try {
    const j = await call<{ track?: { duration?: string } }>({
      method: "track.getInfo",
      artist: t.artist,
      track: t.name,
    });
    return Math.round(Number(j.track?.duration || 0) / 1000);
  } catch {
    return 0;
  }
}

async function estimatePosition(list: Track[]) {
  const now = list[0];

  if (!now) return { elapsed: 0, length: 0 };
  if (!now.nowPlaying) {
    const length = await trackLength(now);
    return { elapsed: length, length };
  }

  const prev = list[1];
  const [length, prevLength] = await Promise.all([
    trackLength(now),
    trackLength(prev),
  ]);

  let elapsed = 0;
  if (prev?.uts && prevLength) {
    const guess = Date.now() / 1000 - (prev.uts + prevLength);
    if (guess >= 0 && guess <= (length || 600) + 30) elapsed = guess;
  }

  if (length) elapsed = Math.min(elapsed, length);
  return { elapsed: Math.floor(elapsed), length };
}

let lastTop = 0;
async function refresh() {
  if (status.value === "idle") status.value = "loading";

  try {
    const recent = await call<{
      recenttracks: {
        track: RawTrack | RawTrack[];
        "@attr": { total: string };
      };
    }>({
      method: "user.getrecenttracks",
      user: LASTFM_USER,
      limit: "10",
    });

    // a single scrobble comes back as an object instead of an array
    const list = ([] as RawTrack[])
      .concat(recent.recenttracks.track || [])
      .map(toTrack);

    const changed =
      list[0]?.name !== tracks.value[0]?.name ||
      list[0]?.nowPlaying !== tracks.value[0]?.nowPlaying;

    tracks.value = list;
    scrobbles.value = Number(recent.recenttracks["@attr"]?.total || 0);

    if (changed)
      position.value = { ...(await estimatePosition(list)), at: Date.now() };

    if (Date.now() - lastTop > 10 * 60 * 1000) {
      const top = await call<{
        topartists: {
          artist: { name: string; playcount: string; url: string }[];
        };
      }>({
        method: "user.gettopartists",
        user: LASTFM_USER,
        period: "7day",
        limit: "6",
      });

      topArtists.value = top.topartists.artist.map((a) => ({
        name: a.name,
        playcount: Number(a.playcount),
        url: a.url,
      }));
      lastTop = Date.now();
    }
    status.value = "ready";
  } catch {
    status.value = "offline";
  }
}

let timer: number | undefined;
let users = 0;

export function useLastfm() {
  return {
    tracks,
    topArtists,
    scrobbles,
    position,
    status,
    current: computed(() => tracks.value[0] ?? null),
    refresh,
    // poll while at least one widget is on screen
    start() {
      users++;
      if (users === 1) {
        void refresh();
        timer = window.setInterval(refresh, 30_000);
      }
    },
    stop() {
      users = Math.max(0, users - 1);
      if (!users) window.clearInterval(timer);
    },
  };
}
