<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import PixelCanvas from '@/components/pixel/PixelCanvas.vue'
import BevelButton from '@/components/ui/BevelButton.vue'
import { LAYOUTS, drawWalkman, type Key } from './walkmanArt'
import { place, type Pixels } from '@/lib/pixel'
import { nf } from '@/data/icons'
import { profile } from '@/data/profile'
import { sfx } from '@/composables/useSound'
import { useLastfm, type Track } from '@/composables/useLastfm'
import { songKey, usePreview } from '@/composables/usePreview'
import { addRequest, findVideo, youtubeSearchUrl } from '@/composables/useRequests'

const lastfm = useLastfm()
const preview = usePreview()
const router = useRouter()
onMounted(lastfm.start)
onBeforeUnmount(() => {
  lastfm.stop()
  preview.stop()
})

const now = useClock()
const view = ref(0) // index into recent tracks shown on the label
const stopped = ref(false)

const tracks = computed(() => lastfm.tracks.value)
const shown = computed<Track | null>(() => tracks.value[view.value] ?? null)
const live = computed(() => view.value === 0 && Boolean(tracks.value[0]?.nowPlaying))

// the track on the label is the one loaded in the preview player
const previewing = computed(() => Boolean(shown.value) && preview.key.value === songKey(shown.value!))
const pv = preview.status

// without a preview the deck mirrors Last.fm: the live track's estimated position
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

const mmss = (s: number) => `${String(Math.floor(s / 60) % 100).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const ago = (uts: number | null) => {
  if (!uts) return 'now'
  const m = Math.max(1, Math.round((Date.now() / 1000 - uts) / 60))
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.round(m / 60)}h`
  return `${Math.round(m / 1440)}d`
}

const sending = ref(false)

const status = computed(() => {
  if (!shown.value) return 'BLANK TAPE'
  if (sending.value) return 'SENDING TO THE TV'
  if (previewing.value) {
    return {
      idle: '',
      loading: 'LOOKING FOR A PREVIEW',
      playing: 'PLAYING A 30 SECOND PREVIEW',
      paused: 'PREVIEW PAUSED',
      ended: 'PREVIEW ENDED',
      missing: 'NO PREVIEW FOR THIS ONE',
    }[pv.value]
  }
  if (view.value > 0) return `TRACK ${String(view.value + 1).padStart(2, '0')} · ${ago(shown.value.uts)} AGO`
  if (live.value) return stopped.value ? 'PAUSED' : 'NOW PLAYING'
  return 'LAST PLAYED'
})
// PLAY latches down while the tape runs; the others spring back
const tapped = ref<Key | null>(null)
const shuttle = ref(0)
let tapTimer = 0
const down = computed<Key | null>(() => tapped.value ?? (running.value ? 'play' : null))

// the same, short enough for the 8-character LCD
const lcd = computed(() => {
  if (shuttle.value) return shuttle.value < 0 ? 'REW <<' : 'FF >>'
  if (!shown.value) return lastfm.status.value === 'offline' ? 'NO TAPE' : 'LOADING'
  if (sending.value) return 'TO TV'
  if (previewing.value) {
    return { idle: '', loading: 'SEARCH', playing: '> PLAY', paused: 'PAUSE', ended: 'END', missing: 'NO PREV' }[pv.value]
  }
  if (view.value > 0) return `TR${String(view.value + 1).padStart(2, '0')} ${ago(shown.value.uts)}`
  if (live.value) return stopped.value ? 'PAUSE' : '> PLAY'
  return 'LAST'
})

function shuttleFx(dir: number) {
  shuttle.value = dir
  window.clearTimeout(tapTimer)
  tapTimer = window.setTimeout(() => {
    tapped.value = null
    shuttle.value = 0
  }, 520)
}

function press(key: Key) {
  sfx.tape()
  const wasPlaying = previewing.value && (pv.value === 'playing' || pv.value === 'loading')
  tapped.value = key
  if (key === 'rew' || key === 'ff') shuttleFx(key === 'rew' ? -1 : 1)
  else {
    shuttle.value = 0
    window.clearTimeout(tapTimer)
    tapTimer = window.setTimeout(() => (tapped.value = null), 180)
  }

  if (key === 'play') {
    stopped.value = false
    if (shown.value) void preview.play(shown.value)
  } else if (key === 'stop') {
    if (wasPlaying) preview.pause()
    else stopped.value = !stopped.value
  } else {
    view.value = key === 'ff' ? Math.max(0, view.value - 1) : Math.min(tracks.value.length - 1, view.value + 1)
    // skipping while the tape runs plays the next song, like a real deck
    if (wasPlaying && shown.value) void preview.play(shown.value)
  }
}

