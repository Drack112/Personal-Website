<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useGithub } from '@/composables/useGithub'
import { settings } from '@/composables/useSettings'
import { sfx } from '@/composables/useSound'
import { markBooted } from '@/lib/boot'
import { profile } from '@/data/profile'

import BootConsole from './components/BootConsole.vue'

type Phase = 'start' | 'intro' | 'logo' | 'console' | 'off'

const BOOM_LANDS_AT = 0.6
const CONSOLE_AT = 2.8
const FAILSAFE_FINISH_AT = 16
const POWER_OFF_S = 0.65

const router = useRouter()

prefetchRepos()

const phase = ref<Phase>('start')
const letters = profile.handle.toUpperCase().split('')

const consoleUp = computed(() => phase.value === 'console' || phase.value === 'off')

let done = false
const timers: number[] = []

function at(seconds: number, fn: () => void) {
  timers.push(window.setTimeout(fn, seconds * 1000))
}

function prefetchRepos() {
  useGithub()
}

function finish() {
  if (done) return
  done = true
  sfx.introStop()
  markBooted()
  router.replace('/menu')
}

function powerOff() {
  if (phase.value === 'off') return finish()
  phase.value = 'off'
  sfx.close()
  at(POWER_OFF_S, finish)
}

function startBoot() {
  if (phase.value !== 'start') return
  if (!settings.motion.value) {
    sfx.select()
    finish()
    return
  }
  // must play inside the click/key handler, or the browser blocks the audio
  sfx.introChime()
  sfx.introBoom()
  phase.value = 'intro'
  at(BOOM_LANDS_AT, () => (phase.value = 'logo'))
  at(CONSOLE_AT, () => (phase.value = 'console'))
  at(FAILSAFE_FINISH_AT, finish)
}

function onKey(e: KeyboardEvent) {
  if (phase.value === 'start' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    startBoot()
  } else if (phase.value !== 'start' && (e.key === 'Escape' || e.key === 'Enter')) {
    finish()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  sfx.preloadIntro()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  timers.forEach((t) => window.clearTimeout(t))
  sfx.introStop()
})
</script>

<template>
  <div class="boot" :class="`phase-${phase}`">
    <button v-if="phase === 'start'" type="button" class="start" @click="startBoot">
      <span class="shapes" aria-hidden="true"><b>△</b><b>○</b><b>✕</b><b>□</b></span>
      <span class="press pixel">PRESS START</span>
      <span class="sub">click, tap or press Enter · sound on</span>
    </button>

    <template v-else>
      <div class="intro" :class="{ receded: consoleUp }">
        <div v-if="phase === 'logo' || consoleUp" class="logo">
          <h1 class="pixel" :aria-label="letters.join('')">
            <span v-for="(ch, i) in letters" :key="i" class="ch" :style="{ '--i': i }" aria-hidden="true">{{ ch }}</span>
          </h1>
          <p class="tag">{{ profile.headline }} · {{ profile.focus.join(' · ') }}</p>
        </div>
        <div class="vignette" aria-hidden="true" />
      </div>
      <div v-if="phase === 'logo'" class="flash" aria-hidden="true" />

      <BootConsole v-if="consoleUp" :closing="phase === 'off'" @done="powerOff" />
    </template>

    <button v-if="phase !== 'start'" type="button" class="skip" @click="finish">skip ▸</button>
  </div>
</template>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.boot:not(.phase-start) {
  background: rgba(4, 11, 10, 0.55);
}

.start {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  border: 0;
  background: none;
  color: var(--cream);
  padding: 3rem;
}

.shapes {
  display: flex;
  gap: 0.8rem;
  font-size: 2.4rem;
  font-weight: 700;
}

.shapes b {
  animation: float 2.4s ease-in-out infinite;
}

.shapes b:nth-child(1) {
  color: var(--lime);
}

.shapes b:nth-child(2) {
  color: var(--orange);
  animation-delay: 0.2s;
}

.shapes b:nth-child(3) {
  color: var(--gold);
  animation-delay: 0.4s;
}

.shapes b:nth-child(4) {
  color: var(--cream);
  animation-delay: 0.6s;
}

.press {
  font-size: clamp(1rem, 4vw, 1.6rem);
  color: var(--cream);
  text-shadow:
    3px 3px 0 var(--ink),
    0 0 18px color-mix(in srgb, var(--lime) 60%, transparent);
  animation: blink 1.1s steps(1) infinite;
}

.sub {
  font-size: 0.8rem;
  color: var(--muted);
}

.intro {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  animation: fade-in 1.2s ease-out both;
  transition:
    transform 1.4s cubic-bezier(0.2, 0.7, 0.2, 1),
    filter 1.4s ease,
    opacity 1.4s ease;
}

.intro.receded {
  transform: scale(1.08);
  filter: blur(3px) brightness(0.62) saturate(1.3);
}

.logo {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2.5rem 3.5rem;
  background: radial-gradient(ellipse at center, rgba(4, 11, 10, 0.75) 30%, transparent 70%);
}

.logo h1 {
  display: flex;
  justify-content: center;
  margin: 0;
  font-size: clamp(1.6rem, 7vw, 3.6rem);
  color: var(--cream);
}

.ch {
  display: inline-block;
  text-shadow:
    4px 4px 0 var(--orange),
    8px 8px 0 var(--ink),
    0 0 30px color-mix(in srgb, var(--lime) 80%, transparent);
  animation:
    letter-in 0.7s cubic-bezier(0.2, 1.6, 0.4, 1) both,
    glow 2.4s ease-in-out infinite;
  animation-delay: calc(var(--i) * 70ms), calc(0.8s + var(--i) * 90ms);
}

.tag {
  margin: 1.3rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  animation: tag-in 0.9s 0.7s ease-out both;
}

.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.75) 100%);
}

.flash {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: radial-gradient(circle at center, #fffbe0, color-mix(in srgb, var(--gold) 50%, transparent) 40%, transparent 75%);
  mix-blend-mode: screen;
  animation: flash 0.9s ease-out both;
}

.skip {
  position: absolute;
  right: 1.2rem;
  bottom: 1.2rem;
  z-index: 4;
  border: 0;
  background: none;
  color: var(--muted);
  font-family: var(--font-ui);
}

@keyframes fade-in {
  from {
    opacity: 0;
    filter: brightness(2.5) blur(6px);
  }
}

@keyframes letter-in {
  from {
    opacity: 0;
    transform: translateY(-60px) scale(1.8) rotate(-12deg);
    filter: blur(6px) brightness(3);
  }
}

@keyframes glow {
  50% {
    color: #fffbe0;
    transform: translateY(-3px);
  }
}

@keyframes tag-in {
  from {
    opacity: 0;
    letter-spacing: 0.6em;
    filter: blur(4px);
  }
}

@keyframes flash {
  0% {
    opacity: 0;
  }

  12% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@keyframes blink {
  50% {
    opacity: 0.25;
  }
}

@keyframes float {
  50% {
    transform: translateY(-8px) rotate(6deg);
  }
}
</style>
