<script setup lang="ts">
// Full-screen backdrop behind every screen: a deep green gradient with drifting
// fog, plus the parts in this folder (the cookie on the horizon, the floor grid,
// stars and rising shapes). All HTML/SVG + CSS animations, no canvas or JS loop;
// every animation is transform or opacity only, so the GPU runs them without
// repainting anything.
import CookieSprite from './CookieSprite.vue'
import FloatingShapes from './FloatingShapes.vue'
import FloorGrid from './FloorGrid.vue'
import Starfield from './Starfield.vue'

const props = withDefaults(defineProps<{ accent?: string }>(), { accent: '#CB6E1B' })
</script>

<template>
  <div class="bg-fx" :style="{ '--accent': props.accent }" aria-hidden="true">
    <div class="fog" />
    <CookieSprite />
    <FloorGrid />
    <Starfield />
    <FloatingShapes />
  </div>
</template>

<style scoped>
.bg-fx {
  --horizon: 72%;
  /* where the cookie sits and the floor starts */
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  contain: strict;
  /* nothing in here affects the page layout, and the other way round */
  background: linear-gradient(#0d1a1a, #142b27 55%, #183528);
}

.fog {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(circle 55vmax at 20% 30%, rgba(44, 90, 68, 0.55), transparent),
    radial-gradient(circle 60vmax at 80% 70%, rgba(92, 136, 149, 0.35), transparent),
    radial-gradient(circle 50vmax at 50% 100%, color-mix(in srgb, var(--accent) 12%, transparent), transparent);
  animation: drift 80s ease-in-out infinite alternate;
}

@keyframes drift {
  to {
    transform: translate(6vw, -3vh);
  }
}
</style>
