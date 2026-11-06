<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CrtScreen from './CrtScreen.vue'
import PixelCanvas from '@/components/pixel/PixelCanvas.vue'
import BevelButton from '@/components/ui/BevelButton.vue'
import { CH_DOWN, CH_UP, DIAL, H, POWER, SCREEN, W, drawTv } from './tvArt'
import { place } from '@/lib/pixel'
import type { Pixels } from '@/lib/pixel'
import { nf } from '@/data/icons'
import { embedUrl } from '@/data/tokusato'
import { sfx } from '@/composables/useSound'
import { useClock } from '@/composables/useClock'

// fill: the video is a 4:3 picture with black bars inside a 16:9 frame; zoom it
// so the picture itself fills the 4:3 tube
export type ScreenItem =
  | { kind: 'youtube'; key: string; id: string; ep: number; playlistId: string; title: string; label: string; fill?: boolean }
  | { kind: 'image'; key: string; url: string; title: string; label: string }

const props = defineProps<{ item: ScreenItem }>()
const emit = defineEmits<{ step: [number] }>()

const on = ref(false)
const powering = ref(false)
const tuning = ref(false)
const osd = ref(true)
const pressed = ref<'up' | 'down' | 'power' | null>(null)
const now = useClock()
let osdTimer = 0
let tuneTimer = 0
let pressTimer = 0
let powerTimer = 0

const src = computed(() => {
  const it = props.item
  if (it.kind !== 'youtube') return it.url
  // enablejsapi lets the player report its running time to the VCR display
  return `${embedUrl({ id: it.id, ep: it.ep, title: it.title }, it.playlistId, true)}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`
})
const fill = computed(() => props.item.kind === 'youtube' && Boolean(props.item.fill))
const showNoise = computed(() => !on.value || tuning.value)
// "EP 07" -> "07"; anything without a number is the AV input
const channel = computed(() => props.item.label.match(/\d+/)?.[0].padStart(2, '0').slice(-2) ?? 'AU')
// the tuner knob sits on the episode's notch: EP01 -> EP02 turns it up, back to EP01 turns it down
const dial = computed(() => Math.max(0, (Number(channel.value) || 1) - 1))

// the screen sits 1 art pixel under the bezel on each side, so no seam shows
const screenBox = place({ x: SCREEN.x - 1, y: SCREEN.y - 1, w: SCREEN.w + 2, h: SCREEN.h + 2 }, W, H)
const spot = (r: typeof SCREEN) => place(r, W, H)

// --- running time reported by the YouTube player -------------------------
const frame = ref<HTMLIFrameElement>()
const playTime = ref<number | null>(null)
const playing = ref(false)
let listenTimer = 0

// ask the player to send its state; repeated until it answers, as it may not be ready on load
function listen() {
  window.clearInterval(listenTimer)
  let tries = 0
  const hello = () => {
    frame.value?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: props.item.key, channel: 'widget' }), '*')
    if (++tries > 20) window.clearInterval(listenTimer)
  }
  hello()
  listenTimer = window.setInterval(hello, 500)
}

function onPlayerMessage(e: MessageEvent) {
  if (!frame.value || e.source !== frame.value.contentWindow || typeof e.data !== 'string') return
  let msg: { event?: string; info?: { currentTime?: number; playerState?: number } | number }
  try {
    msg = JSON.parse(e.data)
  } catch {
    return
  }
  window.clearInterval(listenTimer)
  const info = msg.info
  if (msg.event !== 'infoDelivery' && msg.event !== 'initialDelivery') return
  if (typeof info !== 'object' || !info) return
  // playerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
  if (info.playerState !== undefined) playing.value = info.playerState === 1
  if (info.currentTime !== undefined && (info.currentTime > 0 || playing.value)) playTime.value = info.currentTime
  if (info.playerState === 0 || info.playerState === 5) playTime.value = null
}

function resetPlayer() {
  window.clearInterval(listenTimer)
  playTime.value = null
  playing.value = false
}

function draw(p: Pixels, t: number) {
  drawTv(p, t, {
    on: on.value,
    powering: powering.value,
    switching: tuning.value,
    channel: channel.value,
    dial: dial.value,
    pressed: pressed.value,
    playTime: playTime.value,
    playing: playing.value,
    now: now.value,
  })
}

function press(key: 'up' | 'down' | 'power') {
  pressed.value = key
  window.clearTimeout(pressTimer)
  pressTimer = window.setTimeout(() => (pressed.value = null), 160)
}

function showOsd() {
  osd.value = true
  window.clearTimeout(osdTimer)
  osdTimer = window.setTimeout(() => (osd.value = false), 2500)
}

// the channel-change effect: static that tears and rolls, then the picture locks in
function tune(ms = 650) {
  tuning.value = true
  window.clearTimeout(tuneTimer)
  tuneTimer = window.setTimeout(() => (tuning.value = false), ms)
}

function power() {
  press('power')
  if (on.value || powering.value) {
    window.clearTimeout(powerTimer)
    on.value = false
    powering.value = false
    tuning.value = false
    resetPlayer()
    sfx.close()
    return
  }
  sfx.channel()
  powering.value = true
  powerTimer = window.setTimeout(() => {
    powering.value = false
    on.value = true
    tune(420)
    showOsd()
  }, 380)
}

// switch on without toggling (no-op when already on)
function turnOn() {
  if (!on.value && !powering.value) power()
}

function step(delta: number) {
  press(delta > 0 ? 'up' : 'down')
  emit('step', delta)
}

