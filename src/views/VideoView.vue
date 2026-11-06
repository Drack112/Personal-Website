<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CrtTv, { type ScreenItem } from '@/components/crt/CrtTv.vue'
import { nf } from '@/data/icons'
import { clips } from '@/data/clips'
import { playlistUrl, tokusato, videoCategories } from '@/data/tokusato'
import { midnightMix } from '@/data/mix'
import { overlayOpen } from '@/composables/useUi'
import { requests } from '@/composables/useRequests'
import { sfx } from '@/composables/useSound'

interface GuideItem {
  screen: ScreenItem
  num: string
  title: string
  thumb?: string
}
interface Category {
  id: string
  title: string
  subtitle: string
  icon: string
  link?: string
  linkLabel?: string
  via?: { name: string; url: string; text: string }
  items: GuideItem[]
}

const pad = (n: number) => String(n).padStart(2, '0')

const fixed: Category[] = [
  ...videoCategories.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    icon: nf.tv,
    link: playlistUrl(c),
    linkLabel: 'playlist',
    via: { name: tokusato.channel, url: tokusato.channelUrl, text: 'via' },
    items: c.items.map((e) => ({
      num: `EP${pad(e.ep)}`,
      title: e.title,
      thumb: `https://i.ytimg.com/vi/${e.id}/mqdefault.jpg`,
      screen: { kind: 'youtube' as const, key: e.id, id: e.id, ep: e.ep, playlistId: c.playlistId, title: e.title, label: `EP ${pad(e.ep)}`, fill: c.pillarboxed },
    })),
  })),
  {
    id: 'midnight-mix',
    title: 'MIDNIGHT MIX',
    subtitle: 'late-night music for code projects',
    icon: nf.music,
    link: midnightMix.url,
    linkLabel: 'youtube',
    via: { name: midnightMix.channel, url: midnightMix.channelUrl, text: 'my own mix by' },
    items: [
      {
        num: 'MIX',
        title: midnightMix.title,
        thumb: `https://i.ytimg.com/vi/${midnightMix.id}/mqdefault.jpg`,
        screen: { kind: 'youtube' as const, key: midnightMix.id, id: midnightMix.id, ep: 1, playlistId: '', title: midnightMix.title, label: 'MIX' },
      },
    ],
  },
  {
    id: 'luckyuro-cam',
    title: 'LUCKYURO CAM',
    subtitle: 'cookie spy clips',
    icon: nf.cookie,
    items: clips.map((c, i) => ({
      num: `CLIP${pad(i + 1)}`,
      title: `Luckyuro clip ${pad(i + 1)}`,
      screen: { kind: 'image' as const, key: c.name, url: c.url, title: `Luckyuro clip ${pad(i + 1)}`, label: `CH ${pad(i + 1)}` },
    })),
  },
]

// songs sent from the walkman, as their own channel while there are any
const categories = computed<Category[]>(() =>
  requests.value.length
    ? [
      ...fixed,
      {
        id: 'requests',
        title: 'WALKMAN REQUESTS',
        subtitle: 'full songs picked on the walkman',
        icon: nf.cassette,
        items: requests.value.map((r, i) => ({
          num: `REQ${pad(i + 1)}`,
          title: `${r.name} · ${r.artist}`,
          thumb: `https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`,
          screen: { kind: 'youtube' as const, key: r.id, id: r.id, ep: 1, playlistId: '', title: `${r.name} · ${r.artist}`, label: `REQ ${pad(i + 1)}` },
        })),
      },
    ]
    : fixed,
)

const route = useRoute()
const router = useRouter()
const crt = ref<InstanceType<typeof CrtTv>>()

const catIndex = computed(() => Math.max(0, categories.value.findIndex((c) => c.id === route.params.cat)))
const category = computed(() => categories.value[catIndex.value]!)
const itemIndex = ref(0)
const current = computed(() => category.value.items[itemIndex.value] ?? category.value.items[0]!)

watch(catIndex, () => (itemIndex.value = 0))

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

// keep the active guide entry in view
const guide = ref<HTMLElement>()
watch([itemIndex, catIndex], () => {
  requestAnimationFrame(() => guide.value?.querySelector('.on')?.scrollIntoView({ block: 'nearest' }))
})

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
// `?play=1` (from the terminal) switches the TV on, also when this screen is
// already open and only the route changes
function autoplay() {
  if (route.query.play !== '1') return
  crt.value?.turnOn()
  router.replace({ query: {} })
}
watch(() => route.query.play, () => nextTick(autoplay))
onMounted(() => {
  window.addEventListener('keydown', onKey)
  autoplay()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="video">
    <nav class="cats" aria-label="Video categories">
      <button v-for="(c, i) in categories" :key="c.id" type="button" class="cat" :class="{ on: i === catIndex }"
        :aria-current="i === catIndex" @click="setCategory(i)">
        <span class="nf">{{ c.icon }}</span>
        <span class="cat-title pixel">{{ c.title }}</span>
        <span class="count">{{ c.items.length }}</span>
      </button>
    </nav>

    <header class="now">
      <h2 class="pixel">{{ category.title }}</h2>
      <span class="sub">{{ category.subtitle }}</span>
      <a v-if="category.link" class="pl" :href="category.link" target="_blank" rel="noopener">{{ category.linkLabel
      }} <span class="nf">{{ nf.external }}</span></a>
    </header>

    <div class="layout">
      <section class="screen-col" aria-live="polite">
        <CrtTv ref="crt" :item="current.screen" @step="step" />
      </section>

      <aside class="guide-col">
        <h3 class="pixel guide-head"><span class="nf">{{ nf.clock }}</span> TV GUIDE</h3>
        <ol ref="guide" class="guide">
          <li v-for="(it, i) in category.items" :key="it.screen.key">
            <button type="button" :class="{ on: i === itemIndex }" :aria-current="i === itemIndex" @click="setItem(i)">
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

.cats {
  display: flex;
  gap: 0.7rem;
  overflow-x: auto;
  padding: 4px 4px 12px;
  margin-bottom: 1rem;
  scrollbar-width: thin;
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

.cat .nf {
  font-size: 0.95rem;
  color: var(--orange);
}

.cat-title {
  font-size: 0.55rem;
}

.count {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0 0.35rem;
  color: var(--ink);
  background: var(--muted);
}

.cat.on {
  opacity: 1;
  background: var(--green);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo),
    0 0 14px rgba(169, 220, 136, 0.35);
}

.cat.on .cat-title {
  color: var(--gold);
}

.cat.on .count {
  background: var(--gold);
}

.layout {
  --guide-w: 320px;
  --gap: 1.6rem;
  /* width of the TV art; the guide lines up with its cabinet (art rows 44-236 of 256 wide) */
  --tv-w: calc(100cqw - var(--guide-w) - var(--gap));
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--guide-w);
  gap: var(--gap);
  align-items: start;
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

.guide-col {
  display: flex;
  flex-direction: column;
  margin-top: calc(var(--tv-w) * 44 / 256);
  height: calc(var(--tv-w) * 192 / 256);
  min-height: 320px;
  padding: 0.8rem;
  background: rgba(14, 31, 28, 0.88);
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
  .video {
    padding: 1rem 0.8rem 2rem;
  }

  .layout {
    grid-template-columns: 1fr;
  }

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
