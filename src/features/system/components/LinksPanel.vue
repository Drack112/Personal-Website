<script setup lang="ts">
import type { GithubUser } from '@/composables/useGithub'
import { sfx } from '@/composables/useSound'
import { nf } from '@/data/icons'
import { profile } from '@/data/profile'

defineProps<{
  user: GithubUser | null
}>()
</script>

<template>
  <div class="links">
    <a class="link gh" :href="profile.links.github" target="_blank" rel="noopener" @click="sfx.select()">
      <span class="nf link-icon">{{ nf.github }}</span>
      <span class="link-name pixel">GITHUB</span>
      <span class="link-handle">@{{ profile.handle }}</span>
      <span class="link-meta">{{ user?.public_repos ?? '··' }} repos · {{ user?.followers ?? '··' }}
        followers</span>
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
</template>

<style scoped>
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
  background: linear-gradient(160deg, color-mix(in srgb, var(--green-hi) 22%, transparent), color-mix(in srgb, var(--ink) 90%, transparent));
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
</style>
