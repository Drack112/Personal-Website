<script setup lang="ts">
import { computed } from 'vue'

import type { GithubUser, Repo } from '@/composables/useGithub'
import { nf } from '@/data/icons'
import { experience, profile } from '@/data/profile'

const TOP_LANGUAGES = 6

const props = defineProps<{
  user: GithubUser | null
  repos: Repo[]
}>()

const stars = computed(() => props.repos.reduce((n, r) => n + r.stargazers_count, 0))

const topLanguages = computed(() => {
  const count = new Map<string, number>()
  for (const r of props.repos) if (r.language) count.set(r.language, (count.get(r.language) ?? 0) + 1)

  const total = [...count.values()].reduce((a, b) => a + b, 0) || 1

  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LANGUAGES)
    .map(([name, n]) => ({ name, pct: Math.round((n / total) * 100) }))
})

const memberSince = computed(() => (props.user ? new Date(props.user.created_at).getFullYear() : '····'))
const yearsCoding = computed(() => new Date().getFullYear() - Number(experience.at(-1)!.start.slice(0, 4)))
</script>

<template>
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
        d.name).join(' · ')}}</p>
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
</template>

<style scoped>
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
  background: color-mix(in srgb, var(--orange) 10%, transparent);
  color: var(--cream);
}

.fan .nf {
  color: var(--orange);
}

.status {
  padding: 0.6rem 0.8rem;
  border-left: 4px solid var(--lime);
  background: color-mix(in srgb, var(--lime) 10%, transparent);
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

@media (max-width: 760px) {
  .profile {
    grid-template-columns: 1fr;
  }

  .lang {
    grid-template-columns: 11ch 1fr 4ch;
  }
}
</style>
