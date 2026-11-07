<script setup lang="ts">
import CrtScanlines from './CrtScanlines.vue'
import { settings } from '@/composables/useSettings'
</script>

<template>
  <CrtScanlines v-if="settings.crt.value" class="crt-overlay" :strength="0.18" flicker vignette />
</template>

<style scoped lang="css">
.crt-overlay {
  position: fixed;
  z-index: 50;
}
</style>
