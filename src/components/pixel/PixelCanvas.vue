<script setup lang="ts">
// Shows a pixel-art scene: `draw` paints one frame into a low-res buffer, which
// the canvas scales up with hard edges. Frames run at a fixed retro rate and
// stop while the scene is off screen or the tab is hidden. With motion off the
// clock stands still, so only state changes (power, pressed keys...) show.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Pixels } from '@/lib/pixel'
import { settings } from '@/composables/useSettings'

const props = withDefaults(
  defineProps<{
    width: number
    height: number
    draw: (p: Pixels, t: number) => void
    fps?: number
  }>(),
  { fps: 12 },
)

const canvas = ref<HTMLCanvasElement>()
let pixels: Pixels | undefined
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let visible = true
let observer: IntersectionObserver | undefined

function paint(t: number) {
  if (!pixels || !ctx) return
  pixels.clear()
  props.draw(pixels, t)
  pixels.show(ctx)
}

function tick(now: number) {
  raf = requestAnimationFrame(tick)
  const still = !settings.motion.value
  if (now - last < 1000 / (still ? 4 : props.fps)) return
  last = now
  paint(still ? 0 : now / 1000)
}

function sync() {
  cancelAnimationFrame(raf)
  if (visible && !document.hidden) raf = requestAnimationFrame(tick)
}

onMounted(() => {
  pixels = new Pixels(props.width, props.height)
  ctx = canvas.value!.getContext('2d')
  observer = new IntersectionObserver(([e]) => {
    visible = Boolean(e?.isIntersecting)
    sync()
  })
  observer.observe(canvas.value!)
  document.addEventListener('visibilitychange', sync)
  sync()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  document.removeEventListener('visibilitychange', sync)
})
</script>

<template>
  <canvas ref="canvas" class="pixel-canvas" :width="width" :height="height" aria-hidden="true" />
</template>

<style scoped>
.pixel-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>
