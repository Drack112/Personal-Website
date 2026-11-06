<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'

import { useRoute, useRouter } from 'vue-router'
import RetroWindow from '@/components/ui/RetroWindow.vue'
import BevelButton from '@/components/ui/BevelButton.vue'
import StackTerminal from '@/components/terminal/StackTerminal.vue'
import { nf } from '@/data/icons'
import { experience, profile } from '@/data/profile'
import { useGithub } from '@/composables/useGithub'
import { settings } from '@/composables/useSettings'
import { sfx } from '@/composables/useSound'

const route = useRoute()
const router = useRouter()
const { user, repos } = useGithub()

const TABS = [
  { id: 'profile', label: 'PROFILE', icon: nf.user },
  { id: 'stack', label: 'STACK', icon: nf.code },
  { id: 'links', label: 'LINKS', icon: nf.globe },
  { id: 'settings', label: 'SETTINGS', icon: nf.cog },
] as const
type Tab = (typeof TABS)[number]['id']
const tab = computed<Tab>(() => (TABS.some((t) => t.id === route.params.tab) ? (route.params.tab as Tab) : 'profile'))

function setTab(t: Tab) {
  if (t === tab.value) return
  sfx.select()
  router.replace(`/system/${t}`)
}

const stars = computed(() => repos.value.reduce((n, r) => n + r.stargazers_count, 0))
const topLanguages = computed(() => {
  const count = new Map<string, number>()
  for (const r of repos.value) if (r.language) count.set(r.language, (count.get(r.language) ?? 0) + 1)
  const total = [...count.values()].reduce((a, b) => a + b, 0) || 1
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, n]) => ({ name, pct: Math.round((n / total) * 100) }))
})
const memberSince = computed(() => (user.value ? new Date(user.value.created_at).getFullYear() : '····'))
const yearsCoding = computed(() => new Date().getFullYear() - Number(experience.at(-1)!.start.slice(0, 4)))

const toggles = [
  { key: 'sound', label: 'Sound effects', icon: nf.vol },
  { key: 'crt', label: 'CRT scanlines', icon: nf.crt },
  { key: 'motion', label: 'Animations', icon: nf.sparkle },
  { key: 'trail', label: 'Cursor trail', icon: nf.mouse },
] as const

function flip(key: (typeof toggles)[number]['key']) {
  settings[key].value = !settings[key].value
  sfx.select()
}
function replayBoot() {
  sessionStorage.removeItem('lk.booted')
  router.push('/')
}

