<script setup lang="ts">
// Bevelled window with a title bar. Opens with a CRT "power on" squeeze and
// closes with the reverse; wrap it in v-if to animate in and out.
import { sfx } from '@/composables/useSound'

withDefaults(defineProps<{ title: string; icon?: string; closable?: boolean; accent?: string }>(), {
  closable: false,
  accent: 'var(--lime)',
})
const emit = defineEmits<{ close: [] }>()

function close() {
  sfx.close()
  emit('close')
}
</script>

<template>
  <section class="win" :style="{ '--accent': accent }">
    <header class="bar">
      <span v-if="icon" class="nf ico">{{ icon }}</span>
      <h2 class="title pixel">{{ title }}</h2>
      <span class="dots" aria-hidden="true"><i /><i /><i /></span>
      <button v-if="closable" class="x" type="button" aria-label="Close" @click="close">✕</button>
    </header>
    <div class="body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.win {
  position: relative;
  background: rgba(14, 31, 28, 0.92);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 0 0 0 3px var(--green-hi),
    inset 0 0 0 6px var(--green-lo),
    8px 8px 0 3px rgba(0, 0, 0, 0.35);
  animation: power-on 0.32s steps(6) both;
  backdrop-filter: blur(2px);
}
.bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  background: linear-gradient(90deg, var(--green-lo), var(--green) 60%, var(--green-hi));
  border-bottom: 3px solid var(--ink);
  box-shadow: inset 0 -3px 0 var(--accent);
}
.ico {
  color: var(--accent);
  font-size: 1.1rem;
}
.title {
  margin: 0;
  flex: 1;
  font-size: 0.7rem;
  color: var(--cream);
  text-shadow: 2px 2px 0 var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dots {
  display: flex;
  gap: 4px;
}
.dots i {
  width: 8px;
  height: 8px;
  background: var(--accent);
  box-shadow: 0 0 0 2px var(--ink);
}
.dots i:nth-child(2) {
  background: var(--gold);
}
.dots i:nth-child(3) {
  background: var(--orange);
}
.x {
  border: 0;
  width: 26px;
  height: 26px;
  background: var(--orange);
  color: var(--ink);
  font-weight: 700;
  box-shadow:
    0 0 0 2px var(--ink),
    inset 2px 2px 0 #e0914a,
    inset -2px -2px 0 var(--orange-lo);
}
.body {
  padding: 1rem;
}
@keyframes power-on {
  0% {
    transform: scale(1, 0.02);
    filter: brightness(3);
    opacity: 0;
  }
  40% {
    transform: scale(1, 0.06);
    filter: brightness(2.2);
    opacity: 1;
  }
  100% {
    transform: none;
    filter: none;
  }
}
</style>
