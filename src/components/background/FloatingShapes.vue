<script setup lang="ts">
// △ ○ ✕ □ outlines, Memphis triangles and squiggles slowly rising across the
// screen and spinning on the way. Each kind is an SVG <symbol>, drawn with <use>;
// every shape only gets a random position, size, colour and timing here.
import { loop, pick, rand } from '@/lib/random'

const props = withDefaults(defineProps<{ count?: number }>(), { count: 20 })

const COLORS = ['#A9DC88', '#CB6E1B', '#FEF274', '#5C8895', '#F3EBD3']
const KINDS = ['tri', 'tri', 'circle', 'cross', 'square', 'memphis', 'memphis', 'squiggle'] // repeats = more common
const SIZE: Record<string, [number, number]> = { memphis: [8, 18], squiggle: [26, 48] } // px, others 14-38


const shapes = Array.from({ length: props.count }, () => {
  const kind = pick(KINDS)
  return {
    kind,
    style: {
      left: `${rand(0, 100)}%`,
      '--y': rand(0, 100),
      '--size': `${rand(...(SIZE[kind] ?? [14, 38]))}px`,
      '--drift': `${rand(-60, 60)}px`,
      '--turn': `${pick([-1, 1]) * rand(180, 720)}deg`,
      color: pick(COLORS),
      opacity: rand(0.18, 0.4),
      ...loop(60, 200), // rising across the screen
    },
  }
})
</script>

<template>
  <div class="shapes">
    <svg class="defs" width="0" height="0">
      <symbol id="bg-tri" viewBox="-12 -12 24 24">
        <path d="M0-10 9.2 6H-9.2Z" vector-effect="non-scaling-stroke" />
      </symbol>
      <symbol id="bg-circle" viewBox="-12 -12 24 24">
        <circle r="8" vector-effect="non-scaling-stroke" />
      </symbol>
      <symbol id="bg-cross" viewBox="-12 -12 24 24">
        <path d="M-7-7 7 7M7-7-7 7" vector-effect="non-scaling-stroke" />
      </symbol>
      <symbol id="bg-square" viewBox="-12 -12 24 24">
        <rect x="-7" y="-7" width="14" height="14" vector-effect="non-scaling-stroke" />
      </symbol>
      <!-- small solid triangle with an offset cream outline, very 90s -->
      <symbol id="bg-memphis" viewBox="-12 -12 24 24">
        <path d="M0-10 10 10H-10Z" fill="currentColor" stroke="none" />
        <path d="M4-6 14 14H-6Z" stroke="#F3EBD3" stroke-width="2" opacity="0.8" vector-effect="non-scaling-stroke" />
      </symbol>
      <symbol id="bg-squiggle" viewBox="-12 -12 24 24">
        <path d="M-10 2.5Q-7.5-6-5-2.5Q-2.5 6 0 2.5Q2.5-6 5-2.5Q7.5 6 10 2.5" vector-effect="non-scaling-stroke" />
      </symbol>
    </svg>

    <div v-for="(s, i) in shapes" :key="i" class="shape" :style="s.style">
      <svg>
        <use :href="`#bg-${s.kind}`" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.defs {
  position: absolute;
}

/* rests at --y and loops from just below the screen to just above it,
   spinning on the way (one animation per shape) */
.shape {
  position: absolute;
  top: calc(var(--y) * 1vh);
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2);
  animation: rise linear infinite;
}

.shape svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
}

@keyframes rise {
  from {
    transform: translateY(calc((100 - var(--y)) * 1vh + 60px)) rotate(0deg);
  }

  to {
    transform: translate(var(--drift), calc(var(--y) * -1vh - 60px)) rotate(var(--turn));
  }
}

/* fewer on phones (the defs <svg> is the first child) */
@media (max-width: 720px) {
  .shapes> :nth-child(n + 14) {
    display: none;
  }
}
</style>
