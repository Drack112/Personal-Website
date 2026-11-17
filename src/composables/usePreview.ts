import { ref, watchEffect } from 'vue'
import axios from 'axios'

import { settings } from '@/composables/useSettings'

export interface Song {
  artist: string
  name: string
}

interface Hit {
  url: string
  artwork: string
}

interface ItunesSong {
  artistName: string
  trackName: string
  previewUrl?: string
  artworkUrl100?: string
}

export type PreviewStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'missing'

const STORES = ['BR', 'US', 'JP']

const cache = new Map<string, Hit | null>()
const key = ref<string | null>(null)
const status = ref<PreviewStatus>('idle')
const time = ref(0)
const duration = ref(30)
const artwork = ref('')
let audio: HTMLAudioElement | undefined

export const songKey = (s: Song) => `${s.artist}\u0000${s.name}`

const norm = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]|\s-\s.*$/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')

const close = (a: string, b: string) => {
  const x = norm(a)
  const y = norm(b)
  return Boolean(x && y) && (x.includes(y) || y.includes(x))
}

async function find(song: Song): Promise<Hit | null> {
  const k = songKey(song)
  if (cache.has(k)) return cache.get(k)!
  const bare = (t: string) => t.replace(/\(.*?\)|\[.*?\]/g, '').trim()
  const term = `${bare(song.artist)} ${bare(song.name)}`
  let hit: Hit | null = null
  for (const country of STORES) {
    try {
      const { data } = await axios.get<{ results: ItunesSong[] }>('https://itunes.apple.com/search', {
        params: { term, entity: 'song', limit: '10', country },
        timeout: 8000,
      })
      const { results } = data
      const m = results.find(
        (s) => s.previewUrl && close(s.trackName, song.name) && close(s.artistName, song.artist),
      )
      if (m) {
        hit = {
          url: m.previewUrl!,
          artwork: (m.artworkUrl100 ?? '').replace('100x100', '300x300'),
        }
        break
      }
    } catch {}
  }
  cache.set(k, hit)
  return hit
}

function player() {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'auto'
  audio.addEventListener('timeupdate', () => (time.value = audio!.currentTime))
  audio.addEventListener('loadedmetadata', () => (duration.value = audio!.duration || 30))
  audio.addEventListener('playing', () => (status.value = 'playing'))
  audio.addEventListener('pause', () => {
    if (!audio!.ended && status.value === 'playing') status.value = 'paused'
  })
  audio.addEventListener('ended', () => (status.value = 'ended'))
  audio.addEventListener('error', () => {
    if (key.value) status.value = 'missing'
  })
  watchEffect(() => {
    audio!.volume = settings.volume.value
    audio!.muted = !settings.sound.value
  })
  return audio
}

async function play(song: Song) {
  const a = player()
  const k = songKey(song)
  if (key.value === k && (status.value === 'paused' || status.value === 'ended')) {
    if (status.value === 'ended') a.currentTime = 0
    await a.play().catch(() => (status.value = 'paused'))
    return
  }
  if (key.value === k && (status.value === 'playing' || status.value === 'loading')) return

  a.pause()
  key.value = k
  status.value = 'loading'
  time.value = 0
  duration.value = 30
  artwork.value = ''
  const hit = await find(song)
  if (key.value !== k) return
  if (!hit) {
    status.value = 'missing'
    return
  }
  artwork.value = hit.artwork
  a.src = hit.url
  if (status.value !== 'loading') return
  await a.play().catch(() => (status.value = 'paused'))
}

function pause() {
  if (status.value === 'loading') status.value = 'paused'
  audio?.pause()
}

function stop() {
  audio?.pause()
  key.value = null
  status.value = 'idle'
  time.value = 0
}

export function usePreview() {
  return { key, status, time, duration, artwork, play, pause, stop }
}
