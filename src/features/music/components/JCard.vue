<script setup lang="ts">
import type { Track } from '@/composables/useLastfm'
import { songKey } from '@/composables/usePreview'
import { profile } from '@/data/profile'

import { ago } from '../format'

const MAX_TRACKS = 8

defineProps<{
  tracks: Track[]
  active: number
  playingKey: string | null
}>()

const emit = defineEmits<{
  pick: [index: number]
}>()
</script>

<template>
  <aside class="jcard">
    <header>SIDE A · recent mix</header>
    <ol v-if="tracks.length">
      <li v-for="(t, i) in tracks.slice(0, MAX_TRACKS)" :key="`${t.name}-${i}`" :class="{ active: i === active }">
        <button type="button" @click="emit('pick', i)">
          <span class="t">{{ t.name }}</span>
          <span class="a">{{ t.artist }}</span>
        </button>
        <span class="when">{{ playingKey === songKey(t) ? '♪' : t.nowPlaying ? '▶' : ago(t.uts) }}</span>
      </li>
    </ol>
    <p v-else class="empty">nothing recorded yet...</p>
    <a class="sign" :href="profile.links.lastfm" target="_blank" rel="noopener">♥ drack112 on last.fm</a>
  </aside>
</template>

<style scoped>
.jcard {
  width: min(100%, 250px);
  padding: 0 0 12px;
  background: #f6efd9;
  color: #2b2a55;
  font-family: var(--font-hand);
  box-shadow:
    0 0 0 2px #d9cdaa,
    6px 6px 0 rgba(0, 0, 0, 0.3);
  transform: rotate(1.5deg);
}

.jcard header {
  padding: 8px 12px;
  background: var(--orange);
  color: #f6efd9;
  font-weight: 700;
}

.jcard ol {
  list-style: none;
  margin: 0;
  padding: 6px 10px 0;
}

.jcard li {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  border-bottom: 1px solid #d9cdaa;
  padding: 4px 0;
}

.jcard li.active {
  background: color-mix(in srgb, var(--orange) 15%, transparent);
}

.jcard button {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 0;
  padding: 0;
  background: none;
  text-align: left;
  font-family: var(--font-hand);
  color: inherit;
}

.jcard .t {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.jcard .a {
  font-size: 0.75rem;
  color: #6a6488;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.when {
  font-size: 0.75rem;
  color: var(--orange);
  font-weight: 700;
}

.empty {
  padding: 12px;
}

.sign {
  display: block;
  margin: 10px 12px 0;
  text-align: right;
  color: var(--orange);
  font-size: 0.8rem;
  text-decoration: none;
}

@media (max-width: 600px) {
  .jcard {
    width: min(100%, 420px);
    transform: rotate(0.6deg);
  }

  .jcard li {
    padding: 7px 0;
  }
}
</style>
