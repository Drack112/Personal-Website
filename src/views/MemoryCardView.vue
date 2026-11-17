<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import dayjs from 'dayjs'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MemoryCardIcon, { type Media } from '@/components/memory-card/MemoryCardIcon.vue'
import RetroWindow from '@/components/ui/RetroWindow.vue'
import BevelButton from '@/components/ui/BevelButton.vue'
import { nf, languageIcon, fallbackIcon } from '@/data/icons'
import { experience, featuredRepos, profile, type Experience } from '@/data/profile'
import { useGithub, type Repo } from '@/composables/useGithub'
import { useMenuNav } from '@/composables/useMenuNav'
import { sfx } from '@/composables/useSound'

const route = useRoute()
const router = useRouter()
const { repos, loading, error } = useGithub()

type Slot = 'github' | 'career'

interface Save {
  id: string
  label: string
  glyph: string
  color: string
  badge?: string
  media?: Media
  date: string
  size: string
  repo?: Repo
  job?: Experience
}

const MEDIA: Media[] = ['tape', 'cart', 'disc', 'floppy']

const slot = computed<Slot>(() =>
  route.params.slot === 'career' ? 'career' : 'github',
)

const ym = (value: string) => dayjs(value).format('MMM YYYY')

const stamp = (value: string) => dayjs(value).format('YYYY/MM/DD')

const months = (start: string, end: string | null) => {
  const total = (end ? dayjs(end) : dayjs()).diff(start, 'month') + 1
  const years = Math.floor(total / 12)
  const remaining = total % 12

  return [
    years && `${years} yr${years > 1 ? 's' : ''}`,
    remaining && `${remaining} mo${remaining > 1 ? 's' : ''}`,
  ].filter(Boolean).join(' ')
}

