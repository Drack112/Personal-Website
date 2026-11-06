<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export interface Hint {
  button: '✕' | '○' | '△' | '□'
  key: string
  label: string
}

const route = useRoute()
const hints = computed(() => (route.meta.hints as Hint[] | undefined) ?? [])
const color: Record<Hint['button'], string> = { '✕': '#A9DC88', '○': '#CB6E1B', '△': '#FEF274', '□': '#F3EBD3' }
</script>

<template>
  <footer v-if="hints.length" class="hints">
    <span v-for="h in hints" :key="h.label" class="hint">
      <b class="btn" :style="{ color: color[h.button] }">{{ h.button }}</b>
      <kbd>{{ h.key }}</kbd>
      <span>{{ h.label }}</span>
    </span>
  </footer>
</template>

<style scoped>
.hints {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 40;
  height: var(--hint-h);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.4rem;
  padding: 0 1.2rem;
  font-size: 0.75rem;
  color: var(--cream);
  background: linear-gradient(0deg, rgba(13, 26, 26, 0.95), rgba(13, 26, 26, 0.55));
  border-top: 3px solid var(--ink);
}

.hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--ink);
  box-shadow: 0 0 0 2px var(--green-hi);
  font-size: 0.7rem;
  line-height: 1;
  padding-bottom: 2px;
  /* the △○✕□ glyphs sit a bit low in their em box */
}

kbd {
  font-family: var(--font-ui);
  font-size: 0.65rem;
  padding: 0 4px;
  color: var(--muted);
  border: 1px solid var(--green-hi);
}

@media (pointer: coarse),
(max-width: 720px) {
  .hints {
    display: none;
  }
}
</style>
