<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { nf } from '@/data/icons'
import { settings } from '@/composables/useSettings'
import { sfx } from '@/composables/useSound'
import { useLastfm } from '@/composables/useLastfm'

const route = useRoute()
const now = useClock()
const clock = computed(() => now.value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
const date = computed(() => now.value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase())

const lastfm = useLastfm()
onMounted(lastfm.start)
onBeforeUnmount(lastfm.stop)
const playing = computed(() => (lastfm.current.value?.nowPlaying ? lastfm.current.value : null))

function toggleSound() {
  settings.sound.value = !settings.sound.value
  sfx.select()
}
function openTerminal() {
  window.dispatchEvent(new CustomEvent('lk:toggle-terminal'))
}
function toggleCrt() {
  settings.crt.value = !settings.crt.value
  sfx.select()
}
</script>

<template>
  <header class="top">
    <RouterLink to="/menu" class="logo pixel" @click="sfx.back()">
      <span class="shapes" aria-hidden="true"><b>△</b><b>○</b><b>✕</b><b>□</b></span>
      <span class="name">DRACK<span class="dim">·PORTFOLIO</span></span>
    </RouterLink>
    <span class="crumb pixel">{{ route.meta.title }}</span>

    <RouterLink v-if="playing" to="/music" class="np" :title="`${playing.name} — ${playing.artist}`">
      <span class="nf eq">{{ nf.music }}</span>
      <span class="np-text">{{ playing.name }} — {{ playing.artist }}</span>
    </RouterLink>

    <div class="right">
      <button class="icon-btn" type="button" title="Terminal ( ` )" aria-label="Open terminal" @click="openTerminal">
        <span class="nf">{{ nf.shell }}</span>
      </button>
      <button class="icon-btn" type="button" :aria-pressed="settings.crt.value"
        :title="settings.crt.value ? 'CRT on' : 'CRT off'" @click="toggleCrt">
        <span class="nf">{{ nf.crt }}</span>
      </button>
      <button class="icon-btn" type="button" :aria-pressed="settings.sound.value"
        :title="settings.sound.value ? 'Sound on' : 'Sound off'" @click="toggleSound">
        <span class="nf">{{ settings.sound.value ? nf.vol : nf.mute }}</span>
      </button>
      <div class="clock" :title="now.toString()">
        <span class="date">{{ date }}</span>
        <span class="time pixel">{{ clock }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 40;
  height: var(--bar-h);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
  background: linear-gradient(180deg, rgba(13, 26, 26, 0.95), rgba(13, 26, 26, 0.6));
  border-bottom: 3px solid var(--ink);
  box-shadow: 0 3px 0 rgba(169, 220, 136, 0.25);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--cream);
  text-decoration: none;
  font-size: 0.72rem;
}

.shapes {
  display: flex;
  gap: 2px;
  font-family: var(--font-ui);
  font-size: 0.85rem;
}

.shapes b:nth-child(1) {
  color: var(--lime);
}

.shapes b:nth-child(2) {
  color: var(--orange);
}

.shapes b:nth-child(3) {
  color: var(--gold);
}

.shapes b:nth-child(4) {
  color: var(--cream);
}

.dim {
  color: var(--muted);
}

.crumb {
  flex: none;
  white-space: nowrap;
  font-size: 0.6rem;
  color: var(--gold);
  padding-left: 1rem;
  border-left: 3px solid var(--teal);
}

.np {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  max-width: 34ch;
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--lime);
  text-decoration: none;
}

.np-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eq {
  animation: bounce 0.8s steps(2) infinite;
}

.right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

.np+.right {
  margin-left: 1rem;
}

.icon-btn {
  width: 32px;
  height: 28px;
  border: 0;
  background: var(--green);
  color: var(--cream);
  font-size: 1rem;
  box-shadow:
    0 0 0 2px var(--ink),
    inset 2px 2px 0 var(--green-hi),
    inset -2px -2px 0 var(--green-lo);
}

.icon-btn .nf {
  transform: translateY(1px);
  /* these glyphs sit slightly high in their em box */
}

.icon-btn[aria-pressed='false'] {
  color: var(--muted);
  background: var(--green-lo);
}

.clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
}

.date {
  font-size: 0.6rem;
  color: var(--muted);
}

.time {
  font-size: 0.7rem;
  color: var(--cream);
}

@keyframes bounce {
  50% {
    transform: translateY(-2px);
  }
}

@media (max-width: 960px) {
  .name .dim {
    display: none;
  }
}

@media (max-width: 720px) {

  .crumb,
  .np,
  .date {
    display: none;
  }

  .name .dim {
    display: none;
  }
}
</style>
