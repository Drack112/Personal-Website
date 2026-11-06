<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import BackgroundFx from '@/components/background/BackgroundFx.vue'
import CrtOverlay from '@/components/crt/CrtOverlay.vue'
import CursorTrail from '@/components/effects/CursorTrail.vue'
import TopBar from '@/components/layout/TopBar.vue'
import ControlHints from '@/components/layout/ControlHints.vue'
import CreditsButton from '@/components/layout/CreditsButton.vue'
import CookieWindow from '@/components/cookie/CookieWindow.vue'
import QuakeTerminal from '@/components/terminal/QuakeTerminal.vue'

const route = useRoute()
const booting = computed(() => route.name === 'boot')
</script>

<template>
  <BackgroundFx :accent="route.meta.accent" />
  <TopBar v-if="!booting" />
  <main class="stage" :class="{ booting }">
    <RouterView v-slot="{ Component, route: r }">
      <Transition name="scene" mode="out-in">
        <component :is="Component" :key="r.path.split('/')[1]" />
      </Transition>
    </RouterView>
  </main>
  <ControlHints v-if="!booting" />
  <CookieWindow v-if="!booting" />
  <QuakeTerminal v-if="!booting" />
  <CreditsButton />
  <CrtOverlay />
  <CursorTrail />
</template>

<style scoped>
.stage {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: var(--bar-h) 0 var(--hint-h);
}

.stage.booting {
  padding: 0;
}

.scene-enter-active,
.scene-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    filter 0.22s ease;
}

.scene-enter-from {
  opacity: 0;
  transform: scale(1.04);
  filter: brightness(1.8) blur(3px);
}

.scene-leave-to {
  opacity: 0;
  transform: scale(0.97);
  filter: blur(3px);
}

@media (pointer: coarse),
(max-width: 720px) {
  .stage {
    /* room for the floating credits button */
    padding-bottom: 4.5rem;
  }
}
</style>
