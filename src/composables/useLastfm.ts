import { computed, ref } from "vue";
import { api } from "@/lib/api";
import type { RecentTracks, TopArtist, TopArtists, Track, TrackLength } from "../../shared/api";

export type { Track, TopArtist };

const tracks = ref<Track[]>([]);
const topArtists = ref<TopArtist[]>([]);
const scrobbles = ref<number | null>(null);

// tape position of the track on top: seconds into it and its length (0 = unknown)
const position = ref({ elapsed: 0, length: 0, at: Date.now() });
const status = ref<"idle" | "loading" | "ready" | "offline">("idle");

async function trackLength(t?: Track): Promise<number> {
  if (!t) return 0;
  try {
    const { seconds } = await api<TrackLength>("lastfm/track-length", { artist: t.artist, track: t.name });
    return seconds;
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
    const recent = await api<RecentTracks>("lastfm/recent");
    const list = recent.tracks;

    const changed =
      list[0]?.name !== tracks.value[0]?.name ||
      list[0]?.nowPlaying !== tracks.value[0]?.nowPlaying;

    tracks.value = list;
    scrobbles.value = recent.total;

    if (changed)
      position.value = { ...(await estimatePosition(list)), at: Date.now() };

    if (Date.now() - lastTop > 10 * 60 * 1000) {
      topArtists.value = (await api<TopArtists>("lastfm/top-artists")).artists;
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
