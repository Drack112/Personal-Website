<script setup lang="ts">
import { loop, rand } from '@/lib/random'

const props = withDefaults(defineProps<{ count?: number }>(), { count: 36 })

const stars = Array.from({ length: props.count }, () => ({
  left: `${rand(0, 100)}%`,
  top: `${rand(0, 100)}%`,
  ...loop(2, 7),
}))
</script>

<template>
  <div class="stars">
    <span v-for="(s, i) in stars" :key="i" class="star" :style="s" />
  </div>
</template>

<style scoped>
.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #f3ebd3;
  opacity: 0.5;
  animation: twinkle ease-in-out infinite;
}

@keyframes twinkle {

  0%,
  100% {
    opacity: 0.15;
  }

  50% {
    opacity: 0.85;
  }
}

/* fewer on phones */
@media (max-width: 720px) {
  .stars> :nth-child(n + 21) {
    display: none;
  }
}
</style>
