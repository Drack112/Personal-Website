<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import RetroWindow from '@/components/ui/RetroWindow.vue'
import Walkman from '@/components/music/Walkman.vue'
import { nf } from '@/data/icons'
import { profile } from '@/data/profile'
import { useLastfm } from '@/composables/useLastfm'
import { sfx } from '@/composables/useSound'

const router = useRouter()
const lastfm = useLastfm()
const max = computed(() => Math.max(1, ...lastfm.topArtists.value.map((a) => a.playcount)))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault()
    sfx.back()
    router.push('/menu')
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="music">
    <Walkman />

    <div class="panels">
      <RetroWindow title="TOP ARTISTS · 7 DAYS" :icon="nf.music" accent="var(--orange)">
        <ol v-if="lastfm.topArtists.value.length" class="top">
          <li v-for="(a, i) in lastfm.topArtists.value" :key="a.name">
            <span class="rank pixel">{{ i + 1 }}</span>
            <a :href="a.url" target="_blank" rel="noopener" class="artist">{{ a.name }}</a>
            <span class="bar"><i :style="{ width: `${(a.playcount / max) * 100}%` }" /></span>
            <span class="plays">{{ a.playcount }}</span>
          </li>
        </ol>
        <p v-else-if="lastfm.status.value === 'offline'" class="muted">
          Last.fm is offline here. Set <code>LASTFM_API_KEY</code> in <code>frontend/.env</code> for local dev, or in
          the Vercel project's environment variables, for the <code>/api/lastfm</code> functions.
        </p>
        <p v-else class="muted blink">rewinding tape...</p>
      </RetroWindow>

      <RetroWindow title="SCROBBLES" :icon="nf.lastfm" accent="var(--gold)">
        <p class="big pixel">{{ lastfm.scrobbles.value?.toLocaleString('en-US') ?? '····' }}</p>
        <p class="muted">tracks scrobbled on Last.fm</p>
        <a :href="profile.links.lastfm" target="_blank" rel="noopener">last.fm/user/{{ profile.handle }} ▸</a>
      </RetroWindow>
    </div>
  </div>
</template>

<style scoped>
.music {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  display: grid;
  gap: 2.4rem;
}

.panels {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.top {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.top li {
  display: grid;
  grid-template-columns: 2.5ch minmax(0, 14ch) 1fr 5ch;
  gap: 0.8rem;
  align-items: center;
  font-size: 0.86rem;
}

.rank {
  font-size: 0.65rem;
  color: var(--orange);
}

.artist {
  color: var(--cream);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar {
  height: 12px;
  background: var(--ink);
  box-shadow: 0 0 0 2px var(--green-hi);
}

.bar i {
  display: block;
  height: 100%;
  background: repeating-linear-gradient(90deg, var(--orange) 0 8px, var(--orange-lo) 8px 10px);
}

.plays {
  text-align: right;
  color: var(--gold);
}

.big {
  margin: 0.4rem 0;
  font-size: 1.3rem;
  color: var(--lime);
}

.muted {
  color: var(--muted);
  font-size: 0.85rem;
}

code {
  color: var(--gold);
}

.blink {
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0.3;
  }
}

@media (max-width: 760px) {
  .music {
    padding: 1.2rem 0.8rem 2rem;
  }

  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