function pick(i: number) {
  sfx.tape()
  shuttleFx(i < view.value ? 1 : -1)
  view.value = i
  if (shown.value) void preview.play(shown.value)
}

// a finished preview rolls on to the next (older) song on the J-card
watch(pv, (s) => {
  if (s === 'ended' && previewing.value && view.value < tracks.value.length - 1) pick(view.value + 1)
})
// new scrobbles shift the list; keep the label on the song that is playing
watch(tracks, (list) => {
  if (!preview.key.value) return
  const i = list.findIndex((t) => songKey(t) === preview.key.value)
  if (i >= 0) view.value = i
})
onBeforeUnmount(() => window.clearTimeout(tapTimer))

// the whole song: looked up on YouTube and put on the TV, or a YouTube search when that fails
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

// headphones beside the walkman, or stacked above it on narrow screens
const narrow = useMediaQuery('(max-width: 600px)')
const L = computed(() => (narrow.value ? LAYOUTS.stacked : LAYOUTS.wide))

function draw(p: Pixels, t: number) {
  drawWalkman(p, t, {
    running: running.value,
    progress: progress.value,
    down: down.value,
    shuttle: shuttle.value,
    elapsed: mmss(elapsed.value),
    status: lcd.value,
    loaded: Boolean(shown.value),
  }, L.value)
}

// album art squeezed down to a few pixels and blown back up, like the rest of the art;
// Last.fm's cover, or the iTunes one when Last.fm has none
const coverUrl = computed(() => shown.value?.image || (previewing.value ? preview.artwork.value : ''))
const cover = ref<HTMLCanvasElement>()
const COVER_PX = 24
watch(
  [coverUrl, cover],
  ([url, c]) => {
    const g = c?.getContext('2d')
    if (!c || !g) return
    g.clearRect(0, 0, COVER_PX, COVER_PX)
    if (!url) return
    const img = new Image()
    img.onload = () => {
      if (coverUrl.value !== url) return
      g.imageSmoothingEnabled = true
      g.drawImage(img, 0, 0, COVER_PX, COVER_PX)
    }
    img.src = url
  },
  { immediate: true },
)

const spot = (r: { x: number; y: number; w: number; h: number }) => place(r, L.value.W, L.value.H)
// CJK and other full-width characters take about two latin ones on the label
const textWidth = (s: string) => [...s].reduce((n, ch) => n + (ch.codePointAt(0)! >= 0x2e80 ? 2 : 1), 0)
const labels: Record<Key, string> = {
  rew: 'Rewind: older track',
  play: 'Play a 30-second preview',
  ff: 'Fast forward: newer track',
  stop: 'Pause',
}
</script>

<template>
  <div class="walkman-wrap">
    <div class="deck">
    <div class="walkman" :class="{ narrow }" :style="{ aspectRatio: `${L.W} / ${L.H}` }">
      <!-- keyed: a new layout needs a canvas of the new size -->
      <PixelCanvas :key="narrow ? 'stacked' : 'wide'" class="art" :width="L.W" :height="L.H" :draw="draw" :fps="15" />

      <div class="label" :style="spot(L.label)">
        <div class="cover">
          <canvas v-show="coverUrl" ref="cover" :width="COVER_PX" :height="COVER_PX"
            :aria-label="shown?.album || shown?.name" role="img" />
          <span v-if="!coverUrl" class="nf">{{ nf.music }}</span>
        </div>
        <div class="info">
          <a v-if="shown" :href="shown.url" target="_blank" rel="noopener" class="title" :title="shown.name">
            <span :class="{ marquee: textWidth(shown.name) > 18 }">{{ shown.name }}</span>
          </a>
          <span v-else class="title">insert cookie...</span>
          <span class="artist">{{ shown ? shown.artist : lastfm.status.value === 'offline' ? 'last.fm offline' :
            'loading tape' }}</span>
        </div>
      </div>

      <button v-for="k in L.keys" :key="k.id" type="button" class="key" :style="spot(k)" :aria-label="labels[k.id]"
        :aria-pressed="k.id === 'play' ? down === 'play' : undefined" @click="press(k.id)" />

      <p class="sr-only" aria-live="polite">{{ status }}<template v-if="shown">: {{ shown.name }} by {{ shown.artist
      }}</template></p>
    </div>

    <div class="actions">
      <p class="hint">
        <template v-if="previewing && pv === 'missing'">no preview for this one, try the full song</template>
        <template v-else>pick a song on the J-card for a 30s preview</template>
      </p>
      <BevelButton variant="orange" small :icon="nf.tv" :disabled="!shown || sending" @click="fullSong">
        {{ sending ? 'TUNING...' : 'FULL SONG ON THE TV' }}
      </BevelButton>
    </div>
    </div>

    <aside class="jcard">
      <header>SIDE A · recent mix</header>
      <ol v-if="tracks.length">
        <li v-for="(t, i) in tracks.slice(0, 8)" :key="`${t.name}-${i}`" :class="{ active: i === view }">
          <button type="button" @click="pick(i)">
            <span class="t">{{ t.name }}</span>
            <span class="a">{{ t.artist }}</span>
          </button>
          <span class="when">{{ preview.key.value === songKey(t) && pv === 'playing' ? '♪' : t.nowPlaying ? '▶' :
            ago(t.uts) }}</span>
        </li>
      </ol>
      <p v-else class="empty">nothing recorded yet...</p>
      <a class="sign" :href="profile.links.lastfm" target="_blank" rel="noopener">♥ drack112 on last.fm</a>
    </aside>
  </div>
