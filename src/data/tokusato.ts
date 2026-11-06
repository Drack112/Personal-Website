// (@TokuSatoOficial); nothing is re-hosted here.
export const tokusato = {
  channel: "TokuSato",
  channelUrl: "https://www.youtube.com/@TokuSatoOficial",
  rights:
    "Kamen Rider Black © Ishimori Production Inc. · Toei · distributed by TokuSato",
};

export interface Episode {
  id: string; // YouTube video id
  ep: number;
  title: string;
}

export interface VideoCategory {
  id: string;
  title: string;
  subtitle: string;
  playlistId: string;
  // 4:3 episodes uploaded inside a 16:9 frame with black side bars
  pillarboxed?: boolean;
  items: Episode[];
}

export const playlistUrl = (c: VideoCategory) =>
  `https://www.youtube.com/playlist?list=${c.playlistId}`;

export const embedUrl = (e: Episode, playlistId: string, autoplay: boolean) =>
  `https://www.youtube-nocookie.com/embed/${e.id}?${playlistId ? `list=${playlistId}&` : ""}` +
  `rel=0&modestbranding=1&playsinline=1&autoplay=${autoplay ? 1 : 0}`;

export const videoCategories: VideoCategory[] = [
  {
    id: "kamen-rider-black",
    title: "KAMEN RIDER BLACK",
    subtitle: "HD · Dublado",
    playlistId: "PLCsB1XmQtzkk",
    pillarboxed: true,
    items: [
      { id: "4ZR1f6SIgSk", ep: 1, title: "A metamorfose" },
      { id: "xo1sK2lHDXQ", ep: 2, title: "A Festa dos Monstros" },
      { id: "eXnHgLpd_bc", ep: 3, title: "O Mutante das Galáxias" },
      { id: "4JQ9AriGBfc", ep: 4, title: "Experiência Maquiavélica" },
      { id: "bRX-Who4-fA", ep: 5, title: "A Peste das Trevas" },
      { id: "14yomcQEw50", ep: 6, title: "A Guerra dos Computadores" },
      { id: "2K_wo0qOXV8", ep: 7, title: "A Regeneração de Patrol Hopper" },
    ],
  },
];
