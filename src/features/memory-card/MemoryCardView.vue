<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResizeObserver } from '@vueuse/core'

import { useGithub } from '@/composables/useGithub'
import { useMenuNav } from '@/composables/useMenuNav'
import { sfx } from '@/composables/useSound'
import { nf } from '@/data/icons'

import MemoryCardIcon from './components/MemoryCardIcon.vue'
import SaveDetail from './components/SaveDetail.vue'
import SaveInfo from './components/SaveInfo.vue'
import SlotTabs from './components/SlotTabs.vue'
import { useSaves } from './composables/useSaves'
import type { Save, Slot } from './saves'

const SLOT_WIDTH = 132

const route = useRoute()
const router = useRouter()
const { loading, error } = useGithub()

const slot = computed<Slot>(() =>
  route.params.slot === 'career' ? 'career' : 'github',
)

const { saves, used } = useSaves(slot)

const grid = ref<HTMLElement>()
const columns = ref(5)
const open = ref<Save | null>(null)

useResizeObserver(grid, ([entry]) => {
  columns.value = Math.max(2, Math.floor((entry?.contentRect.width ?? 600) / SLOT_WIDTH))
})

const nav = useMenuNav({
  count: () => saves.value.length,
  columns: () => columns.value,
  enabled: () => !open.value,
  onSelect: openSave,
  onBack: () => router.push('/menu'),
})

const selected = computed(() => saves.value[nav.index.value] ?? null)

watch(slot, () => {
  nav.index.value = 0
  open.value = null
})

function openSave(index: number) {
  const save = saves.value[index]
  if (!save) return

  nav.index.value = index
  open.value = save
  sfx.open()
}

function close() {
  open.value = null
}

function switchSlot(next: Slot) {
  if (next === slot.value) return

  sfx.select()
  router.replace(`/memory-card/${next}`)
}

function onKey(event: KeyboardEvent) {
  if (open.value && ['Escape', 'Backspace'].includes(event.key)) {
    event.preventDefault()
    event.stopImmediatePropagation()
    sfx.back()
    close()
    return
  }

  if (!open.value && ['1', '2', 'Tab'].includes(event.key)) {
    event.preventDefault()

    const next = event.key === '1'
      ? 'github'
      : event.key === '2'
        ? 'career'
        : slot.value === 'github' ? 'career' : 'github'

    switchSlot(next)
  }
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <div class="mc">
    <SlotTabs :active="slot" :count="saves.length" :used="used" @select="switchSlot" />

    <div class="layout">
      <div ref="grid" class="grid" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
        <p v-if="slot === 'github' && loading" class="state pixel">LOADING MEMORY CARD...</p>
        <p v-else-if="slot === 'github' && error" class="state">
          <span class="nf">{{ nf.save }}</span> {{ error }}
        </p>
        <button v-for="(s, i) in saves" :key="s.id" type="button" class="slot-btn" :aria-label="`${s.label}, ${s.date}`"
          @pointerenter="nav.hover(i)" @focus="nav.hover(i)" @click="openSave(i)">
          <MemoryCardIcon :glyph="s.glyph" :color="s.color" :label="s.label" :badge="s.badge" :media="s.media"
            :selected="i === nav.index.value" />
        </button>
      </div>

      <SaveInfo v-if="selected" :save="selected" @load="openSave(nav.index.value)" />
    </div>

    <SaveDetail :save="open" @close="close" />
  </div>
</template>

<style scoped>
.mc {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.5rem;
  align-items: start;
}

.grid {
  display: grid;
  gap: 0.6rem;
  padding: 1rem;
  min-height: 260px;
  background: color-mix(in srgb, var(--night) 65%, transparent);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 0 0 0 3px var(--green-lo);
}

.state {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 0.7rem;
  color: var(--muted);
  padding: 3rem 0;
  animation: blink 1s steps(1) infinite;
}

.slot-btn {
  border: 0;
  padding: 0;
  background: none;
  color: inherit;
}

@keyframes blink {
  50% {
    opacity: 0.3;
  }
}

@media (max-width: 860px) {
  .mc {
    padding: 1rem 0.8rem 2rem;
  }

  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
