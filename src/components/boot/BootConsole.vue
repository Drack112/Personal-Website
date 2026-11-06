<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import CrtScanlines from '@/components/crt/CrtScanlines.vue'
import { profile, stack } from '@/data/profile'
import { useGithub } from '@/composables/useGithub'
import { sfx } from '@/composables/useSound'

defineProps<{ closing?: boolean }>()
const emit = defineEmits<{ done: [] }>()

const { repos } = useGithub()

interface LogLine {
  kind: 'kern' | 'ok' | 'job' | 'text' | 'prompt' | 'progress'
  text: string
  ts?: string
  frame?: number
  pct?: number
}

const out = ref<LogLine[]>([])
const logEl = ref<HTMLElement>()
const JOB_FRAMES = ['[*     ]', '[**    ]', '[***   ]', '[ ***  ]', '[  *** ]', '[   ***]', '[    **]', '[     *]', '[    **]', '[   ***]', '[  *** ]', '[ ***  ]', '[***   ]', '[**    ]']

const timers: number[] = []
const sleep = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)))
let started = 0

// kernel-style timestamp, a bit slower than real time
const stamp = () => `[${(((performance.now() - started) / 1000) * 0.42 + 0.000001).toFixed(6).padStart(12, ' ')}]`

async function push(line: LogLine) {
  out.value.push(line)
  await nextTick()
  logEl.value?.scrollTo({ top: logEl.value.scrollHeight })
}

const last = () => out.value[out.value.length - 1]!

const kern = async (text: string, ms = 28) => {
  await push({ kind: 'kern', ts: stamp(), text })
  if (Math.random() < 0.3) sfx.blip()
  await sleep(ms + Math.random() * ms * 1.5)
}
const ok = async (text: string, ms = 55) => {
  await push({ kind: 'ok', text })
  await sleep(ms + Math.random() * ms)
}

async function job(running: string, ticks: number, finished: () => string) {
  await push({ kind: 'job', text: `A start job is running for ${running} (0s / 1min 30s)`, frame: 0 })
  const live = last()
  for (let i = 1; i <= ticks; i++) {
    await sleep(85)
    live.frame = i % JOB_FRAMES.length
    live.text = `A start job is running for ${running} (${Math.floor((i * 85) / 1000)}s / 1min 30s)`
  }
  live.kind = 'ok'
  live.text = finished()
  sfx.blip()
  await sleep(60)
}

async function type(line: LogLine, text: string, ms = 55) {
  await push(line)
  const live = last()
  for (const ch of text) {
    live.text += ch
    sfx.blip()
    await sleep(ms + Math.random() * 40)
  }
}

async function run() {
  started = performance.now()
  await sleep(380)
  const h = profile.handle
  await kern(`Linux version 6.6.6-cookie (${h}@portfolio) (gcc (GCC) 13.2.1, GNU ld 2.41) #1 SMP PREEMPT_DYNAMIC`)
  await kern('Command line: BOOT_IMAGE=/vmlinuz-6.6.6-cookie root=/dev/memcard0p1 rw quiet splash crt=on')
  await kern('BIOS-e820: [mem 0x0000000000000000-0x0000000001ffffff] usable')
  await kern('smpboot: CPU0: Emotion Engine @ 294.912MHz (family: 0x2e, model: 0x59, stepping: 0x2)')
  await kern('Memory: 32768K/32768K available (8192K kernel code, 2048K rwdata, 4096K rodata)')
  await kern('pci 0000:00:02.0: vgaarb: setting as boot VGA device (Graphics Synthesizer)')
  await kern('fb0: crt-scanline frame buffer device, 640x480, 60Hz')
  await kern('usb 1-1: new full-speed USB device number 2 using ohci-pci')
  await kern('input: DualShock 2 Analog Controller as /devices/pci0000:00/usb1/1-1/input/input3')
  await kern('sd 0:0:0:0: [memcard0] 16384 512-byte logical blocks: (8.39 MB/8.00 MiB)')
  await kern(' memcard0: p1 p2')
  await kern('EXT4-fs (memcard0p1): mounted filesystem with ordered data mode. Quota mode: none.')
  await kern('random: crng init done (seeded by one cookie)')
  await kern('systemd[1]: systemd 255 running in system mode (+PAM +AUDIT +SECCOMP +COOKIE)')
  await kern('systemd[1]: Hostname set to <portfolio>.', 90)
  await ok('Started Journal Service.')
  await ok(`Mounted /home/${h}.`)
  await ok('Started Hack Nerd Font cache.')
  await ok('Reached target Sound Card.')
  await job('GitHub sync', 9, () => `Started GitHub sync (${repos.value.length || 'all'} saves found).`)
  await ok(`Loaded stack: ${stack[0]!.items.slice(0, 4).join(', ').toLowerCase()} …`)
  await job('Last.fm scrobbler', 6, () => 'Started Last.fm scrobbler.')
  await ok('Started CRT scanline daemon.')
  await ok('Started cookie jar (open-the-cookie.service).')
  await ok('Reached target Network Online.')
  await ok('Reached target Graphical Interface.', 160)
  await push({ kind: 'text', text: '' })
  await push({ kind: 'text', text: 'drack gnu/linux 6.6.6-cookie portfolio tty1' })
  await push({ kind: 'text', text: '' })
  await sleep(220)
  await type({ kind: 'text', text: 'portfolio login: ' }, h)
  await push({ kind: 'text', text: '(automatic login)' })
  await push({ kind: 'text', text: `Last login: ${new Date().toString().slice(0, 24)} on tty1` })
  await sleep(260)
  await type({ kind: 'prompt', text: '' }, 'startx', 70)
  await sleep(160)
  await push({ kind: 'progress', text: 'Starting DRACK·PORTFOLIO', pct: 0 })
  const bar = last()
  while ((bar.pct ?? 0) < 100) {
    await sleep(45 + Math.random() * 60)
    bar.pct = Math.min(100, (bar.pct ?? 0) + 6 + Math.floor(Math.random() * 14))
  }
  sfx.select()
  await sleep(350)
  emit('done')
}

