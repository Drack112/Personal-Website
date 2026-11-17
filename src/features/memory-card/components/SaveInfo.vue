<script setup lang="ts">
import BevelButton from '@/components/ui/BevelButton.vue'
import { nf } from '@/data/icons'
import { featuredRepos } from '@/data/profile'

import type { Save } from '../saves'

defineProps<{ save: Save }>()

const emit = defineEmits<{ load: [] }>()
</script>

<template>
  <aside class="info">
    <p class="info-title pixel">{{ save.label }}</p>
    <dl>
      <div>
        <dt>{{ save.repo ? 'last save' : 'period' }}</dt>
        <dd>{{ save.date }}</dd>
      </div>
      <div>
        <dt>{{ save.repo ? 'size' : 'time' }}</dt>
        <dd>{{ save.size }}</dd>
      </div>
      <div v-if="save.repo">
        <dt>lang</dt>
        <dd>{{ save.repo.language || '—' }}</dd>
      </div>
      <div v-if="save.job">
        <dt>role</dt>
        <dd>{{ save.job.role }}</dd>
      </div>
    </dl>
    <p class="info-desc">
      {{ save.repo
        ? featuredRepos[save.repo.name] || save.repo.description || 'No description.'
        : save.job?.summary || save.job?.domain }}
    </p>
    <BevelButton variant="orange" small :icon="nf.save" @click="emit('load')">LOAD SAVE</BevelButton>
  </aside>
</template>

<style scoped>
.info {
  position: sticky;
  top: calc(var(--bar-h) + 1rem);
  padding: 1rem 1.1rem 1.2rem;
  background: color-mix(in srgb, var(--ink) 90%, transparent);
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

@media (max-width: 860px) {
  .info {
    position: static;
    order: -1;
  }
}
</style>
