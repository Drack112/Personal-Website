import { useStorage } from "@vueuse/core";
import { songKey, type Song } from "./usePreview";

// Full songs sent from the walkman to the TV: looked up on YouTube and listed
// in the TV guide's WALKMAN REQUESTS channel (newest first, kept per tab).

export interface SongRequest {
  id: string; // YouTube video id
  name: string;
  artist: string;
}

const KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
const PROXY = `${(import.meta.env.VITE_API_BASE as string | undefined) ?? ""}/api/youtube`;

export const requests = useStorage<SongRequest[]>("lk.requests", [], sessionStorage);

const found = new Map<string, string | null>();

// "Spandau Ballet (Official)" -> "Spandau Ballet"; the song title keeps its version
const query = (s: Song) => `${s.artist.replace(/\(.*?\)|\[.*?\]/g, "").trim()} ${s.name}`;

// video id for a song, or null when it can't be looked up (no key, quota, nothing found)
export async function findVideo(song: Song): Promise<string | null> {
  const k = songKey(song);
  if (found.has(k)) return found.get(k)!;
  const q = query(song);
  let id: string | null = null;
  try {
    if (KEY) {
      const params = new URLSearchParams({ part: "snippet", type: "video", videoEmbeddable: "true", maxResults: "1", q, key: KEY });
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (r.ok) id = (await r.json()).items?.[0]?.id?.videoId ?? null;
    } else {
      const r = await fetch(`${PROXY}?${new URLSearchParams({ q })}`);
      if (r.ok) id = (await r.json()).id ?? null;
    }
  } catch {
    id = null;
  }
  // failures are not cached, so a later try can still work
  if (id) found.set(k, id);
  return id;
}

export const youtubeSearchUrl = (song: Song) =>
  `https://www.youtube.com/results?${new URLSearchParams({ search_query: query(song) })}`;

export function addRequest(r: SongRequest) {
  requests.value = [r, ...requests.value.filter((x) => x.id !== r.id)].slice(0, 12);
}