function onKey(e: KeyboardEvent) {
  const i = Number(e.key) - 1
  if (i >= 0 && i < TABS.length) setTab(TABS[i]!.id)
  else if (e.key === 'Escape' || e.key === 'Backspace') {
    sfx.back()
    router.push('/menu')
  } else return
  e.preventDefault()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="sys">
    <nav class="tabs" role="tablist">
      <button v-for="(t, i) in TABS" :key="t.id" type="button" role="tab" class="tab" :class="{ on: tab === t.id }"
        :aria-selected="tab === t.id" @click="setTab(t.id)">
        <span class="nf">{{ t.icon }}</span> <span class="pixel">{{ t.label }}</span> <kbd>{{ i + 1 }}</kbd>
      </button>
    </nav>

    <RetroWindow v-if="tab === 'profile'" key="profile" title="SYSTEM · PROFILE" :icon="nf.user">
      <div class="profile">
        <div class="id">
          <div class="avatar">
            <img v-if="user" :src="user.avatar_url" :alt="profile.name" />
          </div>
          <p class="pixel handle">{{ profile.handle }}</p>
          <p class="real">{{ profile.name }}</p>
          <p class="muted"><span class="nf">{{ nf.map }}</span> {{ profile.location }}</p>
          <ul class="numbers">
            <li><b>{{ user?.public_repos ?? '··' }}</b> repos</li>
            <li><b>{{ stars }}</b> stars</li>
            <li><b>{{ user?.followers ?? '··' }}</b> followers</li>
            <li><b>{{ memberSince }}</b> on github</li>
          </ul>
        </div>
        <div class="bio">
          <p class="headline">
            {{ profile.headline }} <span class="sep">|</span> {{ profile.focus.join(' · ') }}
          </p>
          <p class="muted">{{ profile.specialties }} <span class="sep">|</span> {{profile.domains.map((d) =>
            d.name).join(' · ') }}</p>
          <p v-for="p in profile.about" :key="p">{{ p }}</p>
          <p>{{ profile.beyondCode }}</p>
          <p class="fan"><span class="nf">{{ nf.tv }}</span> {{ profile.fan }}</p>
          <p class="status"><span class="nf">{{ nf.bell }}</span> {{ profile.status }}</p>

          <h3 class="pixel sub">BIOS · LANGUAGES</h3>
          <div class="langs">
            <div v-for="l in topLanguages" :key="l.name" class="lang">
              <span class="lname">{{ l.name }}</span>
              <span class="bar"><i :style="{ width: `${l.pct}%` }" /></span>
              <span class="pct">{{ l.pct }}%</span>
            </div>
          </div>
          <p class="muted small">{{ yearsCoding }}+ years shipping backend systems · share of public GitHub repos by
            language</p>
        </div>
      </div>
    </RetroWindow>

    <RetroWindow v-else-if="tab === 'stack'" key="stack" title="drack112@portfolio: ~" :icon="nf.tux"
      accent="var(--orange)">
      <StackTerminal />
    </RetroWindow>

    <RetroWindow v-else-if="tab === 'links'" key="links" title="SYSTEM · LINKS" :icon="nf.globe" accent="var(--gold)">
      <div class="links">
        <a class="link gh" :href="profile.links.github" target="_blank" rel="noopener" @click="sfx.select()">
          <span class="nf link-icon">{{ nf.github }}</span>
          <span class="link-name pixel">GITHUB</span>
          <span class="link-handle">@{{ profile.handle }}</span>
          <span class="link-meta">{{ user?.public_repos ?? '··' }} repos · {{ user?.followers ?? '··' }} followers</span>
          <span class="link-go">OPEN ▸</span>
        </a>
        <a class="link in" :href="profile.links.linkedin" target="_blank" rel="noopener" @click="sfx.select()">
          <span class="nf link-icon">{{ nf.linkedin }}</span>
          <span class="link-name pixel">LINKEDIN</span>
          <span class="link-handle">{{ profile.name }}</span>
          <span class="link-meta">{{ profile.headline }} · {{ profile.focus.slice(0, 3).join(' · ') }}</span>
          <span class="link-go">OPEN ▸</span>
        </a>
      </div>
    </RetroWindow>

    <RetroWindow v-else key="settings" title="SYSTEM · CONSOLE SETTINGS" :icon="nf.cog" accent="var(--cream)">
      <ul class="toggles">
        <li v-for="t in toggles" :key="t.key">
          <span class="nf ticon">{{ t.icon }}</span>
          <span class="tlabel">{{ t.label }}</span>
          <button type="button" class="switch" :class="{ on: settings[t.key].value }"
            :aria-pressed="settings[t.key].value" @click="flip(t.key)">
            <span>{{ settings[t.key].value ? 'ON' : 'OFF' }}</span>
          </button>
        </li>
        <li>
          <span class="nf ticon">{{ nf.vol }}</span>
          <label class="tlabel" for="vol">Volume</label>
          <input id="vol" v-model.number="settings.volume.value" type="range" min="0" max="1" step="0.1"
            @change="sfx.move()" />
        </li>
      </ul>
      <BevelButton :icon="nf.refresh" variant="orange" @click="replayBoot">REPLAY BOOT</BevelButton>
    </RetroWindow>
  </div>
</template>

<style scoped>
.sys {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
}

.tabs {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border: 0;
  color: var(--cream);
  background: var(--green-lo);
  opacity: 0.65;
  font-size: 0.62rem;
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green),
    inset -3px -3px 0 var(--ink);
}

.tab .nf {
  font-size: 0.95rem;
}

.tab.on {
  opacity: 1;
  background: var(--green);
  color: var(--gold);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo);
}

kbd {
  font-family: var(--font-ui);
  font-size: 0.6rem;
  color: var(--muted);
  border: 1px solid var(--green-hi);
  padding: 0 3px;
}

.profile {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 2rem;
}

.id {
  text-align: center;
}

