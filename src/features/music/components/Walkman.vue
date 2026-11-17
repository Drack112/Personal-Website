<script setup lang="ts">
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'

import PixelCanvas from '@/components/pixel/PixelCanvas.vue'
import BevelButton from '@/components/ui/BevelButton.vue'
import { place, type Pixels } from '@/lib/pixel'
import { nf } from '@/data/icons'

import { LAYOUTS, drawWalkman, type Key } from '../art/walkmanArt'
import { useDeck } from '../composables/useDeck'
import { mmss } from '../format'
import CassetteLabel from './CassetteLabel.vue'
import JCard from './JCard.vue'

const KEY_LABELS: Record<Key, string> = {
  rew: 'Rewind: older track',
  play: 'Play a 30-second preview',
  ff: 'Fast forward: newer track',
  stop: 'Pause',
}

const {
  tracks,
  view,
  shown,
  previewing,
  pv,
  offline,
  playingKey,
  elapsed,
  running,
  progress,
  down,
  shuttle,
  status,
  lcd,
  sending,
  coverUrl,
  press,
  pick,
  fullSong,
} = useDeck()
const narrow = useMediaQuery('(max-width: 600px)')

const layoutName = computed<keyof typeof LAYOUTS>(() => (narrow.value ? 'stacked' : 'wide'))
const L = computed(() => LAYOUTS[layoutName.value])

function draw(p: Pixels, t: number) {
  drawWalkman(
    p,
    t,
    {
      running: running.value,
      progress: progress.value,
      down: down.value,
      shuttle: shuttle.value,
      elapsed: mmss(elapsed.value),
      status: lcd.value,
      loaded: Boolean(shown.value),
    },
    L.value,
  )
}

const spot = (r: { x: number; y: number; w: number; h: number }) => place(r, L.value.W, L.value.H)
</script>

<template>
  <div class="walkman-wrap">
    <div class="deck">
      <div class="walkman" :class="{ narrow }" :style="{ aspectRatio: `${L.W} / ${L.H}` }">
        <PixelCanvas :key="layoutName" class="art" :width="L.W" :height="L.H" :draw="draw" :fps="15" />

        <CassetteLabel :style="spot(L.label)" :track="shown" :cover-url="coverUrl" :offline="offline" />

        <button v-for="k in L.keys" :key="k.id" type="button" class="key" :style="spot(k)"
          :aria-label="KEY_LABELS[k.id]" :aria-pressed="k.id === 'play' ? down === 'play' : undefined"
          @click="press(k.id)" />

        <p class="sr-only" aria-live="polite">{{ status }}<template v-if="shown">: {{ shown.name }} by {{ shown.artist
        }}</template></p>
      </div>

      <div class="actions">
        <p class="hint">
          <template v-if="previewing && pv === 'missing'">no preview for this one, try the full song</template>
          <template v-else>pick a song on the J-card for a 30s preview</template>
        </p>
        <BevelButton variant="orange" small :icon="nf.tv" :disabled="!shown || sending" @click="fullSong">
          {{ sending ? 'TUNING...' : 'FULL SONG ON THE TV' }}
        </BevelButton>
      </div>
    </div>

    <JCard :tracks="tracks" :active="view" :playing-key="playingKey" @pick="pick" />
  </div>
</template>

<style scoped>
.walkman-wrap {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.deck {
  width: min(100%, 760px);
  display: grid;
  gap: 1rem;
}

.walkman {
  position: relative;
  container-type: inline-size;
  width: 100%;
}

.art {
  position: absolute;
  inset: 0;
}

.key {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
}

.key:hover {
  background: color-mix(in srgb, var(--gold) 12%, transparent);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
}

@media (max-width: 600px) {
  .walkman.narrow {
    max-width: 420px;
    margin: 0 auto;
  }

  .actions {
    justify-content: center;
    text-align: center;
  }
}
</style>
