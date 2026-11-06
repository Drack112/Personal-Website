<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import CrtScanlines from './CrtScanlines.vue'

// tuning: the picture rolls and tears while the set changes channel
const props = defineProps<{ noise?: boolean; powering?: boolean; tuning?: boolean }>()

const canvas = ref<HTMLCanvasElement>()
let raf = 0

// static: a small canvas of random grey pixels, redrawn every frame and scaled up
function drawNoise() {
  const c = canvas.value
  if (!c) return
  const g = c.getContext('2d')!
  const img = g.createImageData(c.width, c.height)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 200
    img.data[i] = v
    img.data[i + 1] = v * 1.05
    img.data[i + 2] = v * 1.1
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  raf = requestAnimationFrame(drawNoise)
}

watch(
  [canvas, () => props.noise],
  () => {
    cancelAnimationFrame(raf)
    if (canvas.value && props.noise) raf = requestAnimationFrame(drawNoise)
  },
  { immediate: true },
)
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="screen" :class="{ powering, tuning }">
    <slot />
    <canvas v-show="noise" ref="canvas" width="160" height="90" class="noise" />
    <div v-if="tuning" class="glass-layer tune-fx" aria-hidden="true"><i /><i /></div>
    <CrtScanlines class="glass-layer" :strength="0.22" roll />
    <div class="glass-layer mask" aria-hidden="true" />
    <div class="glass-layer glass" aria-hidden="true" />
  </div>
</template>

<style scoped>
.screen {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #050807;
  /* slightly bulged glass */
  border-radius: 26px / 34px;
  box-shadow:
    0 0 0 2px #000,
    0 0 40px rgba(169, 220, 136, 0.12) inset;
}

.screen.powering {
  animation: power-on 0.38s ease-out;
}

.noise {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  opacity: 0.85;
}

/* changing channel: the static tears sideways and bright bands roll down
   like a picture losing vertical hold */
.tuning .noise {
  opacity: 1;
  animation: tear 0.12s steps(2) infinite;
}

.tune-fx {
  overflow: hidden;
  animation: tune-flash 0.65s ease-out both;
}

.tune-fx i {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 18%;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.22) 30%, rgba(0, 0, 0, 0.75) 60%, transparent);
  animation: band 0.32s linear infinite;
}

.tune-fx i + i {
  height: 9%;
  animation-duration: 0.21s;
  animation-delay: -0.1s;
}

@keyframes tear {
  0% {
    transform: translateX(-3%) skewX(-4deg) scale(1.12);
  }

  100% {
    transform: translateX(3%) skewX(3deg) scale(1.12);
  }
}

@keyframes band {
  from {
    transform: translateY(-120%);
  }

  to {
    transform: translateY(620%);
  }
}

@keyframes tune-flash {
  0% {
    background: rgba(255, 255, 255, 0.35);
  }

  25% {
    background: rgba(0, 0, 0, 0.25);
  }

  100% {
    background: transparent;
  }
}

/* over the picture and the static; content that must stay on top (buttons,
   on-screen text) uses z-index 3 */
.glass-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.mask {
  /* faint RGB phosphor stripes */
  background: repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.035) 0 1px, rgba(0, 255, 0, 0.035) 1px 2px, rgba(0, 0, 255, 0.035) 2px 3px);
  mix-blend-mode: screen;
}

.glass {
  border-radius: inherit;
  background:
    radial-gradient(ellipse at 28% 18%, rgba(255, 255, 255, 0.14), transparent 40%),
    radial-gradient(ellipse at center, transparent 58%, rgba(0, 0, 0, 0.55) 100%);
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.6);
  animation: flicker 5s steps(2) infinite;
}

@keyframes power-on {
  0% {
    transform: scale(1, 0.01);
    filter: brightness(4);
  }

  60% {
    transform: scale(1, 0.05);
    filter: brightness(2);
  }

  100% {
    transform: none;
    filter: none;
  }
}

@keyframes flicker {

  0%,
  92% {
    opacity: 1;
  }

  96% {
    opacity: 0.85;
  }
}
</style>