const kb = (size: number) =>
  size >= 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`

const featuredOrder = Object.keys(featuredRepos)

const githubSaves = computed<Save[]>(() =>
  [...repos.value]
    .sort((a, b) => {
      const ai = featuredOrder.indexOf(a.name)
      const bi = featuredOrder.indexOf(b.name)

      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
      }

      return b.pushed_at.localeCompare(a.pushed_at)
    })
    .map((repo) => {
      const icon = languageIcon[repo.language ?? ''] || fallbackIcon

      return {
        id: repo.name,
        label: repo.name.replaceAll('-', ' '),
        glyph: icon.glyph,
        color: icon.color,
        badge: repo.stargazers_count ? `★${repo.stargazers_count}` : undefined,
        date: stamp(repo.pushed_at),
        size: kb(repo.size),
        repo,
      }
    }),
)

const careerSaves = computed<Save[]>(() =>
  experience.map((job, index) => ({
    id: job.id,
    label: job.company,
    glyph: job.icon,
    color: job.color,
    media: MEDIA[index % MEDIA.length],
    badge: job.end ? undefined : 'NOW',
    date: `${ym(job.start)} – ${job.end ? ym(job.end) : 'present'}`,
    size: months(job.start, job.end),
    job,
  })),
)

const saves = computed(() =>
  slot.value === 'github' ? githubSaves.value : careerSaves.value,
)

const used = computed(() =>
  slot.value === 'github'
    ? `${kb(repos.value.reduce((total, repo) => total + repo.size, 0))} used`
    : `${months(experience[experience.length - 1]?.start ?? '', null)} of saves`,
)

const grid = ref<HTMLElement>()
const columns = ref(5)

useResizeObserver(grid, ([entry]) => {
  columns.value = Math.max(2, Math.floor((entry?.contentRect.width ?? 600) / 132))
})

const open = ref<Save | null>(null)

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
    <div class="slots" role="tablist">
      <button v-for="s in (['github', 'career'] as const)" :key="s" type="button" role="tab" class="card-tab"
        :class="{ on: slot === s }" :aria-selected="slot === s" @click="switchSlot(s)">
        <span class="chip" aria-hidden="true"><i v-for="n in 6" :key="n" /></span>
        <span class="tab-text">
          <span class="pixel">MEMORY CARD {{ s === 'github' ? '1' : '2' }}</span>
          <span class="tab-sub"><span class="nf">{{ s === 'github' ? nf.github : nf.briefcase }}</span> {{ s ===
            'github' ? 'GitHub' : 'Career' }}</span>
        </span>
      </button>
      <span class="used">{{ saves.length }} saves · {{ used }}</span>
    </div>

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

      <aside v-if="selected" class="info">
        <p class="info-title pixel">{{ selected.label }}</p>
        <dl>
          <div>
            <dt>{{ slot === 'github' ? 'last save' : 'period' }}</dt>
            <dd>{{ selected.date }}</dd>
          </div>
          <div>
            <dt>{{ slot === 'github' ? 'size' : 'time' }}</dt>
            <dd>{{ selected.size }}</dd>
          </div>
          <div v-if="selected.repo">
            <dt>lang</dt>
            <dd>{{ selected.repo.language || '—' }}</dd>
          </div>
          <div v-if="selected.job">
            <dt>role</dt>
            <dd>{{ selected.job.role }}</dd>
          </div>
        </dl>
        <p class="info-desc">
          {{ selected.repo ? featuredRepos[selected.repo.name] || selected.repo.description || 'No description.' :
            selected.job?.summary || selected.job?.domain }}
        </p>
        <BevelButton variant="orange" small :icon="nf.save" @click="openSave(nav.index.value)">LOAD SAVE</BevelButton>
      </aside>
    </div>

    <Transition name="overlay">
      <div v-if="open" class="overlay" @click.self="close">
        <RetroWindow class="detail" :title="open.repo ? open.repo.name : `${open.job!.company} · ${open.job!.role}`"
          :icon="open.glyph" :accent="open.color" closable @close="close">
          <template v-if="open.repo">
            <p class="lead">{{ featuredRepos[open.repo.name] || open.repo.description || 'No description yet.' }}</p>
            <p v-if="featuredRepos[open.repo.name] && open.repo.description" class="gh-desc">“{{ open.repo.description
              }}”</p>
            <ul class="stats">
              <li><span class="nf">{{ open.glyph }}</span> {{ open.repo.language || 'mixed' }}</li>
              <li><span class="nf">{{ nf.star }}</span> {{ open.repo.stargazers_count }}</li>
              <li><span class="nf">{{ nf.fork }}</span> {{ open.repo.forks_count }}</li>
              <li><span class="nf">{{ nf.save }}</span> {{ kb(open.repo.size) }}</li>
              <li><span class="nf">{{ nf.clock }}</span> created {{ stamp(open.repo.created_at) }}</li>
            </ul>
            <div v-if="open.repo.topics.length" class="tags">
              <span v-for="t in open.repo.topics" :key="t">#{{ t }}</span>
            </div>
            <div class="actions">
              <BevelButton :href="open.repo.html_url" :icon="nf.github" variant="orange">OPEN ON GITHUB</BevelButton>
              <BevelButton v-if="open.repo.homepage" :href="open.repo.homepage" :icon="nf.external">HOMEPAGE
              </BevelButton>
            </div>
          </template>

          <template v-else-if="open.job">
            <p class="lead">
              <b>{{ open.job.role }}</b> at <b>{{ open.job.company }}</b>
            </p>
            <ul class="stats">
              <li><span class="nf">{{ nf.clock }}</span> {{ open.date }} · {{ open.size }}</li>
              <li><span class="nf">{{ nf.map }}</span> {{ open.job.place }} · {{ open.job.mode }}</li>
              <li><span class="nf">{{ open.job.icon }}</span> {{ open.job.domain }}</li>
            </ul>
            <p v-if="open.job.summary" class="gh-desc">{{ open.job.summary }}</p>
            <ul v-if="open.job.highlights.length" class="highlights">
              <li v-for="h in open.job.highlights" :key="h">{{ h }}</li>
            </ul>
            <p v-else class="gh-desc">Current position. More saves coming soon.</p>
            <div v-if="open.job.stack.length" class="tags">
              <span v-for="t in open.job.stack" :key="t">{{ t }}</span>
            </div>
            <div class="actions">
              <BevelButton :href="profile.links.linkedin" :icon="nf.linkedin" variant="orange">LINKEDIN</BevelButton>
            </div>
          </template>
        </RetroWindow>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mc {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
}

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
    0 0 18px rgba(169, 220, 136, 0.35);
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
  background: rgba(13, 26, 26, 0.65);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 0 0 0 3px var(--green-lo);
}

.slot-btn {
  border: 0;
  padding: 0;
  background: none;
  color: inherit;
}

.state {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 0.7rem;
  color: var(--muted);
  padding: 3rem 0;
  animation: blink 1s steps(1) infinite;
}

.info {
  position: sticky;
  top: calc(var(--bar-h) + 1rem);
  padding: 1rem 1.1rem 1.2rem;
  background: rgba(14, 31, 28, 0.9);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 0 0 0 3px var(--green-hi),
    8px 8px 0 3px rgba(0, 0, 0, 0.35);
}

.info-title {
  margin: 0 0 0.8rem;
  font-size: 0.7rem;
  color: var(--lime);
  line-height: 1.7;
}

dl {
  margin: 0 0 0.8rem;
  display: grid;
  gap: 0.25rem;
  font-size: 0.82rem;
}

dl div {
  display: flex;
  gap: 0.6rem;
}

dt {
  width: 10ch;
  flex: none;
  color: var(--muted);
}

dd {
  margin: 0;
  color: var(--cream);
}

.info-desc {
  font-size: 0.85rem;
  color: var(--cream);
  margin: 0 0 1rem;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: calc(var(--bar-h) + 1rem) 1rem calc(var(--hint-h) + 1rem);
  background: rgba(6, 17, 16, 0.7);
}

.detail {
  width: min(720px, 100%);
  max-height: 100%;
  overflow: auto;
}

.lead {
  margin: 0 0 0.6rem;
  font-size: 1rem;
  color: var(--cream);
}

.lead b {
  color: var(--gold);
}

.gh-desc {
  margin: 0 0 0.9rem;
  color: var(--muted);
  font-size: 0.88rem;
}

.stats {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.2rem;
  padding: 0;
  margin: 0 0 1rem;
  font-size: 0.85rem;
}

.stats .nf {
  color: var(--lime);
}

.highlights {
  margin: 0 0 1rem;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.45rem;
  font-size: 0.88rem;
}

.highlights li::marker {
  content: '→ ';
  color: var(--orange);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.2rem;
}

.tags span {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  background: var(--green-lo);
  color: var(--gold);
  box-shadow: 0 0 0 2px var(--ink);
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
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

  .info {
    position: static;
    order: -1;
  }

  .used {
    margin-left: 0;
    width: 100%;
  }
}
</style>
