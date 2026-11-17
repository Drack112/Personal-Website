<script setup lang="ts">
import { useRouter } from 'vue-router'

import BevelButton from '@/components/ui/BevelButton.vue'
import { settings } from '@/composables/useSettings'
import { sfx } from '@/composables/useSound'
import { forgetBooted } from '@/lib/boot'
import { nf } from '@/data/icons'

const TOGGLES = [
  { key: 'sound', label: 'Sound effects', icon: nf.vol },
  { key: 'crt', label: 'CRT scanlines', icon: nf.crt },
  { key: 'motion', label: 'Animations', icon: nf.sparkle },
  { key: 'trail', label: 'Cursor trail', icon: nf.mouse },
] as const

const router = useRouter()

function flip(key: (typeof TOGGLES)[number]['key']) {
  settings[key].value = !settings[key].value
  sfx.select()
}

function replayBoot() {
  forgetBooted()
  router.push('/')
}
</script>

<template>
  <ul class="toggles">
    <li v-for="t in TOGGLES" :key="t.key">
      <span class="nf ticon">{{ t.icon }}</span>
      <span class="tlabel">{{ t.label }}</span>
      <button type="button" class="switch" :class="{ on: settings[t.key].value }"
        :aria-pressed="settings[t.key].value" @click="flip(t.key)">
        <span>{{ settings[t.key].value ? 'ON' : 'OFF' }}</span>
      </button>
    </li>
    <li>
      <span class="nf ticon">{{ nf.vol }}</span>
      <label class="tlabel" for="vol">Volume</label>
      <input id="vol" v-model.number="settings.volume.value" type="range" min="0" max="1" step="0.1"
        @change="sfx.move()" />
    </li>
  </ul>
  <BevelButton :icon="nf.refresh" variant="orange" @click="replayBoot">REPLAY BOOT</BevelButton>
</template>

<style scoped>
.toggles {
  list-style: none;
  padding: 0;
  margin: 0 0 1.6rem;
  display: grid;
  gap: 0.8rem;
  max-width: 460px;
}

.toggles li {
  display: grid;
  grid-template-columns: 2ch 1fr auto;
  gap: 0.8rem;
  align-items: center;
}

.ticon {
  color: var(--lime);
}

.switch {
  width: 70px;
  border: 0;
  padding: 0.3rem 0;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--cream);
  background: var(--green-lo);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--ink);
}

.switch.on {
  color: var(--ink);
  background: var(--lime);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 #cbedb3,
    inset -3px -3px 0 var(--green-hi);
}

input[type='range'] {
  accent-color: var(--orange);
  width: 140px;
}
</style>
