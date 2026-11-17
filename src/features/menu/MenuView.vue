<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useGithub } from '@/composables/useGithub'
import { useMenuNav } from '@/composables/useMenuNav'
import { sfx } from '@/composables/useSound'
import { nf } from '@/data/icons'
import { experience, profile } from '@/data/profile'

import ProfileCard from './components/ProfileCard.vue'

const router = useRouter()
const { repos } = useGithub()
const nav = useMenuNav({ count: () => items.value.length, onSelect: go })

const items = computed(() => [
  {
    id: 'memory',
    title: 'MEMORY CARD',
    icon: nf.memory,
    color: 'var(--lime)',
    to: '/memory-card/github',
    desc: 'Projects and career saves.',
    meta: `${repos.value.length || '··'} GitHub saves · ${experience.length} career saves`,
  },
  {
    id: 'system',
    title: 'SYSTEM CONFIGURATION',
    icon: nf.cog,
    color: 'var(--gold)',
    to: '/system/profile',
    desc: 'Profile, stack, links and console settings.',
    meta: profile.focus.join(' · '),
  },
  {
    id: 'music',
    title: 'MUSIC',
    icon: nf.cassette,
    color: 'var(--orange)',
    to: '/music',
    desc: 'LUCKY-MAN walkman with what I am listening to on Last.fm.',
    meta: 'live scrobbles',
  },
  {
    id: 'video',
    title: 'VIDEO',
    icon: nf.tv,
    color: 'var(--cream)',
    to: '/video',
    desc: 'Kamen Rider Black on a big CRT, plus the cookie spy cam.',
    meta: 'Kamen Rider Black · Luckyuro cam',
  },
])

const active = computed(() => items.value[nav.index.value]!)

function go(i: number) {
  const item = items.value[i]
  if (item) router.push(item.to)
}

function click(i: number) {
  nav.index.value = i
  sfx.select()
  go(i)
}
</script>

<template>
  <div class="menu">
    <nav class="list" aria-label="Main menu">
      <button v-for="(item, i) in items" :key="item.id" type="button" class="item"
        :class="{ on: i === nav.index.value }" :style="{ '--c': item.color }" @pointerenter="nav.hover(i)"
        @focus="nav.hover(i)" @click="click(i)">
        <span class="orb"><span class="nf">{{ item.icon }}</span></span>
        <span class="text">
          <span class="title pixel">{{ item.title }}</span>
          <span class="meta">{{ item.meta }}</span>
        </span>
      </button>
    </nav>

    <aside class="side">
      <ProfileCard />
      <Transition name="desc" mode="out-in">
        <p :key="active.id" class="desc" :style="{ '--c': active.color }"><span class="nf">{{ active.icon }}</span> {{ active.desc }}</p>
      </Transition>
    </aside>
  </div>
</template>

<style scoped>
.menu {
  min-height: calc(100vh - var(--bar-h) - var(--hint-h));
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 3rem;
  align-items: center;
  max-width: 1260px;
  margin: 0 auto;
  padding: 2rem 2rem 3rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0.9rem 1.2rem;
  border: 0;
  text-align: left;
  background: transparent;
  color: var(--cream);
  opacity: 0.55;
  transform-origin: left center;
  transition:
    opacity 0.2s,
    transform 0.2s,
    background 0.2s;
}

.item.on {
  opacity: 1;
  transform: scale(1.04) translateX(8px);
  background: linear-gradient(90deg, color-mix(in srgb, var(--lime) 16%, transparent), transparent);
  box-shadow: inset 4px 0 0 var(--c);
}

.orb {
  flex: none;
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 1.6rem;
  color: var(--c);
  background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35), color-mix(in srgb, var(--green) 90%, transparent) 45%, var(--ink));
  box-shadow: 0 0 0 3px var(--ink);
}

.on .orb {
  box-shadow:
    0 0 0 3px var(--ink),
    0 0 26px var(--c);
  animation: pulse 1.6s ease-in-out infinite;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.title {
  font-size: clamp(0.75rem, 1.9vw, 1.05rem);
  text-shadow: 3px 3px 0 var(--ink);
}

.on .title {
  color: var(--c);
}

.meta {
  font-size: 0.78rem;
  color: var(--muted);
}

.side {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.desc {
  margin: 0;
  padding: 0.8rem 1rem;
  border-left: 4px solid var(--c);
  background: color-mix(in srgb, var(--night) 70%, transparent);
  font-size: 1rem;
  line-height: 1.5;
}

.desc .nf {
  color: var(--c);
}

.desc-enter-active,
.desc-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.desc-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.desc-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

@keyframes pulse {
  50% {
    transform: scale(1.06);
  }
}

@media (max-width: 860px) {
  .menu {
    grid-template-columns: 1fr;
    gap: 1.6rem;
    padding: 1.2rem 1rem 2rem;
    align-items: start;
  }

  .side {
    order: -1;
  }

  .item.on {
    transform: none;
  }

  .orb {
    width: 48px;
    height: 48px;
    font-size: 1.3rem;
  }
}
</style>
