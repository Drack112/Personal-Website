<script setup lang="ts">
withDefaults(
  defineProps<{
    strength?: number // darkness of each line, 0-1
    flicker?: boolean // a faint flicker now and then
    roll?: boolean // lines slowly drifting down, like a TV picture
    vignette?: boolean // darker corners
  }>(),
  { strength: 0.2 },
)
</script>

<template>
  <div class="crt-scanlines" aria-hidden="true">
    <div class="lines" :class="{ flicker, roll }" :style="{ '--line': `rgba(0, 0, 0, ${strength})` }" />
    <div v-if="vignette" class="vignette" />
  </div>
</template>

<style scoped lang="css">
.crt-scanlines,
.lines,
.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.lines {
  background: repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px 3px);
}

/* a transform, not background-position, so it never repaints */
.lines.roll {
  top: -30px;
  animation: roll 7s linear infinite;
}

.lines.flicker {
  animation: flicker 4s steps(2) infinite;
}

.lines.roll.flicker {
  animation:
    roll 7s linear infinite,
    flicker 4s steps(2) infinite;
}

.vignette {
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.45) 100%);
}

@keyframes roll {
  to {
    transform: translateY(30px);
  }
}

@keyframes flicker {

  0%,
  92% {
    opacity: 1;
  }

  94% {
    opacity: 0.85;
  }

  96% {
    opacity: 1;
  }
}
</style>
