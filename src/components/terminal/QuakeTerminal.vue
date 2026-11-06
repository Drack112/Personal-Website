<script setup lang="ts">
// Drop-down console (Quake style). Toggle with ` / ~ or F2, or the >_ button in
// the top bar. Type `help` for the commands.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { nf } from '@/data/icons'
import { profile, stack } from '@/data/profile'
import { gopher } from '@/data/terminalArt'
import CrtScanlines from '@/components/crt/CrtScanlines.vue'
import { overlayOpen } from '@/composables/useUi'
import { sfx } from '@/composables/useSound'

interface Line {
  kind: 'cmd' | 'text' | 'art' | 'error' | 'note'
  text: string
  color?: string
}

const router = useRouter()
const open = ref(false)
const input = ref('')
const lines = ref<Line[]>([])
const history: string[] = []
let historyPos = -1
const field = ref<HTMLInputElement>()
const scroller = ref<HTMLElement>()

const say = (text: string, kind: Line['kind'] = 'text', color?: string) => lines.value.push({ text, kind, color })
const art = (text: string, color: string) => say(text.replace(/^\n/, '').replace(/\s+$/, ''), 'art', color)

const commands: Record<string, { help: string; run: (args: string[]) => void }> = {
  help: {
    help: 'list the commands',
    run: () => {
      for (const [name, c] of Object.entries(commands)) say(`  ${name.padEnd(9)} ${c.help}`)
      say('  ` / F2 / Esc toggle this console · ↑↓ history · Tab complete', 'note')
    },
  },
  gopher: {
    help: 'print the Go mascot',
    run: () => {
      art(gopher, '#00ADD8')
      say('the Go gopher was designed by Renée French · CC BY 4.0 · ASCII from the official artwork (go.dev/blog/gopher)', 'note')
    },
  },
  whoami: {
    help: 'who is behind this console',
    run: () => {
      say(`${profile.handle} — ${profile.name}`, 'text', '#F3EBD3')
      say(`${profile.headline} · ${profile.focus.join(' · ')}`, 'text', '#A9DC88')
      say(profile.specialties, 'note')
    },
  },
  ls: {
    help: 'list the stack',
    run: () => {
      for (const g of stack) say(`${g.label.padEnd(14)} ${g.items.join(' · ').toLowerCase()}`)
    },
  },
  video: {
    help: 'open the TV on Kamen Rider Black',
    run: () => {
      say('tuning to VIDEO · kamen rider black…', 'note')
      close()
      router.push('/video/kamen-rider-black')
    },
  },
  mix: {
    help: 'play my midnight coding mix on the TV',
    run: () => {
      say('♪ tuning to MIDNIGHT MIX · put your headphones on…', 'note')
      close()
      router.push('/video/midnight-mix?play=1')
    },
  },
  midnight: {
    help: 'alias for `mix`',
    run: () => commands.mix!.run([]),
  },
  cookie: {
    help: 'open the cookie',
    run: () => {
      close()
      window.dispatchEvent(new CustomEvent('lk:open-cookie'))
    },
  },
  clear: {
    help: 'clear the screen',
    run: () => (lines.value = []),
  },
  exit: {
    help: 'close the console',
    run: () => close(),
  },
}

function runLine(raw: string) {
  const line = raw.trim()
  say(line, 'cmd')
  if (!line) return
  history.unshift(line)
  historyPos = -1
  const [name, ...args] = line.split(/\s+/)
  const cmd = commands[name!.toLowerCase()]
  if (cmd) {
    sfx.select()
    cmd.run(args)
  } else if (name === 'sudo') {
    say('nice try. permission denied: you are not in the sudoers file. this incident will be reported 🍪', 'error')
  } else {
    sfx.error()
    say(`${name}: command not found · type \`help\``, 'error')
  }
}

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

function complete() {
  const v = input.value.trim().toLowerCase()
  if (!v) return
  const hits = Object.keys(commands).filter((c) => c.startsWith(v))
  if (hits.length === 1) input.value = hits[0]!
  else if (hits.length > 1) say(hits.join('  '), 'note')
}

// Capture phase: the console owns the keyboard while open, so nothing behind
// it reacts to what is typed. The text itself still reaches the input field.
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
    runLine(input.value)
    input.value = ''
    void scrollDown()
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    historyPos = Math.max(-1, Math.min(history.length - 1, historyPos + (e.key === 'ArrowUp' ? 1 : -1)))
    input.value = historyPos >= 0 ? history[historyPos]! : ''
  } else if (e.key === 'Tab') {
    e.preventDefault()
    complete()
    void scrollDown()
  }
}

const onToggle = () => toggle()
onMounted(() => {
  window.addEventListener('keydown', onKey, { capture: true })
  window.addEventListener('lk:toggle-terminal', onToggle)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, { capture: true })
  window.removeEventListener('lk:toggle-terminal', onToggle)
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
            <span class="seg a"><span class="nf">{{ nf.tux }}</span> {{ profile.handle }}</span><span class="seg b">~</span>
            <span class="cmd">{{ l.text }}</span>
          </div>
          <pre v-else-if="l.kind === 'art'" class="art" :style="{ color: l.color }">{{ l.text }}</pre>
          <div v-else class="line" :class="l.kind" :style="l.color ? { color: l.color } : undefined">{{ l.text }}</div>
        </template>
        <label class="prompt-line live">
          <span class="seg a"><span class="nf">{{ nf.tux }}</span> {{ profile.handle }}</span><span class="seg b">~</span>
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