// scrolling on the knob: up is the next episode, down the previous one, one notch at a time
let wheelAt = 0
function onWheel(e: WheelEvent) {
  if (!e.deltaY || e.timeStamp - wheelAt < 250) return
  wheelAt = e.timeStamp
  step(e.deltaY < 0 ? 1 : -1)
}

watch(
  () => props.item.key,
  () => {
    resetPlayer()
    showOsd()
    if (!on.value) return
    sfx.channel()
    tune()
  },
)
onMounted(() => window.addEventListener('message', onPlayerMessage))
onBeforeUnmount(() => {
  window.removeEventListener('message', onPlayerMessage)
  window.clearTimeout(osdTimer)
  window.clearTimeout(tuneTimer)
  window.clearTimeout(pressTimer)
  window.clearTimeout(powerTimer)
  window.clearInterval(listenTimer)
})
defineExpose({ tune: step, power, turnOn })
</script>

<template>
  <div class="crt-wrap">
  <div class="crt-tv" :style="{ '--ratio': `${W} / ${H}` }">
    <CrtScreen class="tube" :style="screenBox" :noise="showNoise" :powering="powering" :tuning="tuning">
      <template v-if="on">
        <iframe v-if="item.kind === 'youtube'" ref="frame" :key="item.key" class="picture" :class="{ fill }" :src="src"
          :title="item.title"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen referrerpolicy="strict-origin-when-cross-origin" @load="listen" />
        <img v-else :key="item.key" :src="src" :alt="item.title" class="picture clip" draggable="false" />
      </template>
      <button v-if="!on" type="button" class="power-big" @click="power">
        <span class="nf">{{ nf.play }}</span>
        <span class="pixel">POWER ON</span>
      </button>
      <span v-show="osd || !on" class="osd pixel">{{ item.label }}</span>
      <span v-show="osd && on" class="osd-title">{{ item.title }}</span>
    </CrtScreen>

    <PixelCanvas class="art" :width="W" :height="H" :draw="draw" :fps="15" />

    <button type="button" class="spot round" :style="spot(DIAL)" aria-label="Next channel"
      title="CH ▲ (scroll to tune)" @click="step(1)" @wheel.prevent="onWheel" />
    <button type="button" class="spot" :style="spot(CH_DOWN)" aria-label="Previous" title="CH ▼" @click="step(-1)" />
    <button type="button" class="spot" :style="spot(CH_UP)" aria-label="Next" title="CH ▲" @click="step(1)" />
    <button type="button" class="spot" :style="spot(POWER)" :aria-pressed="on" aria-label="Power" title="Power"
      @click="power" />
  </div>

  <!-- phones: the drawn knobs are too small to tap, so a remote sits under the set -->
  <div class="remote" aria-label="Remote control">
    <BevelButton small silent :icon="nf.prev" aria-label="Previous" @click="step(-1)">CH</BevelButton>
    <BevelButton small silent variant="orange" :pressed="on" :icon="nf.play" @click="power">
      {{ on ? 'OFF' : 'ON' }}
    </BevelButton>
    <BevelButton small silent :icon="nf.next" aria-label="Next" @click="step(1)">CH</BevelButton>
  </div>
  </div>
</template>

<style scoped>
.remote {
  display: none;
  justify-content: center;
  gap: 0.9rem;
  margin-top: 1rem;
}

.crt-tv {
  position: relative;
  container-type: inline-size;
  aspect-ratio: var(--ratio);
  width: 100%;
  filter: drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.35));
}

.crt-tv .tube {
  position: absolute;
  aspect-ratio: auto;
  border-radius: 0;
  box-shadow: none;
}

.art {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

/* invisible hit areas over the drawn buttons */
.spot {
  position: absolute;
  z-index: 5;
  padding: 0;
  border: 0;
  background: transparent;
}

.spot.round {
  border-radius: 50%;
}

.spot:hover {
  background: rgba(254, 242, 116, 0.1);
}

/* the picture fills the screen, under the glass */
.picture {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

/* a 16:9 frame 4/3 wider than the tube puts its 4:3 picture exactly on the glass */
.picture.fill {
  left: -16.667%;
  width: 133.333%;
}

.clip {
  object-fit: cover;
}

/* on-screen controls and text sit over the glass (CrtScreen layers are z-index 2) */
.power-big {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.4rem;
  border: 0;
  color: var(--ink);
  background: var(--gold);
  white-space: nowrap;
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 #fffbc4,
    inset -3px -3px 0 var(--orange),
    6px 6px 0 3px rgba(0, 0, 0, 0.45);
}

.power-big .nf {
  font-size: 1.4rem;
}

.power-big .pixel {
  font-size: 0.75rem;
}

.osd {
  position: absolute;
  top: 8%;
  right: 8%;
  z-index: 3;
  font-size: clamp(0.6rem, 2.4cqw, 1.3rem);
  color: var(--lime);
  text-shadow:
    2px 2px 0 #000,
    0 0 8px var(--lime);
  pointer-events: none;
}

.osd-title {
  position: absolute;
  left: 7%;
  bottom: 10%;
  z-index: 3;
  width: fit-content;
  max-width: 86%;
  padding: 0.2rem 0.5rem;
  font-size: clamp(0.65rem, 1.6cqw, 1rem);
  font-weight: 700;
  color: var(--lime);
  background: rgba(0, 0, 0, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

@media (max-width: 720px) {
  .remote {
    display: flex;
  }

  .power-big {
    padding: 0.6rem 0.9rem;
    gap: 0.5rem;
  }

  .power-big .nf {
    font-size: 1rem;
  }

  .power-big .pixel {
    font-size: 0.55rem;
  }
}
</style>
