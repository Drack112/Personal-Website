<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import AsciiCanvas from '@/components/effects/AsciiCanvas.vue'
import BevelButton from '@/components/ui/BevelButton.vue'
import RetroWindow from '@/components/ui/RetroWindow.vue'
import { nf } from '@/data/icons'
import { cookieImages as stills } from '@/data/clips'
import { profile } from '@/data/profile'
import { ASPECT, imageToAscii, type AsciiArt } from '@/lib/ascii'
import { overlayOpen } from '@/composables/useUi'
import { sfx } from '@/composables/useSound'

interface LogLine {
  text: string
  kind?: 'ok' | 'dim' | 'hooray'
}

const open = ref(false)
const log = ref<LogLine[]>([])
const art = ref<AsciiArt | null>(null)

const done = ref(false)
const busy = ref(false)

const wrap = ref<HTMLElement>()
const box = ref({ w: 600, h: 360 })

let lastPick = -1
let runId = 0

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))

function measure() {
  box.value = { w: wrap.value?.clientWidth ?? 600, h: wrap.value?.clientHeight ?? 360 }
}

async function roll() {
  if (busy.value) return
  busy.value = true
  const id = ++runId

  done.value = false
  art.value = null

  let pick = Math.floor(Math.random() * stills.length)
  if (stills.length > 1 && pick === lastPick) pick = (pick + 1) % stills.length

  lastPick = pick
  const clip = stills[pick]!
  log.value = []

  const say = async (text: string, kind?: LogLine['kind'], ms = 260) => {
    if (id !== runId) return
    log.value.push({ text, kind })
    sfx.move()
    await wait(ms)
  }

  await say('unwrapping cookie...', 'dim')
  await say(`found image ${String(pick + 1).padStart(2, '0')}/${stills.length} · ${clip.name}`, 'ok')
  await nextTick()

  measure()
  // fill the whole art area: pick the grid from the space available
  const cell = window.innerWidth < 720 ? 5.5 : 6.5 // px per character
  const cols = Math.max(20, Math.floor(box.value.w / cell))
  const lines = Math.max(10, Math.floor(box.value.h / (cell / ASPECT)))

  try {
    const next = await imageToAscii(clip.url, cols, lines)
    if (id !== runId) return
    await say(`decoding frame → ${next.cols}×${next.lines} ascii · ${next.cells.length} glyphs`, 'dim', 200)
    sfx.boot()
    art.value = next
  } catch {
    await say('this cookie crumbled, try another one', 'dim')
    busy.value = false
  }
}

function formed() {
  done.value = true
  busy.value = false
  log.value.push({ text: '★ a star has arrived!', kind: 'hooray' })
}

async function show() {
  if (open.value) return
  open.value = true
  overlayOpen.value = true
  sfx.open()

  await nextTick()
  void roll()
}

function close() {
  runId++
  open.value = false
  overlayOpen.value = false
  busy.value = false
  sfx.close()
}

function onKey(e: KeyboardEvent) {
  if (!open.value) {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
    if (!typing && (e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey && document.querySelector('.top')) {
      e.preventDefault()
      void show()
    }
    return
  }
  if (e.key === 'Tab') return
  e.stopImmediatePropagation()
  if (e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault()
    close()
  } else if ((e.key === 'Enter' || e.key === ' ') && done.value) {
    e.preventDefault()
    sfx.select()
    void roll()
  }
}

const onOpenCookie = () => void show()

onMounted(() => {
  window.addEventListener('lk:open-cookie', onOpenCookie)
  window.addEventListener('keydown', onKey, { capture: true })
  window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  window.removeEventListener('lk:open-cookie', onOpenCookie)
  window.removeEventListener('keydown', onKey, { capture: true })
  window.removeEventListener('resize', measure)
  overlayOpen.value = false
})
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="overlay" @click.self="close">
        <RetroWindow class="cookie-win" title="open-the-cookie.exe" :icon="nf.cookie" accent="var(--orange)" closable
          @close="close">
          <div class="term">
            <div class="prompt">
              <span class="seg a"><span class="nf">{{ nf.tux }}</span> {{ profile.handle }}@portfolio</span><span
                class="seg b">~</span>
              <span class="cmd">./open-the-cookie --random</span>
            </div>
            <div class="log">
              <div v-for="(l, i) in log" :key="i" class="line" :class="l.kind">{{ l.text }}</div>
            </div>
            <div ref="wrap" class="art-wrap" :class="{ empty: !art }">
              <AsciiCanvas v-if="art" :art="art" :max-width="box.w" :max-height="box.h"
                label="Random Luckyuro image in ASCII art" @done="formed" />
              <span v-else class="loading pixel">LOADING...</span>
            </div>
            <div class="actions">
              <BevelButton variant="orange" :icon="nf.refresh" :pressed="busy" @click="roll">ANOTHER COOKIE
              </BevelButton>
              <BevelButton :icon="nf.back" @click="close">CLOSE</BevelButton>
              <span class="keys">Enter another · Esc close</span>
            </div>
          </div>
        </RetroWindow>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="css">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 65;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(6, 17, 16, 0.78);
}

/* a regular-size window; the art area inside stretches to fill all of it */
.cookie-win {
  width: min(940px, 100%);
  height: min(760px, calc(100vh - 2rem));
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cookie-win :deep(.body) {
  flex: 1;
  display: flex;
  min-height: 0;
  padding: 0.6rem;
}

.term {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0.8rem 1rem 1rem;
  background: #0f2220;
  color: var(--lime);
  font-size: 0.85rem;
  box-shadow:
    inset 0 0 0 3px var(--ink),
    inset 0 0 60px rgba(0, 0, 0, 0.6);
}

.prompt {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
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
  background: var(--teal);
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
  color: var(--teal);
}

.cmd {
  color: var(--cream);
}

.line.dim {
  color: var(--muted);
}

.line.ok {
  color: var(--lime);
}

.line.hooray {
  color: var(--gold);
  font-weight: 700;
}

.log {
  min-height: 4.5em;
  /* fixed so the art area doesn't resize while lines print */
}

.art-wrap {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  margin: 0.4rem 0 0.8rem;
}

.loading {
  font-size: 0.7rem;
  color: var(--muted);
  animation: twinkle 1s steps(2) infinite;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.keys {
  margin-left: auto;
  font-size: 0.72rem;
  color: var(--muted);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

@keyframes twinkle {
  50% {
    opacity: 0.35;
  }
}

@media (pointer: coarse),
(max-width: 720px) {
  .keys {
    display: none;
  }

  .overlay {
    padding: 0.5rem;
  }

  .cookie-win {
    height: min(640px, calc(100vh - 3rem));
  }

  .term {
    padding: 0.6rem;
    font-size: 0.72rem;
  }
}
</style>
