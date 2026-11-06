<script setup lang="ts">
// Y2K cursor trail: little △ ○ ✕ □ ✦ sparks that fall and fade behind the
// pointer. Only on devices with a real mouse, and only when motion is on.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { settings } from '@/composables/useSettings'

interface Spark {
  id: number
  x: number
  y: number
  glyph: string
  color: string
  drift: number
}

const GLYPHS = ['△', '○', '✕', '□', '✦']
const COLORS = ['#A9DC88', '#CB6E1B', '#FEF274', '#5C8895', '#F3EBD3']
const sparks = ref<Spark[]>([])
let id = 0
let last = 0
const finePointer = window.matchMedia('(pointer: fine)').matches

function onMove(e: PointerEvent) {
  if (!finePointer || !settings.trail.value || !settings.motion.value) return
  const now = performance.now()
  if (now - last < 45) return
  last = now
  const spark: Spark = {
    id: id++,
    x: e.clientX,
    y: e.clientY,
    glyph: GLYPHS[id % GLYPHS.length]!,
    color: COLORS[id % COLORS.length]!,
    drift: Math.round((Math.random() - 0.5) * 30),
  }
  sparks.value = [...sparks.value.slice(-18), spark]
  window.setTimeout(() => {
    sparks.value = sparks.value.filter((s) => s.id !== spark.id)
  }, 700)
}

onMounted(() => window.addEventListener('pointermove', onMove, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('pointermove', onMove))
</script>

<template>
  <div class="trail" aria-hidden="true">
    <span
      v-for="s in sparks"
      :key="s.id"
      class="spark"
      :style="{ left: `${s.x + 14}px`, top: `${s.y + 16}px`, color: s.color, '--drift': `${s.drift}px` }"
      >{{ s.glyph }}</span
    >
  </div>
</template>

<style scoped>
.trail {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  overflow: hidden;
}
.spark {
  position: absolute;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  text-shadow: 1px 1px 0 var(--ink);
  animation: fall 0.7s linear forwards;
}
@keyframes fall {
  to {
    transform: translate(var(--drift), 26px) scale(0.4);
    opacity: 0;
  }
}
</style>
