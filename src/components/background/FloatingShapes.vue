<script setup lang="ts">
import { loop, pick, rand } from '@/lib/random'

import circle from '@/assets/shapes/circle.svg?raw'
import cross from '@/assets/shapes/cross.svg?raw'
import memphis from '@/assets/shapes/memphis.svg?raw'
import square from '@/assets/shapes/square.svg?raw'
import squiggle from '@/assets/shapes/squiggle.svg?raw'
import tri from '@/assets/shapes/tri.svg?raw'

const props = withDefaults(defineProps<{ count?: number }>(), { count: 20 })
const COLORS = ['#A9DC88', '#CB6E1B', '#FEF274', '#5C8895', '#F3EBD3']

const SHAPES: { svg: string; size: [number, number] }[] = [
  { svg: tri, size: [14, 38] },
  { svg: tri, size: [14, 38] },
  { svg: circle, size: [14, 38] },
  { svg: cross, size: [14, 38] },
  { svg: square, size: [14, 38] },
  { svg: memphis, size: [8, 18] },
  { svg: memphis, size: [8, 18] },
  { svg: squiggle, size: [26, 48] },
]

const shapes = Array.from({ length: props.count }, () => {
  const { svg, size } = pick(SHAPES)
  return {
    svg,
    style: {
      left: `${rand(0, 100)}%`,
      '--y': rand(0, 100),
      '--size': `${rand(...size)}px`,
      '--drift': `${rand(-60, 60)}px`,
      '--turn': `${pick([-1, 1]) * rand(180, 720)}deg`,
      color: pick(COLORS),
      opacity: rand(0.18, 0.4),
      ...loop(60, 200),
    },
  }
})
</script>

<template>
  <div class="shapes" aria-hidden="true">
    <div v-for="(s, i) in shapes" :key="i" class="shape" :style="s.style" v-html="s.svg" />
  </div>
</template>

<style scoped lang="css">
.shape {
  position: absolute;
  top: calc(var(--y) * 1vh);
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2);
  animation: rise linear infinite;
}

.shape :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

@keyframes rise {
  from {
    transform: translateY(calc((100 - var(--y)) * 1vh + 60px)) rotate(0deg);
  }

  to {
    transform: translate(var(--drift), calc(var(--y) * -1vh - 60px)) rotate(var(--turn));
  }
}

@media (max-width: 720px) {
  .shape:nth-child(n + 13) {
    display: none;
  }
}
</style>
