<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import CrtScanlines from '@/components/crt/CrtScanlines.vue'
import ShellPrompt from '@/components/ui/ShellPrompt.vue'
import { sfx } from '@/composables/useSound'
import { overlayOpen } from '@/composables/useUi'
import { nf } from '@/data/icons'
import { profile } from '@/data/profile'

import { useCommands } from './composables/useCommands'

const { lines, say, run, complete, browse } = useCommands(close)

const open = ref(false)
const input = ref('')
const field = ref<HTMLInputElement>()
const scroller = ref<HTMLElement>()

async function scrollDown() {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight })
}

async function show() {
  if (open.value) return
  open.value = true
  overlayOpen.value = true
  sfx.open()
  if (!lines.value.length) {
    say(`drack gnu/linux 6.6.6-cookie (tty2) · welcome, ${profile.handle}`, 'note')
    say('type `help` to see what this console can do', 'note')
  }
  await nextTick()
  field.value?.focus()
  void scrollDown()
}

function close() {
  if (!open.value) return
  open.value = false
  overlayOpen.value = false
  sfx.close()
}

function toggle() {
  if (open.value) close()
  else void show()
}

function onKey(e: KeyboardEvent) {
  const toggleKey = e.key === '`' || e.key === '~' || e.key === 'F2' || e.code === 'Backquote'
  if (!open.value) {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
    if (toggleKey && !typing && !overlayOpen.value) {
      e.preventDefault()
      void show()
    }
    return
  }
  e.stopImmediatePropagation()
  if (toggleKey || e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    run(input.value)
    input.value = ''
    void scrollDown()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    input.value = browse(e.key === 'ArrowUp' ? 1 : -1)
  } else if (e.key === 'Tab') {
    e.preventDefault()
    input.value = complete(input.value)
    void scrollDown()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey, { capture: true })
  window.addEventListener('lk:toggle-terminal', toggle)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, { capture: true })
  window.removeEventListener('lk:toggle-terminal', toggle)
  if (open.value) overlayOpen.value = false
})
</script>

<template>
  <Transition name="drop">
    <section v-if="open" class="console" role="dialog" aria-label="Terminal" @click="field?.focus()">
      <header class="bar">
        <span class="nf">{{ nf.shell }}</span>
        <span class="pixel">drack112@portfolio: ~</span>
        <span class="keys">` · F2 · Esc</span>
        <button type="button" class="x" aria-label="Close terminal" @click.stop="close">✕</button>
      </header>
      <div ref="scroller" class="out">
        <template v-for="(l, i) in lines" :key="i">
          <div v-if="l.kind === 'cmd'" class="prompt-line">
            <ShellPrompt :user="profile.handle" />
            <span class="cmd">{{ l.text }}</span>
          </div>
          <pre v-else-if="l.kind === 'art'" class="art" :style="{ color: l.color }">{{ l.text }}</pre>
          <div v-else class="line" :class="l.kind" :style="l.color ? { color: l.color } : undefined">{{ l.text }}</div>
        </template>
        <label class="prompt-line live">
          <ShellPrompt :user="profile.handle" />
          <input
            ref="field"
            v-model="input"
            class="field"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            aria-label="Command"
            enterkeyhint="send"
          />
        </label>
      </div>
      <CrtScanlines :strength="0.18" />
    </section>
  </Transition>
</template>

<style scoped>
.console {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 85;
  height: min(62vh, 620px);
  display: flex;
  flex-direction: column;
  background: rgba(10, 22, 20, 0.97);
  border-bottom: 3px solid var(--ink);
  box-shadow:
    0 3px 0 var(--lime),
    0 18px 40px rgba(0, 0, 0, 0.6);
}

.bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.9rem;
  font-size: 0.62rem;
  color: var(--cream);
  background: linear-gradient(90deg, var(--green-lo), var(--green));
  border-bottom: 3px solid var(--ink);
}

.bar .nf {
  color: var(--lime);
  font-size: 0.95rem;
}

.keys {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--muted);
}

.x {
  width: 24px;
  height: 22px;
  border: 0;
  font-weight: 700;
  color: var(--ink);
  background: var(--orange);
  box-shadow: 0 0 0 2px var(--ink);
}

.out {
  flex: 1;
  overflow-y: auto;
  padding: 0.8rem 1.1rem 1rem;
  font-size: 0.85rem;
  color: var(--lime);
}

.line {
  white-space: pre-wrap;
}

.line.note {
  color: var(--muted);
}

.line.error {
  color: #ff8a6a;
}

.art {
  margin: 0.4rem 0;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  line-height: 1.15;
  text-shadow: 0 0 6px currentColor;
}

.prompt-line {
  display: flex;
  align-items: center;
  margin: 0.5rem 0 0.2rem;
  font-weight: 700;
}

.cmd {
  color: var(--cream);
}

.field {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--cream);
  font: inherit;
  caret-color: var(--lime);
}

.drop-enter-active,
.drop-leave-active {
  transition: transform 0.22s ease-out;
}

.drop-enter-from,
.drop-leave-to {
  transform: translateY(-105%);
}

@media (max-width: 720px) {
  .console {
    height: 70vh;
  }

  .out {
    font-size: 0.75rem;
    padding: 0.6rem;
  }

  .art {
    font-size: 0.6rem;
  }

  .keys {
    display: none;
  }
}
</style>
