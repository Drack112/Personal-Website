<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import PixelCanvas from '@/components/pixel/PixelCanvas.vue'
import BevelButton from '@/components/ui/BevelButton.vue'
import { useClock } from '@/composables/useClock'
import { sfx } from '@/composables/useSound'
import { place, type Pixels } from '@/lib/pixel'
import { nf } from '@/data/icons'
import { embedUrl } from '@/data/tokusato'

import { CH_DOWN, CH_UP, DIAL, H, POWER, SCREEN, W, drawTv } from '../art/tvArt'
import { useYoutubePlayer, withPlayerApi } from '../composables/useYoutubePlayer'
import type { ScreenItem } from '../types'
import CrtScreen from './CrtScreen.vue'

type Key = 'up' | 'down' | 'power'

const BEZEL_OVERLAP = 1
const AV_CHANNEL = 'AU'

const props = defineProps<{ item: ScreenItem }>()
const emit = defineEmits<{ step: [number]; playing: [boolean]; power: [boolean] }>()

const now = useClock()
const frame = ref<HTMLIFrameElement>()
const { playTime, playing, listen, reset: resetPlayer } = useYoutubePlayer(frame, () => props.item.key)

const on = ref(false)
const powering = ref(false)
const tuning = ref(false)
const osd = ref(true)
const pressed = ref<Key | null>(null)

let osdTimer = 0
let tuneTimer = 0
let pressTimer = 0
let powerTimer = 0
let wheelAt = 0

const src = computed(() => {
  const it = props.item
  if (it.kind !== 'youtube') return it.url
  return withPlayerApi(embedUrl({ id: it.id, ep: it.ep, title: it.title }, it.playlistId, true))
})
const fill = computed(() => props.item.kind === 'youtube' && Boolean(props.item.fill))
const showNoise = computed(() => !on.value || tuning.value)
const channel = computed(() => props.item.label.match(/\d+/)?.[0].padStart(2, '0').slice(-2) ?? AV_CHANNEL)
const dial = computed(() => Math.max(0, (Number(channel.value) || 1) - 1))

const screenBox = place(
  {
    x: SCREEN.x - BEZEL_OVERLAP,
    y: SCREEN.y - BEZEL_OVERLAP,
    w: SCREEN.w + 2 * BEZEL_OVERLAP,
    h: SCREEN.h + 2 * BEZEL_OVERLAP,
  },
  W,
  H,
)
const spot = (r: typeof SCREEN) => place(r, W, H)

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
watch(playing, (v) => emit('playing', v))
watch(on, (v) => emit('power', v))

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

function press(key: Key) {
  pressed.value = key
  window.clearTimeout(pressTimer)
  pressTimer = window.setTimeout(() => (pressed.value = null), 160)
}

function showOsd() {
  osd.value = true
  window.clearTimeout(osdTimer)
  osdTimer = window.setTimeout(() => (osd.value = false), 2500)
}

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

function turnOn() {
  if (!on.value && !powering.value) power()
}

function step(delta: number) {
  press(delta > 0 ? 'up' : 'down')
  emit('step', delta)
}

function onWheel(e: WheelEvent) {
  if (!e.deltaY || e.timeStamp - wheelAt < 250) return
  wheelAt = e.timeStamp
  step(e.deltaY < 0 ? 1 : -1)
}

onBeforeUnmount(() => {
  window.clearTimeout(osdTimer)
  window.clearTimeout(tuneTimer)
  window.clearTimeout(pressTimer)
  window.clearTimeout(powerTimer)
})

defineExpose({ tune: step, power, turnOn })
</script>

<template>
  <div class="crt-wrap">
    <div class="crt-tv" :style="{ '--ratio': `${W} / ${H}` }">
      <CrtScreen class="tube" :style="screenBox" :noise="showNoise" :powering="powering" :tuning="tuning">
        <template v-if="on">
          <iframe v-if="item.kind === 'youtube'" ref="frame" :key="item.key" class="picture" :class="{ fill }"
            :src="src" :title="item.title"
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

    <div class="remote" aria-label="Remote control">
      <BevelButton small silent :icon="nf.prev" aria-label="Previous" @click="step(-1)">CH</BevelButton>
      <BevelButton small silent variant="orange" :pressed="on" :icon="nf.play" @click="power">
        {{ on ? 'OFF' : 'ON' }}
      </BevelButton>
      <BevelButton small silent :icon="nf.next" aria-label="Next" @click="step(1)">CH</BevelButton>
    </div>
  </div>
</template>

<style scoped lang="css">
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

.picture {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.picture.fill {
  left: -16.667%;
  width: 133.333%;
}

.clip {
  object-fit: cover;
}

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

.art {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

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
  background: color-mix(in srgb, var(--gold) 10%, transparent);
}

.remote {
  display: none;
  justify-content: center;
  gap: 0.9rem;
  margin-top: 1rem;
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
