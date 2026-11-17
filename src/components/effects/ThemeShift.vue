<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { shifting } from '@/composables/useTheme'
import { themes } from '@/data/themes'

const canvas = ref<HTMLCanvasElement>()
const label = ref('')
let tint = themes.original.noise
let raf = 0

watch(shifting, (next) => {
  if (!next) return
  label.value = themes[next].label
  tint = themes[next].noise
})

watch(canvas, (c) => {
  cancelAnimationFrame(raf)
  if (c) raf = requestAnimationFrame(paint)
})

function paint() {
  const c = canvas.value
  if (!c) return
  const g = c.getContext('2d')!
  const img = g.createImageData(c.width, c.height)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 210
    img.data[i] = v * tint[0]
    img.data[i + 1] = v * tint[1]
    img.data[i + 2] = v * tint[2]
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  raf = requestAnimationFrame(paint)
}

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <Transition name="shift">
    <div v-if="shifting" class="shift" aria-hidden="true">
      <canvas ref="canvas" width="192" height="108" class="noise" />
      <div class="bands"><i /><i /><i /></div>
      <div class="card">
        <span class="small pixel">LOADING THEME</span>
        <span class="name pixel">{{ label }}</span>
        <span class="bar"><i /></span>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="css">
.shift {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: none;
  background: #000;
}

.noise {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  opacity: 0.9;
  animation: tear 0.12s steps(2) infinite;
}

.bands i {
  position: absolute;
  left: 0;
  right: 0;
  height: 14vh;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.28), transparent);
  animation: roll 0.7s linear infinite;
}

.bands i:nth-child(2) {
  animation-delay: -0.25s;
  height: 6vh;
}

.bands i:nth-child(3) {
  animation-delay: -0.5s;
  height: 22vh;
  opacity: 0.6;
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 1.3rem 1.8rem 1.4rem;
  color: var(--gold);
  background: var(--ink);
  box-shadow:
    0 0 0 3px #000,
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo),
    8px 8px 0 3px rgba(0, 0, 0, 0.5);
  transition:
    color 0.2s steps(3),
    box-shadow 0.2s steps(3);
}

.small {
  font-size: 0.55rem;
  color: var(--muted);
}

.name {
  font-size: clamp(0.8rem, 2.6vw, 1.15rem);
  text-shadow: 2px 2px 0 #000;
  animation: flicker 0.2s steps(2) infinite;
}

.bar {
  width: min(220px, 60vw);
  height: 12px;
  padding: 2px;
  box-shadow: 0 0 0 2px var(--cream);
}

.bar i {
  display: block;
  height: 100%;
  background: var(--gold);
  animation: fill 1s steps(10) forwards;
}

.shift-enter-active {
  animation: open 0.25s steps(4);
}

.shift-leave-active {
  animation: open 0.35s steps(4) reverse;
}

@keyframes open {
  from {
    opacity: 0;
    clip-path: inset(50% 0);
  }

  to {
    opacity: 1;
    clip-path: inset(0);
  }
}

@keyframes tear {
  50% {
    transform: translateX(-1.5%) scaleY(1.02);
  }
}

@keyframes roll {
  from {
    transform: translateY(-30vh);
  }

  to {
    transform: translateY(110vh);
  }
}

@keyframes flicker {
  50% {
    opacity: 0.75;
  }
}

@keyframes fill {
  from {
    width: 0;
  }

  to {
    width: 100%;
  }
}
</style>
