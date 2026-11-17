<script setup lang="ts">
import { computed } from 'vue'

import type { Category } from '../types'

interface Group {
  name: string
  categories: Category[]
}

const props = defineProps<{ categories: Category[]; active: Category }>()
const emit = defineEmits<{ select: [index: number] }>()

const groups = computed(() =>
  props.categories.reduce<Group[]>((list, c) => {
    const last = list[list.length - 1]
    if (last?.name === c.group) last.categories.push(c)
    else list.push({ name: c.group, categories: [c] })
    return list
  }, []),
)
</script>

<template>
  <nav class="cats" aria-label="Video categories">
    <section v-for="g in groups" :key="g.name" class="group" :aria-label="g.name">
      <span class="group-name pixel">{{ g.name }}</span>
      <div class="group-cats">
        <button v-for="c in g.categories" :key="c.id" type="button" class="cat" :class="{ on: c === active }"
          :aria-current="c === active" @click="emit('select', categories.indexOf(c))">
          <span class="nf">{{ c.icon }}</span>
          <span class="cat-title pixel">{{ c.title }}</span>
          <span class="count">{{ c.items.length }}</span>
        </button>
      </div>
    </section>
  </nav>
</template>

<style scoped>
.cats {
  display: flex;
  align-items: flex-end;
  gap: 1.4rem;
  overflow-x: auto;
  padding: 4px 4px 12px;
  margin-bottom: 1rem;
  scrollbar-width: thin;
}

.group {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.group + .group {
  padding-left: 1.4rem;
  border-left: 3px dotted var(--green-hi);
}

.group-name {
  font-size: 0.45rem;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.group-cats {
  display: flex;
  gap: 0.7rem;
}

.cat {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.8rem;
  border: 0;
  color: var(--cream);
  background: var(--green-lo);
  opacity: 0.7;
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green),
    inset -3px -3px 0 var(--ink);
}

.cat.on {
  opacity: 1;
  background: var(--green);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo),
    0 0 14px color-mix(in srgb, var(--lime) 35%, transparent);
}

.cat .nf {
  font-size: 0.95rem;
  color: var(--orange);
}

.cat-title {
  font-size: 0.55rem;
}

.cat.on .cat-title {
  color: var(--gold);
}

.count {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0 0.35rem;
  color: var(--ink);
  background: var(--muted);
}

.cat.on .count {
  background: var(--gold);
}
</style>
