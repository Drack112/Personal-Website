/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_LASTFM_API_KEY?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_YOUTUBE_API_KEY?: string;
}
