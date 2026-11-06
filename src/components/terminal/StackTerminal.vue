<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { nf } from '@/data/icons'
import { profile, stack } from '@/data/profile'
import CrtScanlines from '@/components/crt/CrtScanlines.vue'
import { settings } from '@/composables/useSettings'

const total = stack.length + 4
const shown = ref(settings.motion.value ? 0 : total)
let timer = 0
onMounted(() => {
  if (shown.value >= total) return
  timer = window.setInterval(() => {
    shown.value++
    if (shown.value >= total) window.clearInterval(timer)
  }, 110)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="term" role="region" aria-label="Stack">
    <div class="line dim">drack gnu/linux 6.6.6-cookie (tty1) · login: <b>{{ profile.handle }}</b></div>

    <div v-if="shown > 0" class="prompt">
      <span class="seg a"><span class="nf">{{ nf.tux }}</span> {{ profile.handle }}@portfolio</span><span
        class="seg b">~</span>
      <span class="cmd">whoami</span>
    </div>
    <template v-if="shown > 1">
      <div class="line cream">{{ profile.handle }} — {{ profile.headline.toLowerCase() }} · {{
        profile.location.toLowerCase() }}</div>
      <div class="line green">{{ profile.focus.join(' · ').toLowerCase() }} · {{ profile.specialties.toLowerCase() }}
      </div>
    </template>

    <div v-if="shown > 2" class="prompt">
      <span class="seg a"><span class="nf">{{ nf.tux }}</span> {{ profile.handle }}@portfolio</span><span
        class="seg b">~</span>
      <span class="cmd">stack --all</span>
    </div>
    <dl class="stack">
      <template v-for="(g, i) in stack" :key="g.label">
        <div v-if="shown > 3 + i" class="row">
          <dt><span class="nf">{{ g.icon }}</span> {{ g.label }}</dt>
          <dd>{{ g.items.join(' · ').toLowerCase() }}</dd>
        </div>
      </template>
    </dl>

    <div v-if="shown >= total" class="prompt">
      <span class="seg a"><span class="nf">{{ nf.tux }}</span> {{ profile.handle }}@portfolio</span><span
        class="seg b">~</span>
      <span class="cursor" />
    </div>
    <CrtScanlines />
  </div>
</template>

<style scoped>
.term {
  padding: 1.2rem 1.4rem;
  background: #0f2220;
  color: var(--lime);
  font-size: 0.86rem;
  line-height: 1.55;
  box-shadow:
    inset 0 0 0 3px var(--ink),
    inset 0 0 60px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
}

.line {
  white-space: pre-wrap;
}

.dim {
  color: #5c8895;
}

.dim b {
  color: var(--cream);
}

.cream {
  color: var(--cream);
}

.green {
  color: var(--lime);
}

.prompt {
  display: flex;
  align-items: center;
  margin: 0.8rem 0 0.25rem;
  font-weight: 700;
}

.seg {
  position: relative;
  padding: 0 0.6rem;
  line-height: 1.6;
}

.seg.a {
  background: var(--orange);
  color: var(--ink);
}

.seg.b {
  background: #5c8895;
  color: var(--cream);
  margin-right: 1rem;
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

.seg.a::after {
  color: var(--orange);
  z-index: 1;
}

.seg.b::after {
  color: #5c8895;
}

.cmd {
  color: var(--cream);
}

.stack {
  margin: 0.4rem 0 0;
}

.row {
  display: grid;
  grid-template-columns: 17ch 1fr;
  gap: 0 1ch;
  margin-bottom: 0.45rem;
}

dt {
  color: var(--orange);
  font-weight: 700;
}

dd {
  margin: 0;
}

.cursor {
  width: 0.6em;
  height: 1.1em;
  background: var(--lime);
  animation: blink 0.9s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (max-width: 560px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
