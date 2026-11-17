<script setup lang="ts">
import CookieSprite from '@/components/background/CookieSprite.vue'
import FloatingShapes from '@/components/background/FloatingShapes.vue'
import FloorGrid from '@/components/background/FloorGrid.vue'
import Starfield from '@/components/background/Starfield.vue'

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

<style scoped lang="css">
.bg-fx {
  --horizon: 72%;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  contain: strict;
  background: linear-gradient(var(--night), var(--dusk) 55%, var(--deep));
}

.fog {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(circle 55vmax at 20% 30%, color-mix(in srgb, var(--green) 55%, transparent), transparent),
    radial-gradient(circle 60vmax at 80% 70%, color-mix(in srgb, var(--teal) 35%, transparent), transparent),
    radial-gradient(circle 50vmax at 50% 100%, color-mix(in srgb, var(--accent) 12%, transparent), transparent);
  animation: drift 80s ease-in-out infinite alternate;
}

@keyframes drift {
  to {
    transform: translate(6vw, -3vh);
  }
}
</style>
