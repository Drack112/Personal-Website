<script setup lang="ts">
import { nf } from '@/data/icons'

import type { Slot } from '../saves'

interface Tab {
  id: Slot
  number: string
  icon: string
  name: string
}

const TABS: Tab[] = [
  { id: 'github', number: '1', icon: nf.github, name: 'GitHub' },
  { id: 'career', number: '2', icon: nf.briefcase, name: 'Career' },
]

defineProps<{ active: Slot; count: number; used: string }>()

const emit = defineEmits<{ select: [slot: Slot] }>()
</script>

<template>
  <div class="slots" role="tablist">
    <button v-for="tab in TABS" :key="tab.id" type="button" role="tab" class="card-tab" :class="{ on: active === tab.id }"
      :aria-selected="active === tab.id" @click="emit('select', tab.id)">
      <span class="chip" aria-hidden="true"><i v-for="n in 6" :key="n" /></span>
      <span class="tab-text">
        <span class="pixel">MEMORY CARD {{ tab.number }}</span>
        <span class="tab-sub"><span class="nf">{{ tab.icon }}</span> {{ tab.name }}</span>
      </span>
    </button>
    <span class="used">{{ count }} saves · {{ used }}</span>
  </div>
</template>

<style scoped>
.slots {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}

.card-tab {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 1rem 0.6rem 0.7rem;
  border: 0;
  color: var(--cream);
  background: var(--green-lo);
  opacity: 0.6;
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green),
    inset -3px -3px 0 var(--ink);
  transition: opacity 0.15s;
}

.card-tab.on {
  opacity: 1;
  background: var(--green);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo),
    0 0 18px color-mix(in srgb, var(--lime) 35%, transparent);
}

.chip {
  display: grid;
  grid-template-columns: repeat(3, 6px);
  gap: 3px;
  padding: 5px;
  background: var(--gold);
  box-shadow: 0 0 0 2px var(--ink);
}

.chip i {
  height: 6px;
  background: #c9b53c;
}

.tab-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  font-size: 0.65rem;
}

.tab-sub {
  font-size: 0.8rem;
  color: var(--muted);
}

.used {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--muted);
}

@media (max-width: 860px) {
  .used {
    margin-left: 0;
    width: 100%;
  }
}
</style>
