<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { sfx } from '@/composables/useSound'
import { setTheme } from '@/composables/useTheme'
import { overlayOpen } from '@/composables/useUi'
import { nf } from '@/data/icons'

import CategoryNav from './components/CategoryNav.vue'
import CrtTv from './components/CrtTv.vue'
import TvGuide from './components/TvGuide.vue'
import { useVideoCatalog } from './composables/useVideoCatalog'

const route = useRoute()
const router = useRouter()
const categories = useVideoCatalog()

const crt = ref<InstanceType<typeof CrtTv>>()
const catIndex = computed(() => Math.max(0, categories.value.findIndex((c) => c.id === route.params.cat)))
const category = computed(() => categories.value[catIndex.value]!)
const itemIndex = ref(0)
const current = computed(() => category.value.items[itemIndex.value] ?? category.value.items[0]!)
const playing = ref(false)
const powered = ref(false)

watch(catIndex, () => (itemIndex.value = 0))
watch([current, playing, powered], ([item, isPlaying, isOn]) => {
  if (!item.theme || !isOn) setTheme('original')
  else if (isPlaying) setTheme(item.theme)
})
watch(() => route.query.play, () => nextTick(autoplay))

function setCategory(i: number) {
  const next = categories.value[(i + categories.value.length) % categories.value.length]!
  if (next.id === category.value.id) return
  sfx.select()
  router.replace(`/video/${next.id}`)
}

function setItem(i: number) {
  const n = category.value.items.length
  itemIndex.value = (i + n) % n
}

function step(delta: number) {
  setItem(itemIndex.value + delta)
}

function onKey(e: KeyboardEvent) {
  if (overlayOpen.value) return
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  switch (e.key) {
    case 'Escape':
    case 'Backspace':
      sfx.back()
      router.push('/menu')
      break
    case 'ArrowRight':
      step(1)
      break
    case 'ArrowLeft':
      step(-1)
      break
    case 'ArrowDown':
      setCategory(catIndex.value + 1)
      break
    case 'ArrowUp':
      setCategory(catIndex.value - 1)
      break
    case 'p':
    case 'P':
      crt.value?.power()
      break
    default:
      return
  }
  e.preventDefault()
}

function autoplay() {
  if (route.query.play !== '1') return
  crt.value?.turnOn()
  router.replace({ query: {} })
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  autoplay()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  setTheme('original')
})
</script>

<template>
  <div class="video">
    <CategoryNav :categories="categories" :active="category" @select="setCategory" />

    <header class="now">
      <h2 class="pixel">{{ category.title }}</h2>
      <span class="sub">{{ category.subtitle }}</span>
      <a v-if="category.link" class="pl" :href="category.link" target="_blank" rel="noopener">{{ category.linkLabel
      }} <span class="nf">{{ nf.external }}</span></a>
    </header>

    <div class="layout">
      <section class="screen-col" aria-live="polite">
        <CrtTv ref="crt" :item="current.screen" @step="step" @playing="playing = $event" @power="powered = $event" />
      </section>

      <TvGuide :category="category" :active="itemIndex" @select="setItem" />
    </div>

    <p class="credit">
      <template v-if="category.via">▶ {{ category.via.text }} <a :href="category.via.url" target="_blank"
          rel="noopener">{{ category.via.name }}</a> on YouTube · </template>
      full credits under the <b class="bang">!</b> button
    </p>
  </div>
</template>

<style scoped>
.video {
  max-width: 1520px;
  margin: 0 auto;
  padding: 1.4rem 1.5rem 3rem;
}

.now {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-bottom: 0.9rem;
}

.now h2 {
  margin: 0;
  font-size: 0.85rem;
  color: var(--gold);
  text-shadow: 2px 2px 0 var(--ink);
}

.sub {
  font-size: 0.8rem;
  color: var(--muted);
}

.pl {
  margin-left: auto;
  font-size: 0.78rem;
}

.layout {
  --guide-w: 320px;
  --gap: 1.6rem;
  --tv-w: calc(100cqw - var(--guide-w) - var(--gap));
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--guide-w);
  gap: var(--gap);
  align-items: start;
}

.credit {
  margin: 1rem 0 0;
  font-size: 0.72rem;
  color: var(--muted);
}

.bang {
  display: inline-grid;
  place-items: center;
  width: 1.3em;
  height: 1.3em;
  border-radius: 50%;
  color: var(--ink);
  background: var(--gold);
}

@media (max-width: 960px) {
  .video {
    padding: 1rem 0.8rem 2rem;
  }

  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
