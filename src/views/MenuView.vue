<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { nf } from '@/data/icons'
import { profile, experience } from '@/data/profile'
import { useGithub } from '@/composables/useGithub'
import { useMenuNav } from '@/composables/useMenuNav'
import { sfx } from '@/composables/useSound'

const router = useRouter()
const { user, repos } = useGithub()

const items = computed(() => [
  {
    id: 'memory',
    title: 'MEMORY CARD',
    icon: nf.memory,
    color: '#A9DC88',
    to: '/memory-card/github',
    desc: 'Projects and career saves.',
    meta: `${repos.value.length || '··'} GitHub saves · ${experience.length} career saves`,
  },
  {
    id: 'system',
    title: 'SYSTEM CONFIGURATION',
    icon: nf.cog,
    color: '#FEF274',
    to: '/system/profile',
    desc: 'Profile, stack, links and console settings.',
    meta: `${profile.focus.join(' · ')}`,
  },
  {
    id: 'music',
    title: 'MUSIC',
    icon: nf.cassette,
    color: '#CB6E1B',
    to: '/music',
    desc: 'LUCKY-MAN walkman with what I am listening to on Last.fm.',
    meta: 'live scrobbles',
  },
  {
    id: 'video',
    title: 'VIDEO',
    icon: nf.tv,
    color: '#F3EBD3',
    to: '/video',
    desc: 'Kamen Rider Black on a big CRT, plus the cookie spy cam.',
    meta: 'Kamen Rider Black · Luckyuro cam',
  },
])

function go(i: number) {
  const item = items.value[i]
  if (item) router.push(item.to)
}

const nav = useMenuNav({ count: () => items.value.length, onSelect: go })
const active = computed(() => items.value[nav.index.value]!)

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
      <div class="card">
        <div class="who">
          <div class="avatar">
            <img v-if="user" :src="user.avatar_url" :alt="profile.name" />
            <span v-else class="nf">{{ nf.user }}</span>
          </div>
          <div>
            <p class="name pixel">{{ profile.handle }}</p>
            <p class="real">{{ profile.name }}</p>
            <p class="loc"><span class="nf">{{ nf.map }}</span> {{ profile.location }}</p>
          </div>
        </div>
        <p class="headline">{{ profile.headline }} <span class="dim">|</span> {{ profile.focus.join(' · ') }}</p>
        <p class="spec">{{ profile.specialties }}</p>
        <div class="domains">
          <span v-for="d in profile.domains" :key="d.name" class="chip"><span class="nf">{{ d.icon }}</span> {{ d.name
            }}</span>
        </div>
      </div>
      <Transition name="desc" mode="out-in">
        <p :key="active.id" class="desc" :style="{ '--c': active.color }"><span class="nf">{{ active.icon }}</span> {{
          active.desc }}</p>
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
  background: linear-gradient(90deg, rgba(169, 220, 136, 0.16), transparent);
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
  background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35), rgba(44, 90, 68, 0.9) 45%, var(--ink));
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

.card {
  padding: 1.7rem 1.8rem;
  background: rgba(14, 31, 28, 0.85);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 0 0 0 3px var(--green-hi),
    8px 8px 0 3px rgba(0, 0, 0, 0.35);
}

.who {
  display: flex;
  gap: 1.4rem;
  align-items: center;
}

.avatar {
  width: 108px;
  height: 108px;
  flex: none;
  display: grid;
  place-items: center;
  background: var(--green);
  font-size: 2.8rem;
  box-shadow:
    0 0 0 3px var(--ink),
    5px 5px 0 3px var(--orange);
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.name {
  margin: 0;
  font-size: 1.15rem;
  color: var(--lime);
}

.real {
  margin: 0.5rem 0 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.loc {
  margin: 0.25rem 0 0;
  font-size: 0.92rem;
  color: var(--muted);
}

.headline {
  margin: 1.3rem 0 0.5rem;
  font-size: 1.08rem;
  line-height: 1.45;
  font-weight: 700;
  color: var(--cream);
}

.dim {
  color: var(--orange);
}

.spec {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--muted);
}

.domains {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1.2rem;
}

.chip {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  background: var(--green-lo);
  color: var(--gold);
  box-shadow: 0 0 0 2px var(--ink);
}

.desc {
  margin: 0;
  padding: 0.8rem 1rem;
  border-left: 4px solid var(--c);
  background: rgba(13, 26, 26, 0.7);
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

  .card {
    padding: 1.2rem;
  }

  .avatar {
    width: 84px;
    height: 84px;
  }

  .name {
    font-size: 0.95rem;
  }

  .headline {
    font-size: 1rem;
  }
}
</style>
