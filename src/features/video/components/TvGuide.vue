<script setup lang="ts">
import { ref, watch } from 'vue'

import { nf } from '@/data/icons'

import type { Category } from '../types'

const props = defineProps<{ category: Category; active: number }>()
const emit = defineEmits<{ select: [index: number] }>()

const list = ref<HTMLElement>()

watch([() => props.active, () => props.category.id], () => {
  requestAnimationFrame(() => list.value?.querySelector('.on')?.scrollIntoView({ block: 'nearest' }))
})
</script>

<template>
  <aside class="guide-col">
    <h3 class="pixel guide-head"><span class="nf">{{ nf.clock }}</span> TV GUIDE</h3>
    <ol ref="list" class="guide">
      <li v-for="(it, i) in category.items" :key="it.screen.key">
        <button type="button" :class="{ on: i === active }" :aria-current="i === active" @click="emit('select', i)">
          <img v-if="it.thumb" :src="it.thumb" alt="" loading="lazy" class="thumb" />
          <span v-else class="thumb blank nf">{{ category.icon }}</span>
          <span class="meta">
            <span class="num pixel">{{ it.num }}</span>
            <span class="t">{{ it.title }}</span>
          </span>
        </button>
      </li>
    </ol>
  </aside>
</template>

<style scoped>
.guide-col {
  display: flex;
  flex-direction: column;
  margin-top: calc(var(--tv-w) * 44 / 256);
  height: calc(var(--tv-w) * 192 / 256);
  min-height: 320px;
  padding: 0.8rem;
  background: color-mix(in srgb, var(--ink) 88%, transparent);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 0 0 0 3px var(--green-hi),
    8px 8px 0 3px rgba(0, 0, 0, 0.35);
}

.guide-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.2rem 0 0.8rem;
  font-size: 0.6rem;
  color: var(--gold);
}

.guide-head .nf {
  color: var(--orange);
}

.guide {
  list-style: none;
  margin: 0;
  padding: 2px 6px 2px 2px;
  display: grid;
  align-content: start;
  gap: 0.5rem;
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.guide button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem;
  border: 0;
  text-align: left;
  color: var(--cream);
  background: var(--green-lo);
  box-shadow: 0 0 0 2px var(--ink);
}

.guide button:hover {
  background: var(--green);
}

.guide button.on {
  background: var(--green);
  box-shadow:
    0 0 0 2px var(--ink),
    inset 4px 0 0 var(--lime);
}

.thumb {
  flex: none;
  width: 88px;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #050807;
  box-shadow: 0 0 0 2px var(--ink);
}

.thumb.blank {
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  color: var(--orange);
}

.meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.num {
  font-size: 0.5rem;
  color: var(--orange);
}

.on .num {
  color: var(--gold);
}

.t {
  font-size: 0.78rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 960px) {
  .guide-col {
    margin-top: 0;
    height: auto;
    min-height: 0;
  }

  .guide {
    flex: none;
    max-height: 420px;
  }
}
</style>
