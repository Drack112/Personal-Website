<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import RetroWindow from '@/components/ui/RetroWindow.vue'
import { useGithub } from '@/composables/useGithub'
import { sfx } from '@/composables/useSound'
import { nf } from '@/data/icons'

import LinksPanel from './components/LinksPanel.vue'
import ProfilePanel from './components/ProfilePanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import StackTerminal from './components/StackTerminal.vue'

const TABS = [
  { id: 'profile', label: 'PROFILE', icon: nf.user },
  { id: 'stack', label: 'STACK', icon: nf.code },
  { id: 'links', label: 'LINKS', icon: nf.globe },
  { id: 'settings', label: 'SETTINGS', icon: nf.cog },
] as const

type Tab = (typeof TABS)[number]['id']

const route = useRoute()
const router = useRouter()
const { user, repos } = useGithub()

const tab = computed<Tab>(() => (TABS.some((t) => t.id === route.params.tab) ? (route.params.tab as Tab) : 'profile'))

function setTab(t: Tab) {
  if (t === tab.value) return
  sfx.select()
  router.replace(`/system/${t}`)
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
      <ProfilePanel :user="user" :repos="repos" />
    </RetroWindow>

    <RetroWindow v-else-if="tab === 'stack'" key="stack" title="drack112@portfolio: ~" :icon="nf.tux"
      accent="var(--orange)">
      <StackTerminal />
    </RetroWindow>

    <RetroWindow v-else-if="tab === 'links'" key="links" title="SYSTEM · LINKS" :icon="nf.globe" accent="var(--gold)">
      <LinksPanel :user="user" />
    </RetroWindow>

    <RetroWindow v-else key="settings" title="SYSTEM · CONSOLE SETTINGS" :icon="nf.cog" accent="var(--cream)">
      <SettingsPanel />
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

.tab.on {
  opacity: 1;
  background: var(--green);
  color: var(--gold);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--green-hi),
    inset -3px -3px 0 var(--green-lo);
}

.tab .nf {
  font-size: 0.95rem;
}

kbd {
  font-family: var(--font-ui);
  font-size: 0.6rem;
  color: var(--muted);
  border: 1px solid var(--green-hi);
  padding: 0 3px;
}

@media (max-width: 760px) {
  .sys {
    padding: 1rem 0.8rem 2rem;
  }

  kbd {
    display: none;
  }
}
</style>