const barOf = (pct = 0) => {
  const n = Math.round(pct / 5)
  return `[${'█'.repeat(n)}${'░'.repeat(20 - n)}] ${String(pct).padStart(3, ' ')}%`
}

onMounted(() => void run())
onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))
</script>

<template>
  <section class="console" :class="{ closing }" aria-label="Boot log">
    <header class="bar">
      <span class="pixel">tty1</span>
      <span class="title">{{ profile.handle }}@portfolio</span>
      <span class="dots"><i /><i /><i /></span>
    </header>
    <div ref="logEl" class="log" aria-live="polite">
      <div v-for="(l, i) in out" :key="i" class="line" :class="l.kind">
        <template v-if="l.kind === 'kern'"><span class="ts">{{ l.ts }}</span> {{ l.text }}</template>
        <template v-else-if="l.kind === 'ok'"><span class="st ok">{{ '[ OK ]' }}</span> {{ l.text }}</template>
        <template v-else-if="l.kind === 'job'"><span class="st job">{{ JOB_FRAMES[l.frame ?? 0] }}</span> {{ l.text
          }}</template>
        <template v-else-if="l.kind === 'prompt'"><span class="ps1">{{ profile.handle }}@portfolio</span>:<span
            class="ps2">~</span>$ {{ l.text }}</template>
        <template v-else-if="l.kind === 'progress'">{{ l.text }} <span class="pbar">{{ barOf(l.pct) }}</span></template>
        <template v-else>{{ l.text }}</template>
      </div>
      <span v-if="!closing" class="cursor" />
    </div>
    <div class="sweep" aria-hidden="true" />
    <CrtScanlines :strength="0.22" flicker vignette />
  </section>
</template>

<style scoped>
.console {
  position: relative;
  z-index: 2;
  width: min(900px, 92vw);
  height: min(64vh, 580px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(7, 16, 14, 0.93);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 0 0 0 3px var(--green-hi),
    0 0 80px rgba(169, 220, 136, 0.2),
    12px 12px 0 3px rgba(0, 0, 0, 0.5);
  animation: crt-on 0.55s ease-out both;
}

/* collapses to a line and a dot, like a CRT switching off */
.console.closing {
  animation: crt-off 0.55s ease-in both;
}

/* a soft band of light running down the glass */
.sweep {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 18%;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgba(169, 220, 136, 0.06), transparent);
  animation: sweep 3.2s linear infinite;
}

.bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.45rem 0.8rem;
  font-size: 0.6rem;
  color: var(--cream);
  background: linear-gradient(90deg, var(--green-lo), var(--green));
  border-bottom: 3px solid var(--ink);
}

.title {
  font-size: 0.75rem;
  color: var(--muted);
}

.dots {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.dots i {
  width: 8px;
  height: 8px;
  background: var(--lime);
  box-shadow: 0 0 0 2px var(--ink);
}

.dots i:nth-child(2) {
  background: var(--gold);
}

.dots i:nth-child(3) {
  background: var(--orange);
}

.log {
  flex: 1;
  overflow-y: auto;
  padding: 0.8rem 1rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #d3dcd3;
  text-shadow: 0 0 6px rgba(169, 220, 136, 0.35);
  scrollbar-width: none;
}

.line {
  white-space: pre-wrap;
  animation: line-in 0.12s ease-out;
}

.ts {
  color: #7f9d95;
}

.st {
  font-weight: 700;
}

.st.ok {
  color: var(--lime);
}

.st.job {
  color: #ff6b4a;
}

.ps1 {
  color: var(--orange);
  font-weight: 700;
}

.ps2 {
  color: var(--teal);
  font-weight: 700;
}

.line.progress {
  color: var(--gold);
}

.pbar {
  color: var(--lime);
}

.cursor {
  display: inline-block;
  width: 0.6em;
  height: 1.05em;
  vertical-align: text-bottom;
  background: var(--lime);
  box-shadow: 0 0 8px var(--lime);
  animation: blink 0.8s steps(1) infinite;
}

@keyframes crt-on {
  0% {
    transform: scale(0.02, 0.004);
    filter: brightness(6);
    opacity: 0;
  }

  35% {
    transform: scale(1, 0.008);
    filter: brightness(4);
    opacity: 1;
  }

  70% {
    transform: scale(1, 1.03);
    filter: brightness(1.6);
  }

  100% {
    transform: none;
    filter: none;
  }
}

@keyframes crt-off {
  0% {
    transform: none;
    filter: none;
  }

  45% {
    transform: scale(1, 0.006);
    filter: brightness(4);
  }

  80% {
    transform: scale(0.02, 0.006);
    filter: brightness(6);
    opacity: 1;
  }

  100% {
    transform: scale(0, 0);
    opacity: 0;
  }
}

@keyframes line-in {
  from {
    opacity: 0;
    filter: brightness(2.5);
  }
}

/* from just above the window to just below it (in its own heights, 18% each),
   with a transform so it never re-lays out */
@keyframes sweep {
  from {
    transform: translateY(-111%);
  }

  to {
    transform: translateY(611%);
  }
}

@keyframes blink {
  50% {
    opacity: 0.25;
  }
}

@media (max-width: 720px) {
  .log {
    font-size: 0.62rem;
    padding: 0.6rem;
  }

  .ts,
  .title {
    display: none;
  }
}
</style>
