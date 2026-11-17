import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useClock } from '@/composables/useClock'
import { useLastfm, type Track } from '@/composables/useLastfm'
import { songKey, usePreview, type PreviewStatus } from '@/composables/usePreview'
import { addRequest, findVideo, youtubeSearchUrl } from '@/composables/useRequests'
import { sfx } from '@/composables/useSound'

import type { Key } from '../art/walkmanArt'
import { ago } from '../format'

const PREVIEW_STATUS: Record<PreviewStatus, string> = {
  idle: '',
  loading: 'LOOKING FOR A PREVIEW',
  playing: 'PLAYING A 30 SECOND PREVIEW',
  paused: 'PREVIEW PAUSED',
  ended: 'PREVIEW ENDED',
  missing: 'NO PREVIEW FOR THIS ONE',
}

const PREVIEW_LCD: Record<PreviewStatus, string> = {
  idle: '',
  loading: 'SEARCH',
  playing: '> PLAY',
  paused: 'PAUSE',
  ended: 'END',
  missing: 'NO PREV',
}

const SHUTTLE_MS = 520
const TAP_MS = 180

export function useDeck() {
  const lastfm = useLastfm()
  const preview = usePreview()
  const router = useRouter()
  const now = useClock()

  const view = ref(0)
  const stopped = ref(false)
  const sending = ref(false)
  const tapped = ref<Key | null>(null)
  const shuttle = ref(0)
  let tapTimer = 0

  const pv = preview.status
  const tracks = computed(() => lastfm.tracks.value)
  const shown = computed<Track | null>(() => tracks.value[view.value] ?? null)
  const live = computed(() => view.value === 0 && Boolean(tracks.value[0]?.nowPlaying))
  const previewing = computed(() => Boolean(shown.value) && preview.key.value === songKey(shown.value!))
  const offline = computed(() => lastfm.status.value === 'offline')
  const playingKey = computed(() => (pv.value === 'playing' ? preview.key.value : null))

  const liveLength = computed(() => (view.value === 0 ? lastfm.position.value.length : 0))
  const liveElapsed = computed(() => {
    const p = lastfm.position.value
    if (view.value !== 0) return 0
    if (!live.value) return p.elapsed
    const t = p.elapsed + (stopped.value ? 0 : Math.floor((now.value.getTime() - p.at) / 1000))
    return p.length ? Math.min(t, p.length) : t
  })

  const length = computed(() => (previewing.value ? Math.round(preview.duration.value) : liveLength.value))
  const elapsed = computed(() => (previewing.value ? Math.floor(preview.time.value) : liveElapsed.value))
  const running = computed(() =>
    previewing.value
      ? pv.value === 'playing'
      : live.value && !stopped.value && (!liveLength.value || liveElapsed.value < liveLength.value),
  )
  const progress = computed(() => (length.value ? elapsed.value / length.value : view.value === 0 ? 0.35 : 0.5))
  const down = computed<Key | null>(() => tapped.value ?? (running.value ? 'play' : null))

  const status = computed(() => {
    if (!shown.value) return 'BLANK TAPE'
    if (sending.value) return 'SENDING TO THE TV'
    if (previewing.value) return PREVIEW_STATUS[pv.value]
    if (view.value > 0) return `TRACK ${String(view.value + 1).padStart(2, '0')} · ${ago(shown.value.uts)} AGO`
    if (live.value) return stopped.value ? 'PAUSED' : 'NOW PLAYING'
    return 'LAST PLAYED'
  })

  const lcd = computed(() => {
    if (shuttle.value) return shuttle.value < 0 ? 'REW <<' : 'FF >>'
    if (!shown.value) return offline.value ? 'NO TAPE' : 'LOADING'
    if (sending.value) return 'TO TV'
    if (previewing.value) return PREVIEW_LCD[pv.value]
    if (view.value > 0) return `TR${String(view.value + 1).padStart(2, '0')} ${ago(shown.value.uts)}`
    if (live.value) return stopped.value ? 'PAUSE' : '> PLAY'
    return 'LAST'
  })

  const coverUrl = computed(() => shown.value?.image || (previewing.value ? preview.artwork.value : ''))

  watch(pv, (s) => {
    if (s === 'ended' && previewing.value && view.value < tracks.value.length - 1) pick(view.value + 1)
  })

  watch(tracks, (list) => {
    if (!preview.key.value) return
    const i = list.findIndex((t) => songKey(t) === preview.key.value)
    if (i >= 0) view.value = i
  })

  function shuttleFx(dir: number) {
    shuttle.value = dir
    window.clearTimeout(tapTimer)
    tapTimer = window.setTimeout(() => {
      tapped.value = null
      shuttle.value = 0
    }, SHUTTLE_MS)
  }

  function press(key: Key) {
    sfx.tape()
    const wasPlaying = previewing.value && (pv.value === 'playing' || pv.value === 'loading')
    tapped.value = key
    if (key === 'rew' || key === 'ff') shuttleFx(key === 'rew' ? -1 : 1)
    else {
      shuttle.value = 0
      window.clearTimeout(tapTimer)
      tapTimer = window.setTimeout(() => (tapped.value = null), TAP_MS)
    }

    if (key === 'play') {
      stopped.value = false
      if (shown.value) void preview.play(shown.value)
    } else if (key === 'stop') {
      if (wasPlaying) preview.pause()
      else stopped.value = !stopped.value
    } else {
      view.value = key === 'ff' ? Math.max(0, view.value - 1) : Math.min(tracks.value.length - 1, view.value + 1)
      if (wasPlaying && shown.value) void preview.play(shown.value)
    }
  }

  function pick(i: number) {
    sfx.tape()
    shuttleFx(i < view.value ? 1 : -1)
    view.value = i
    if (shown.value) void preview.play(shown.value)
  }

  async function fullSong() {
    const t = shown.value
    if (!t || sending.value) return
    preview.pause()
    sending.value = true
    const id = await findVideo(t)
    sending.value = false
    if (!id) {
      window.open(youtubeSearchUrl(t), '_blank', 'noopener')
      return
    }
    addRequest({ id, name: t.name, artist: t.artist })
    void router.push('/video/requests?play=1')
  }

  onMounted(lastfm.start)
  onBeforeUnmount(() => {
    lastfm.stop()
    preview.stop()
    window.clearTimeout(tapTimer)
  })

  return {
    tracks,
    view,
    shown,
    previewing,
    pv,
    offline,
    playingKey,
    elapsed,
    running,
    progress,
    down,
    shuttle,
    status,
    lcd,
    sending,
    coverUrl,
    press,
    pick,
    fullSong,
  }
}
