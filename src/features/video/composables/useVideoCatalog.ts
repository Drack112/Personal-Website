import { computed } from "vue";

import { requests } from "@/composables/useRequests";
import { clips } from "@/data/clips";
import { nf } from "@/data/icons";
import { maliceMizerMix, midnightMix } from "@/data/mix";
import { playlistUrl, tokusato, videoCategories } from "@/data/tokusato";

import type { Category } from "../types";

const pad = (n: number) => String(n).padStart(2, "0");
const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

const fixed: Category[] = [
  ...videoCategories.map((c) => ({
    id: c.id,
    group: "TOKUSATSU",
    title: c.title,
    subtitle: c.subtitle,
    icon: nf.tv,
    link: playlistUrl(c),
    linkLabel: "playlist",
    via: { name: tokusato.channel, url: tokusato.channelUrl, text: "via" },
    items: c.items.map((e) => ({
      num: `EP${pad(e.ep)}`,
      title: e.title,
      thumb: thumbUrl(e.id),
      screen: {
        kind: "youtube" as const,
        key: e.id,
        id: e.id,
        ep: e.ep,
        playlistId: c.playlistId,
        title: e.title,
        label: `EP ${pad(e.ep)}`,
        fill: c.pillarboxed,
      },
    })),
  })),
  {
    id: "midnight-mix",
    group: "MUSIC",
    title: "MIDNIGHT MIX",
    subtitle: "late-night music for code projects",
    icon: nf.music,
    link: midnightMix.url,
    linkLabel: "youtube",
    via: {
      name: midnightMix.channel,
      url: midnightMix.channelUrl,
      text: "my own mix by",
    },
    items: [
      {
        num: "MIX",
        title: midnightMix.title,
        thumb: thumbUrl(midnightMix.id),
        screen: {
          kind: "youtube" as const,
          key: midnightMix.id,
          id: midnightMix.id,
          ep: 1,
          playlistId: "",
          title: midnightMix.title,
          label: "MIX",
        },
      },
    ],
  },
  {
    id: "malice-mizer",
    group: "MUSIC",
    title: "MALICE MIZER",
    subtitle: "gothic mix · the whole site changes theme while it plays",
    icon: nf.music,
    link: maliceMizerMix.url,
    linkLabel: "youtube",
    via: {
      name: maliceMizerMix.channel,
      url: maliceMizerMix.channelUrl,
      text: "mix by",
    },
    items: [
      {
        num: "MIX",
        title: maliceMizerMix.title,
        thumb: thumbUrl(maliceMizerMix.id),
        theme: "mizer",
        screen: {
          kind: "youtube" as const,
          key: maliceMizerMix.id,
          id: maliceMizerMix.id,
          ep: 1,
          playlistId: "",
          title: maliceMizerMix.title,
          label: "MIZER",
        },
      },
    ],
  },
  {
    id: "luckyuro-cam",
    group: "CLIPS",
    title: "LUCKYURO CAM",
    subtitle: "cookie spy clips",
    icon: nf.cookie,
    items: clips.map((c, i) => ({
      num: `CLIP${pad(i + 1)}`,
      title: `Luckyuro clip ${pad(i + 1)}`,
      screen: {
        kind: "image" as const,
        key: c.name,
        url: c.url,
        title: `Luckyuro clip ${pad(i + 1)}`,
        label: `CH ${pad(i + 1)}`,
      },
    })),
  },
];

function requestsCategory(): Category {
  return {
    id: "requests",
    group: "WALKMAN",
    title: "WALKMAN REQUESTS",
    subtitle: "full songs picked on the walkman",
    icon: nf.cassette,
    items: requests.value.map((r, i) => ({
      num: `REQ${pad(i + 1)}`,
      title: `${r.name} · ${r.artist}`,
      thumb: thumbUrl(r.id),
      screen: {
        kind: "youtube" as const,
        key: r.id,
        id: r.id,
        ep: 1,
        playlistId: "",
        title: `${r.name} · ${r.artist}`,
        label: `REQ ${pad(i + 1)}`,
      },
    })),
  };
}

export function useVideoCatalog() {
  return computed<Category[]>(() =>
    requests.value.length ? [...fixed, requestsCategory()] : fixed,
  );
}
