<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import CreditsWindow from '@/components/layout/CreditsWindow.vue'
import { sfx } from '@/composables/useSound'
import { overlayOpen } from '@/composables/useUi'

const open = ref(false)

function show() {
  open.value = true
  overlayOpen.value = true
  sfx.open()
}

function close() {
  open.value = false
  overlayOpen.value = false
  sfx.close()
}

function onKey(e: KeyboardEvent) {
  if (!open.value || e.key === 'Tab') return
  e.stopImmediatePropagation()
  if (e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault()
    close()
  }
}

onMounted(() => window.addEventListener('keydown', onKey, { capture: true }))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, { capture: true })
  if (open.value) overlayOpen.value = false
})
</script>

<template>
  <button type="button" class="badge" aria-label="Credits and copyright notices" title="Credits & rights" @click="show" @pointerenter="sfx.move()">
    <span class="mark pixel">!</span>
  </button>

  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="overlay" @click.self="close">
        <CreditsWindow @close="close" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.badge {
  position: fixed;
  left: 1rem;
  bottom: calc((var(--hint-h) - 30px) / 2);
  z-index: 76;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: var(--gold);
  box-shadow:
    0 0 0 3px var(--ink),
    inset -3px -3px 0 var(--orange);
}

.badge::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid var(--gold);
  opacity: 0;
  animation: ping 2.6s ease-out infinite;
}

.badge:hover {
  filter: brightness(1.1);
}

.mark {
  font-size: 0.8rem;
  line-height: 1;
  color: var(--ink);
  padding-left: 2px;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(6, 17, 16, 0.8);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

@keyframes ping {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }

  70%,
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@media (pointer: coarse), (max-width: 720px) {
  .badge {
    left: 0.8rem;
    bottom: 0.8rem;
  }
}
</style>
