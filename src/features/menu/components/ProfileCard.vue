<script setup lang="ts">
import { useGithub } from '@/composables/useGithub'
import { nf } from '@/data/icons'
import { profile } from '@/data/profile'

const { user } = useGithub()
</script>

<template>
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
      <span v-for="d in profile.domains" :key="d.name" class="chip"><span class="nf">{{ d.icon }}</span> {{ d.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 1.7rem 1.8rem;
  background: color-mix(in srgb, var(--ink) 85%, transparent);
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

@media (max-width: 860px) {
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
