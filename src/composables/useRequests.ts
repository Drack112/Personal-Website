import { useStorage } from "@vueuse/core";
import { api } from "@/lib/api";
import { songKey, type Song } from "./usePreview";
import type { VideoMatch } from "../../shared/api";

// Full songs sent from the walkman to the TV: looked up on YouTube and listed
// in the TV guide's WALKMAN REQUESTS channel (newest first, kept per tab).

export interface SongRequest {
  id: string; // YouTube video id
  name: string;
  artist: string;
}

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
    id = (await api<VideoMatch>("youtube", { q })).id;
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
