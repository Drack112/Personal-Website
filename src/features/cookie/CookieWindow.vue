<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import BevelButton from '@/components/ui/BevelButton.vue'
import RetroWindow from '@/components/ui/RetroWindow.vue'
import ShellPrompt from '@/components/ui/ShellPrompt.vue'
import { sfx } from '@/composables/useSound'
import { overlayOpen } from '@/composables/useUi'
import { nf } from '@/data/icons'
import { profile } from '@/data/profile'

import AsciiCanvas from './components/AsciiCanvas.vue'
import { useCookieRoll } from './composables/useCookieRoll'

const { log, art, done, busy, roll, formed, cancel } = useCookieRoll(measure)

const open = ref(false)
const wrap = ref<HTMLElement>()
const box = ref({ w: 600, h: 360 })

function measure() {
  box.value = { w: wrap.value?.clientWidth ?? 600, h: wrap.value?.clientHeight ?? 360 }
  return box.value
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
  cancel()
  open.value = false
  overlayOpen.value = false
  sfx.close()
}

function onOpenCookie() {
  void show()
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
        <RetroWindow
          class="cookie-win"
          title="open-the-cookie.exe"
          :icon="nf.cookie"
          accent="var(--orange)"
          closable
          @close="close"
        >
          <div class="term">
            <div class="prompt">
              <ShellPrompt :user="`${profile.handle}@portfolio`" />
              <span class="cmd">./open-the-cookie --random</span>
            </div>
            <div class="log">
              <div v-for="(l, i) in log" :key="i" class="line" :class="l.kind">{{ l.text }}</div>
            </div>
            <div ref="wrap" class="art-wrap" :class="{ empty: !art }">
              <AsciiCanvas
                v-if="art"
                :art="art"
                :max-width="box.w"
                :max-height="box.h"
                label="Random Luckyuro image in ASCII art"
                @done="formed"
              />
              <span v-else class="loading pixel">LOADING...</span>
            </div>
            <div class="actions">
              <BevelButton variant="orange" :icon="nf.refresh" :pressed="busy" @click="roll">ANOTHER COOKIE</BevelButton>
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

.cmd {
  color: var(--cream);
}

.log {
  min-height: 4.5em;
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

@media (pointer: coarse), (max-width: 720px) {
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