.avatar {
  width: 140px;
  height: 140px;
  margin: 0.4rem auto 1rem;
  background: var(--green);
  box-shadow:
    0 0 0 3px var(--ink),
    6px 6px 0 3px var(--orange);
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.handle {
  margin: 0;
  font-size: 0.8rem;
  color: var(--lime);
}

.real {
  margin: 0.4rem 0 0;
  font-weight: 700;
}

.muted {
  color: var(--muted);
}

.small {
  font-size: 0.78rem;
}

.numbers {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--muted);
}

.numbers li {
  padding: 0.4rem;
  background: var(--green-lo);
  box-shadow: 0 0 0 2px var(--ink);
}

.numbers b {
  display: block;
  font-size: 1rem;
  color: var(--gold);
}

.bio p {
  margin: 0 0 0.8rem;
}

.headline {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cream);
}

.sep {
  color: var(--orange);
}

.fan {
  padding: 0.6rem 0.8rem;
  border-left: 4px solid var(--orange);
  background: rgba(203, 110, 27, 0.1);
  color: var(--cream);
}

.fan .nf {
  color: var(--orange);
}

.status {
  padding: 0.6rem 0.8rem;
  border-left: 4px solid var(--lime);
  background: rgba(169, 220, 136, 0.1);
  color: var(--lime);
}

.sub {
  margin: 1.4rem 0 0.8rem;
  font-size: 0.65rem;
  color: var(--gold);
}

.langs {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 0.6rem;
}

.lang {
  display: grid;
  grid-template-columns: 15ch 1fr 4ch;
  gap: 0.8rem;
  align-items: center;
  font-size: 0.82rem;
}

.bar {
  height: 12px;
  background: var(--ink);
  box-shadow: 0 0 0 2px var(--green-hi);
}

.bar i {
  display: block;
  height: 100%;
  background: repeating-linear-gradient(90deg, var(--lime) 0 8px, var(--green-hi) 8px 10px);
}

.pct {
  text-align: right;
  color: var(--gold);
}

/* GitHub and LinkedIn as two big cards, lit up on hover and keyboard focus */
.links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.4rem;
}

.link {
  --c: var(--orange);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.8rem 1.2rem 1.4rem;
  text-align: center;
  text-decoration: none;
  color: var(--cream);
  background: linear-gradient(160deg, rgba(71, 143, 98, 0.22), rgba(14, 31, 28, 0.9));
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo),
    6px 6px 0 3px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.link.in {
  --c: var(--teal);
}

.link:hover,
.link:focus-visible {
  outline: none;
  transform: translateY(-4px);
  box-shadow:
    0 0 0 3px var(--ink),
    0 0 0 6px var(--c),
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo),
    0 0 36px color-mix(in srgb, var(--c) 45%, transparent);
}

.link-icon {
  font-size: 3.2rem;
  color: var(--c);
  text-shadow: 3px 3px 0 var(--ink);
}

.link-name {
  font-size: 1rem;
}

.link-handle {
  font-weight: 700;
  color: var(--gold);
}

.link-meta {
  font-size: 0.8rem;
  color: var(--muted);
}

.link-go {
  margin-top: 0.6rem;
  padding: 0.25rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--ink);
  background: var(--c);
  box-shadow: 0 0 0 2px var(--ink);
}

.toggles {
  list-style: none;
  padding: 0;
  margin: 0 0 1.6rem;
  display: grid;
  gap: 0.8rem;
  max-width: 460px;
}

.toggles li {
  display: grid;
  grid-template-columns: 2ch 1fr auto;
  gap: 0.8rem;
  align-items: center;
}

.ticon {
  color: var(--lime);
}

.switch {
  width: 70px;
  border: 0;
  padding: 0.3rem 0;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--cream);
  background: var(--green-lo);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--ink);
}

.switch.on {
  color: var(--ink);
  background: var(--lime);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 #cbedb3,
    inset -3px -3px 0 #478f62;
}

input[type='range'] {
  accent-color: var(--orange);
  width: 140px;
}

@media (max-width: 760px) {
  .sys {
    padding: 1rem 0.8rem 2rem;
  }

  .profile {
    grid-template-columns: 1fr;
  }

  .lang {
    grid-template-columns: 11ch 1fr 4ch;
  }

  kbd {
    display: none;
  }
}
</style>
