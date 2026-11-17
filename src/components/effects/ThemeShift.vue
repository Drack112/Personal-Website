<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { shifting } from '@/composables/useTheme'
import { themes } from '@/data/themes'

const canvas = ref<HTMLCanvasElement>()
let tint = themes.original.noise
let raf = 0

watch(shifting, (next) => {
  if (next) tint = themes[next].noise
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
      <i class="band" />
    </div>
  </Transition>
</template>

<style scoped>
.shift {
  position: fixed;
  inset: 0;
  z-index: 75;
  overflow: hidden;
  pointer-events: none;
}

.noise {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  opacity: 0.2;
  mix-blend-mode: screen;
  animation: tear 0.12s steps(2) infinite;
}

.band {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 16vh;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.16), transparent);
  animation: sweep 0.7s ease-in both;
}

.shift-enter-active,
.shift-leave-active {
  transition: opacity 0.15s ease;
}

.shift-enter-from,
.shift-leave-to {
  opacity: 0;
}

@keyframes tear {
  50% {
    transform: translateX(-1%);
  }
}

@keyframes sweep {
  from {
    transform: translateY(-16vh);
  }

  to {
    transform: translateY(100vh);
  }
}
</style>
