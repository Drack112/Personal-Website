import { useStorage } from '@vueuse/core'

import { songKey, type Song } from '@/composables/usePreview'
import { api } from '@/lib/api'

import type { VideoMatch } from '../../shared/api'

export interface SongRequest {
  id: string
  name: string
  artist: string
}

export const requests = useStorage<SongRequest[]>('lk.requests', [], sessionStorage)

const found = new Map<string, string | null>()

const query = (s: Song) => `${s.artist.replace(/\(.*?\)|\[.*?\]/g, '').trim()} ${s.name}`

export async function findVideo(song: Song): Promise<string | null> {
  const k = songKey(song)
  if (found.has(k)) return found.get(k)!
  const q = query(song)
  let id: string | null = null
  try {
    id = (await api<VideoMatch>('youtube', { q })).id
  } catch {
    id = null
  }
  if (id) found.set(k, id)
  return id
}

export const youtubeSearchUrl = (song: Song) =>
  `https://www.youtube.com/results?${new URLSearchParams({ search_query: query(song) })}`

export function addRequest(r: SongRequest) {
  requests.value = [r, ...requests.value.filter((x) => x.id !== r.id)].slice(0, 12)
}
