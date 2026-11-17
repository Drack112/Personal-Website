<script setup lang="ts">
import { ref, watch } from 'vue'

import type { Track } from '@/composables/useLastfm'
import { nf } from '@/data/icons'

const COVER_PX = 24
const MARQUEE_WIDTH = 18
const WIDE_CHAR_FROM = 0x2e80

const props = defineProps<{
  track: Track | null
  coverUrl: string
  offline: boolean
}>()

const cover = ref<HTMLCanvasElement>()

watch(
  [() => props.coverUrl, cover],
  ([url, c]) => {
    const g = c?.getContext('2d')
    if (!c || !g) return
    g.clearRect(0, 0, COVER_PX, COVER_PX)
    if (!url) return
    const img = new Image()
    img.onload = () => {
      if (props.coverUrl !== url) return
      g.imageSmoothingEnabled = true
      g.drawImage(img, 0, 0, COVER_PX, COVER_PX)
    }
    img.src = url
  },
  { immediate: true },
)

const textWidth = (s: string) => [...s].reduce((n, ch) => n + (ch.codePointAt(0)! >= WIDE_CHAR_FROM ? 2 : 1), 0)
</script>

<template>
  <div class="label">
    <div class="cover">
      <canvas v-show="coverUrl" ref="cover" :width="COVER_PX" :height="COVER_PX"
        :aria-label="track?.album || track?.name" role="img" />
      <span v-if="!coverUrl" class="nf">{{ nf.music }}</span>
    </div>
    <div class="info">
      <a v-if="track" :href="track.url" target="_blank" rel="noopener" class="title" :title="track.name">
        <span :class="{ marquee: textWidth(track.name) > MARQUEE_WIDTH }">{{ track.name }}</span>
      </a>
      <span v-else class="title">insert cookie...</span>
      <span class="artist">{{ track ? track.artist : offline ? 'last.fm offline' : 'loading tape' }}</span>
    </div>
  </div>
</template>

<style scoped>
.label {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 3%;
  container-type: size;
  color: #2b2a55;
  font-family: var(--font-hand);
  line-height: 1.1;
}

.cover {
  flex: none;
  height: 100%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background: var(--green);
  color: var(--gold);
  font-size: 50cqh;
  box-shadow: 0 0 0 2px var(--ink);
}

.cover canvas {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4cqh;
}

.title {
  font-size: 34cqh;
  font-weight: 700;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
}

a.title:hover {
  color: var(--orange-lo);
}

.marquee {
  display: inline-block;
  padding-left: 100%;
  animation: marquee 12s linear infinite;
}

.artist {
  font-size: 25cqh;
  font-weight: 700;
  color: var(--orange-lo);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes marquee {
  to {
    transform: translateX(-100%);
  }
}
</style>
