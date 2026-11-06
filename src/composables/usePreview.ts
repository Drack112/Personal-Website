import axios from "axios";
import { ref, watchEffect } from "vue";
import { settings } from "./useSettings";

// 30-second song previews from the iTunes Search API (free, no key, CORS open),
// played on the walkman. One <audio> for the whole app.

export interface Song {
  artist: string;
  name: string;
}

interface Hit {
  url: string;
  artwork: string;
}

interface ItunesSong {
  artistName: string;
  trackName: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

export const songKey = (s: Song) => `${s.artist}\u0000${s.name}`;

// "Gold (2022 Remix) - Remastered" -> "gold"; keeps letters of every script
const norm = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]|\s-\s.*$/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");

const close = (a: string, b: string) => {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x && y) && (x.includes(y) || y.includes(x));
};

// the Brazilian store first, then the US and Japanese ones for what it lacks;
// a result only counts when both artist and title match, never a random song
const STORES = ["BR", "US", "JP"];
const cache = new Map<string, Hit | null>();

async function find(song: Song): Promise<Hit | null> {
  const k = songKey(song);
  if (cache.has(k)) return cache.get(k)!;
  const bare = (t: string) => t.replace(/\(.*?\)|\[.*?\]/g, "").trim();
  const term = `${bare(song.artist)} ${bare(song.name)}`;
  let hit: Hit | null = null;
  for (const country of STORES) {
    try {
      const { data } = await axios.get<{ results: ItunesSong[] }>("https://itunes.apple.com/search", {
        params: { term, entity: "song", limit: "10", country },
        timeout: 8000,
      });
      const { results } = data;
      const m = results.find(
        (s) => s.previewUrl && close(s.trackName, song.name) && close(s.artistName, song.artist),
      );
      if (m) {
        hit = {
          url: m.previewUrl!,
          artwork: (m.artworkUrl100 ?? "").replace("100x100", "300x300"),
        };
        break;
      }
    } catch {
      // try the next store
    }
  }
  cache.set(k, hit);
  return hit;
}

export type PreviewStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "missing";

const key = ref<string | null>(null);
const status = ref<PreviewStatus>("idle");
const time = ref(0);
const duration = ref(30);
const artwork = ref("");
let audio: HTMLAudioElement | undefined;

function player() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("timeupdate", () => (time.value = audio!.currentTime));
  audio.addEventListener("loadedmetadata", () => (duration.value = audio!.duration || 30));
  audio.addEventListener("playing", () => (status.value = "playing"));
  audio.addEventListener("pause", () => {
    if (!audio!.ended && status.value === "playing") status.value = "paused";
  });
  audio.addEventListener("ended", () => (status.value = "ended"));
  audio.addEventListener("error", () => {
    if (key.value) status.value = "missing";
  });
  // music follows the app's sound switch and volume, without the sfx attenuation
  watchEffect(() => {
    audio!.volume = settings.volume.value;
    audio!.muted = !settings.sound.value;
  });
  return audio;
}

// play `song` from the start, or carry on where it was paused
async function play(song: Song) {
  const a = player();
  const k = songKey(song);
  if (key.value === k && (status.value === "paused" || status.value === "ended")) {
    if (status.value === "ended") a.currentTime = 0;
    await a.play().catch(() => (status.value = "paused"));
    return;
  }
  if (key.value === k && (status.value === "playing" || status.value === "loading")) return;

  a.pause();
  key.value = k;
  status.value = "loading";
  time.value = 0;
  duration.value = 30;
  artwork.value = "";
  const hit = await find(song);
  if (key.value !== k) return; // another song was picked meanwhile
  if (!hit) {
    status.value = "missing";
    return;
  }
  artwork.value = hit.artwork;
  a.src = hit.url;
  if (status.value !== "loading") return; // paused while it was being looked up
  await a.play().catch(() => (status.value = "paused"));
}

function pause() {
  if (status.value === "loading") status.value = "paused";
  audio?.pause();
}

// stop and forget the song (leaving the page, sending it to the TV)
function stop() {
  audio?.pause();
  key.value = null;
  status.value = "idle";
  time.value = 0;
}

export function usePreview() {
  return { key, status, time, duration, artwork, play, pause, stop };
}
