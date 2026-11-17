<script setup lang="ts">
import BevelButton from '@/components/ui/BevelButton.vue'
import RetroWindow from '@/components/ui/RetroWindow.vue'
import { nf } from '@/data/icons'
import { featuredRepos, profile } from '@/data/profile'

import { kb, stamp, type Save } from '../saves'

defineProps<{ save: Save | null }>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Transition name="overlay">
    <div v-if="save" class="overlay" @click.self="emit('close')">
      <RetroWindow class="detail" :title="save.repo ? save.repo.name : `${save.job!.company} · ${save.job!.role}`"
        :icon="save.glyph" :accent="save.color" closable @close="emit('close')">
        <template v-if="save.repo">
          <p class="lead">{{ featuredRepos[save.repo.name] || save.repo.description || 'No description yet.' }}</p>
          <p v-if="featuredRepos[save.repo.name] && save.repo.description" class="gh-desc">“{{ save.repo.description }}”</p>
          <ul class="stats">
            <li><span class="nf">{{ save.glyph }}</span> {{ save.repo.language || 'mixed' }}</li>
            <li><span class="nf">{{ nf.star }}</span> {{ save.repo.stargazers_count }}</li>
            <li><span class="nf">{{ nf.fork }}</span> {{ save.repo.forks_count }}</li>
            <li><span class="nf">{{ nf.save }}</span> {{ kb(save.repo.size) }}</li>
            <li><span class="nf">{{ nf.clock }}</span> created {{ stamp(save.repo.created_at) }}</li>
          </ul>
          <div v-if="save.repo.topics.length" class="tags">
            <span v-for="t in save.repo.topics" :key="t">#{{ t }}</span>
          </div>
          <div class="actions">
            <BevelButton :href="save.repo.html_url" :icon="nf.github" variant="orange">OPEN ON GITHUB</BevelButton>
            <BevelButton v-if="save.repo.homepage" :href="save.repo.homepage" :icon="nf.external">HOMEPAGE</BevelButton>
          </div>
        </template>

        <template v-else-if="save.job">
          <p class="lead">
            <b>{{ save.job.role }}</b> at <b>{{ save.job.company }}</b>
          </p>
          <ul class="stats">
            <li><span class="nf">{{ nf.clock }}</span> {{ save.date }} · {{ save.size }}</li>
            <li><span class="nf">{{ nf.map }}</span> {{ save.job.place }} · {{ save.job.mode }}</li>
            <li><span class="nf">{{ save.job.icon }}</span> {{ save.job.domain }}</li>
          </ul>
          <p v-if="save.job.summary" class="gh-desc">{{ save.job.summary }}</p>
          <ul v-if="save.job.highlights.length" class="highlights">
            <li v-for="h in save.job.highlights" :key="h">{{ h }}</li>
          </ul>
          <p v-else class="gh-desc">Current position. More saves coming soon.</p>
          <div v-if="save.job.stack.length" class="tags">
            <span v-for="t in save.job.stack" :key="t">{{ t }}</span>
          </div>
          <div class="actions">
            <BevelButton :href="profile.links.linkedin" :icon="nf.linkedin" variant="orange">LINKEDIN</BevelButton>
          </div>
        </template>
      </RetroWindow>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: calc(var(--bar-h) + 1rem) 1rem calc(var(--hint-h) + 1rem);
  background: rgba(6, 17, 16, 0.7);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
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
</style>
