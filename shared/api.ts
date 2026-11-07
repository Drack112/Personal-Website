export interface ApiError {
  error: number;
  message: string;
}
export interface Track {
  name: string;
  artist: string;
  album: string;
  image: string; // cover URL, '' when Last.fm only has its placeholder
  url: string;
  nowPlaying: boolean;
  uts: number | null;
}

export interface TopArtist {
  name: string;
  playcount: number;
  url: string;
}

export interface RecentTracks {
  tracks: Track[];
  total: number;
}

export interface TopArtists {
  artists: TopArtist[];
}
export interface TrackLength {
  seconds: number;
}

export interface VideoMatch {
  id: string | null;
  title?: string;
  channel?: string;
}
