<script setup lang="ts">
import cookie from '@/assets/sprites/cookie.svg'

const image = `url("${cookie}")`
</script>

<template>
  <div class="sprite" :style="{ backgroundImage: image }" />
</template>

<style scoped lang="css">
.sprite {
  --size: max(96px, 46vmin);
  position: absolute;
  left: 50%;
  top: calc(var(--horizon) - var(--size) * 0.95);
  width: var(--size);
  height: var(--size);
  margin-left: calc(var(--size) / -2);
  background: center / contain no-repeat;
  opacity: 0.26;
  animation: bob 7s steps(4, jump-none) infinite alternate;
}

.sprite::after {
  content: '✦';
  position: absolute;
  left: 16%;
  top: 8%;
  font-size: calc(var(--size) / 9);
  line-height: 1;
  color: #fff;
  animation: twinkle 2.8s ease-in-out infinite;
}

@keyframes bob {
  from {
    transform: translateY(calc(var(--size) / -16));
  }

  to {
    transform: translateY(calc(var(--size) / 16));
  }
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

@media (max-width: 720px) {
  .sprite {
    opacity: 0.16;
  }
}
</style>
