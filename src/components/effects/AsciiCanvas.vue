<script setup lang="ts">
// Animates colored ASCII art "forming": every cell starts as scrambled green
// noise, flashes white and locks into its colour, center outwards. Locked cells
// are painted once onto an offscreen layer so large arts stay at 60fps.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ASPECT, type AsciiArt } from '@/lib/ascii'
import { settings } from '@/composables/useSettings'
import { sfx } from '@/composables/useSound'

const props = withDefaults(defineProps<{ art: AsciiArt; maxWidth: number; maxHeight: number; label?: string; blips?: boolean }>(), {
  label: 'ASCII art',
  blips: true,
})
const emit = defineEmits<{ done: [] }>()

const SCRAMBLE = '!#$%&*+-=?@[]{}<>/\\|~^:;01'
const FLASH = 0.09

interface Cell {
  x: number
  y: number
  ch: string
  color: string
  at: number
  locked: boolean
}

const canvas = ref<HTMLCanvasElement>()
let cells: Cell[] = []
let settled: HTMLCanvasElement | null = null
let geo = { cw: 0, lh: 0, dpr: 1 }
let started = 0
let raf = 0
let finished = false

function prepare() {
  const { cols, lines } = props.art
  cells = props.art.cells.map((c) => {
    // distance from the center (aspect-corrected): forms from the middle out
    const dx = (c.x / cols - 0.5) * 2
    const dy = ((c.y / lines - 0.5) * 2) / ASPECT / 1.6
    const d = Math.min(1, Math.hypot(dx, dy))
    return { ...c, at: 0.15 + d * 1.6 + Math.random() * 0.8, locked: false }
  })
}

function setFont(g: CanvasRenderingContext2D) {
  g.font = `700 ${geo.cw / 0.6}px "Hack Nerd Font", monospace`
  g.textBaseline = 'top'
}

function layout() {
  const c = canvas.value
  if (!c) return
  const { cols, lines } = props.art
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const cw = Math.min(props.maxWidth / cols, (props.maxHeight * ASPECT) / lines)
  const lh = cw / ASPECT
  geo = { cw, lh, dpr }
  for (const el of [c, (settled ??= document.createElement('canvas'))]) {
    el.width = Math.max(1, Math.round(cols * cw * dpr))
    el.height = Math.max(1, Math.round(lines * lh * dpr))
  }
  c.style.width = `${cols * cw}px`
  c.style.height = `${lines * lh}px`
  const s = settled.getContext('2d')!
  s.setTransform(dpr, 0, 0, dpr, 0, 0)
  setFont(s)
  for (const cell of cells) {
    if (!cell.locked) continue
    s.fillStyle = cell.color
    s.fillText(cell.ch, cell.x * cw, cell.y * lh)
  }
}

function paint() {
  const c = canvas.value
  if (!c || !settled) return
  const g = c.getContext('2d')!
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.clearRect(0, 0, c.width, c.height)
  g.drawImage(settled, 0, 0)
}

function frame(now: number) {
  const c = canvas.value
  if (!c || !settled) return
  const g = c.getContext('2d')!
  const s = settled.getContext('2d')!
  const { cw, lh, dpr } = geo
  const t = (now - started) / 1000
  paint()
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  setFont(g)
  let pending = 0
  let justLocked = 0
  for (const cell of cells) {
    if (cell.locked) continue
    const px = cell.x * cw
    const py = cell.y * lh
    if (t >= cell.at + FLASH) {
      cell.locked = true
      justLocked++
      s.fillStyle = cell.color
      s.fillText(cell.ch, px, py)
      g.fillStyle = cell.color
      g.fillText(cell.ch, px, py)
    } else if (t >= cell.at) {
      pending++
      g.fillStyle = '#FFFFFF'
      g.fillText(cell.ch, px, py)
    } else if (t >= cell.at - 0.45) {
      pending++
      g.globalAlpha = 0.55
      g.fillStyle = Math.random() < 0.5 ? '#A9DC88' : '#478F62'
      g.fillText(SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]!, px, py)
      g.globalAlpha = 1
    } else {
      pending++
    }
  }
  if (props.blips && justLocked && Math.random() < 0.35) sfx.blip()
  if (pending) raf = requestAnimationFrame(frame)
  else finish()
}

function finish() {
  if (finished) return
  finished = true
  emit('done')
}

async function start() {
  cancelAnimationFrame(raf)
  finished = false
  prepare()
  // the canvas needs the font before it can draw the art
  await document.fonts.load('700 16px "Hack Nerd Font"').catch(() => undefined)
  layout()
  if (!settings.motion.value) {
    for (const cell of cells) cell.locked = true
    layout()
    paint()
    finish()
    return
  }
  started = performance.now()
  raf = requestAnimationFrame(frame)
}

onMounted(start)
onBeforeUnmount(() => cancelAnimationFrame(raf))
watch(() => props.art, start)
watch(
  () => [props.maxWidth, props.maxHeight],
  () => {
    layout()
    if (finished) paint()
  },
)
</script>

<template>
  <canvas ref="canvas" class="ascii" role="img" :aria-label="label" />
</template>

<style scoped>
.ascii {
  display: block;
  filter: drop-shadow(0 0 6px rgba(169, 220, 136, 0.35));
}
</style>
