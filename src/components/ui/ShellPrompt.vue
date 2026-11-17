<script setup lang="ts">
import { nf } from '@/data/icons'

defineProps<{ user: string }>()
</script>

<template>
  <span class="seg a"><span class="nf">{{ nf.tux }}</span> {{ user }}</span><span class="seg b">~</span>
</template>

<style scoped>
.seg {
  position: relative;
  padding: 0 0.6rem;
  line-height: 1.6;
}

.seg::after {
  content: '';
  position: absolute;
  top: 0;
  right: -0.8em;
  border-style: solid;
  border-width: 0.8em 0 0.8em 0.8em;
  border-color: transparent transparent transparent currentColor;
}

.seg.a {
  background: var(--orange);
  color: var(--ink);
}

.seg.a::after {
  color: var(--orange);
  z-index: 1;
}

.seg.b {
  background: var(--teal);
  color: var(--cream);
  margin-right: 1rem;
}

.seg.b::after {
  color: var(--teal);
}
</style>