</template>

<style scoped>
.walkman-wrap {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.deck {
  width: min(100%, 760px);
  display: grid;
  gap: 1rem;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
}

.walkman {
  position: relative;
  container-type: inline-size;
  width: 100%;
}

.art {
  position: absolute;
  inset: 0;
}

/* track info written on the cassette label */
.label {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 3%;
  container-type: size;
  color: #2b2a55;
  font-family: var(--font-hand);
  line-height: 1.1;
}

.cover {
  flex: none;
  height: 100%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background: var(--green);
  color: var(--gold);
  font-size: 50cqh;
  box-shadow: 0 0 0 2px var(--ink);
}

.cover canvas {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4cqh;
}

.title {
  font-size: 34cqh;
  font-weight: 700;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
}

a.title:hover {
  color: var(--orange-lo);
}

.marquee {
  display: inline-block;
  padding-left: 100%;
  animation: marquee 12s linear infinite;
}

.artist {
  font-size: 25cqh;
  font-weight: 700;
  color: var(--orange-lo);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* invisible hit areas over the drawn keys */
.key {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
}

.key:hover {
  background: rgba(254, 242, 116, 0.12);
}

.jcard {
  width: min(100%, 250px);
  padding: 0 0 12px;
  background: #f6efd9;
  color: #2b2a55;
  font-family: var(--font-hand);
  box-shadow:
    0 0 0 2px #d9cdaa,
    6px 6px 0 rgba(0, 0, 0, 0.3);
  transform: rotate(1.5deg);
}

.jcard header {
  padding: 8px 12px;
  background: var(--orange);
  color: #f6efd9;
  font-weight: 700;
}

.jcard ol {
  list-style: none;
  margin: 0;
  padding: 6px 10px 0;
}

.jcard li {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  border-bottom: 1px solid #d9cdaa;
  padding: 4px 0;
}

.jcard li.active {
  background: rgba(203, 110, 27, 0.15);
}

.jcard button {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 0;
  padding: 0;
  background: none;
  text-align: left;
  font-family: var(--font-hand);
  color: inherit;
}

.jcard .t {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.jcard .a {
  font-size: 0.75rem;
  color: #6a6488;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.when {
  font-size: 0.75rem;
  color: var(--orange);
  font-weight: 700;
}

.empty {
  padding: 12px;
}

.sign {
  display: block;
  margin: 10px 12px 0;
  text-align: right;
  color: var(--orange);
  font-size: 0.8rem;
  text-decoration: none;
}

@media (max-width: 600px) {
  .walkman.narrow {
    max-width: 420px;
    margin: 0 auto;
  }

  .actions {
    justify-content: center;
    text-align: center;
  }

  .jcard {
    width: min(100%, 420px);
    transform: rotate(0.6deg);
  }

  /* bigger rows for fingers */
  .jcard li {
    padding: 7px 0;
  }
}

@keyframes marquee {
  to {
    transform: translateX(-100%);
  }
}
</style>
