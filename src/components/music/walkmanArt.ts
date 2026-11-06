// Pixel art of a cassette walkman with its headphones standing beside it,
// plugged in. Drawn in art pixels (W x H); the cassette label is left blank
// for the HTML overlay with the track.
import type { Pixels } from '@/lib/pixel'

export type Key = 'rew' | 'play' | 'ff' | 'stop'
const keys: { id: Key; x: number; y: number; w: number; h: number }[] = [
  { id: 'rew', x: 92, y: 45, w: 24, h: 14 },
  { id: 'play', x: 120, y: 45, w: 24, h: 14 },
  { id: 'ff', x: 148, y: 45, w: 24, h: 14 },
  { id: 'stop', x: 176, y: 45, w: 24, h: 14 },
]

// The walkman and the headphones are each drawn in their own coordinates and
// placed by a layout: side by side on wide screens, headphones on top of the
// walkman on narrow ones (cable from the left cup down to the jack).
function layout(w: number, h: number, wx: number, wy: number, px: number, py: number, cable: 'left' | 'right') {
  return {
    W: w,
    H: h,
    wx,
    wy,
    px,
    py,
    cable,
    keys: keys.map((k) => ({ ...k, x: k.x + wx, y: k.y + wy })),
    // where the HTML label (cover + title + artist) goes
    label: { x: 109 + wx, y: 73 + wy, w: 93, h: 26 },
  }
}
export const LAYOUTS = {
  wide: layout(352, 200, 120, 0, 0, 56, 'right'),
  stacked: layout(186, 288, -50, 90, 16, -6, 'left'),
}
export type Layout = (typeof LAYOUTS)[keyof typeof LAYOUTS]

export interface WalkmanState {
  running: boolean // tape moving at play speed
  progress: number // 0-1 through the track: how the tape is split between the reels
  down: Key | null // key held down
  shuttle: number // -1 rewinding, 1 fast-forwarding, 0 neither
  elapsed: string // 'mm:ss' for the counter
  status: string // short LCD text
  loaded: boolean // a track to show
}

const C = {
  line: '#0e1f1c',
  shadow: '#060a09',
  body0: '#183528',
  body1: '#21473a',
  body2: '#2c5a44',
  body3: '#3a7354',
  body4: '#478f62',
  body5: '#6fb487',
  metal0: '#5d6461',
  metal1: '#9aa39f',
  metal2: '#c9cfcc',
  metal3: '#eef2ef',
  orange: '#cb6e1b',
  orangeHi: '#e8862e',
  orangeLo: '#9e5212',
  orangeDk: '#6e3a0f',
  gold: '#fef274',
  lime: '#a9dc88',
  cream: '#f3ebd3',
  beige: '#d8cfb0',
  window: '#0b1614',
  shell0: '#262624',
  shell1: '#3a3a36',
  shell2: '#4e4e48',
  shell3: '#6a6a62',
  tape: '#4a2e1e',
  tapeHi: '#6b4429',
  lcd: '#0f2a1f',
  lcdGhost: '#143222',
  lcdOn: '#a9dc88',
}

const NOTES = [
  ['00110', '00101', '00100', '00100', '11100', '11100'],
  ['0011111', '0011111', '0010001', '0010001', '1110111', '1110111'],
]
const NOTE_COLORS = [C.gold, C.lime, C.orangeHi, C.cream]

// reel rotation, integrated between frames so speed changes stay smooth
let angle = 0
let lastT = 0

const beat = (t: number) => (t ? ((t * 112) / 60) % 1 : 1)

// headphones: centre line and the y of the band's wire at x
const HC = 86
const arc = (x: number) => 20 + 46 * ((x - HC) / 58) ** 2

function headband(p: Pixels) {
  // two spring-steel wires: dark outline first, then the metal on top
  const wires = [0, 6]
  for (const pass of [0, 1]) {
    for (const dy of wires) {
      let px = 28
      let py = arc(28) + dy
      for (let x = 29; x <= 2 * HC - 28; x++) {
        const y = arc(x) + dy
        if (pass === 0) {
          p.line(px, py - 1, x, y - 1, C.line)
          p.line(px, py + 2, x, y + 2, C.line)
        } else {
          p.line(px, py, x, y, dy ? C.metal1 : C.metal2)
          p.line(px, py + 1, x, y + 1, C.metal0)
        }
        px = x
        py = y
      }
    }
  }
  for (let x = 34; x <= 2 * HC - 34; x++) if (x % 9 < 2) p.px(x, arc(x), C.metal3)
  // padded cushion between the wires, with stitching
  for (let x = HC - 26; x <= HC + 26; x++) {
    const y = Math.round(arc(x))
    p.rect(x, y + 2, 1, 4, C.line)
    if (x > HC - 26 && x < HC + 26) {
      p.rect(x, y + 3, 1, 2, C.body2)
      if (x % 3 === 0) p.px(x, y + 3, C.body4)
    }
  }
}

function cup(p: Pixels, side: -1 | 1, kick: number) {
  // mirror left-side coordinates for the right cup
  const X = (x: number, w = 1) => (side < 0 ? x : 2 * HC - x - w)
  const out = kick // the cup jumps outwards on the beat
  // slider and yoke from the band
  p.rect(X(25, 6), 64, 6, 14, C.line)
  p.rect(X(26, 4), 65, 4, 12, C.metal1)
  p.vline(X(27), 66, 10, C.metal3)
  p.vline(X(29), 67, 8, C.metal0)
  p.rect(X(16 - out, 22), 78, 22, 3, C.line)
  p.rect(X(17 - out, 20), 79, 20, 1, C.metal2)

  // housing
  const hx = 10 - out
  p.rrect(X(hx, 15), 82, 15, 50, 5, C.line)
  p.rrect(X(hx + 1, 13), 83, 13, 48, 4, C.metal1)
  p.rrect(X(hx + 2, 9), 85, 9, 44, 3, C.metal2)
  p.vline(X(hx + 3), 88, 36, C.metal3)
  p.rect(X(hx + 5, 3), 104, 3, 6, C.orange) // logo badge
  p.px(X(hx + 6), 105, C.gold)
  p.vline(X(hx + 12), 86, 42, C.metal0)

  // foam pad
  const fx = 24 - out
  const fw = 15 + kick
  p.rrect(X(fx, fw), 83, fw, 48, 7, C.line)
  p.rrect(X(fx + 1, fw - 2), 84, fw - 2, 46, 6, C.orangeLo)
  p.rrect(X(fx + 1, fw - 4), 85, fw - 4, 43, 5, C.orange)
  for (let y = 87; y < 127; y++) {
    for (let x = fx + 2; x < fx + fw - 3; x++) {
      const n = (x * 7 + y * 13 + x * y) % 11 // foam texture
      if (n === 0) p.px(X(x), y, C.orangeHi)
      else if (n === 5) p.px(X(x), y, C.orangeLo)
    }
  }
  p.vline(X(fx + 3), 90, 8, C.orangeHi)
  p.vline(X(fx + 2), 96, 18, C.orangeHi)
  p.rect(X(fx + 1, fw - 2), 128, fw - 2, 1, C.orangeDk)
}

// the headphones' shadow on the floor
function floor(p: Pixels) {
  p.dither(4, 132, 2 * HC - 8, 3, C.shadow, 2)
  p.dither(14, 135, 2 * HC - 28, 1, C.shadow, 1)
}

// from the bottom of the right cup, along the floor, into the walkman's side jack
function cable(p: Pixels, t: number, running: boolean, L: Layout) {
  const sway = t ? Math.sin(t * (running ? 2.2 : 0.8)) * (running ? 3 : 1) : 0
  const right = L.cable === 'right'
  const x0 = (right ? 2 * HC - 17 : 17) + L.px
  const y0 = 131 + L.py
  const x1 = L.wx + 58
  const y1 = 171 + L.wy
  // under the cups along the floor, or down the walkman's left side
  const cx = (right ? x0 + 6 : Math.min(x0, x1) - 6) + sway
  const cy = right ? L.H + 4 : (y0 + y1) / 2
  p.curve(x0, y0, cx, cy, x1, y1, C.line, 32)
  p.curve(x0 + 1, y0, cx + 1, cy - 1, x1, y1 - 1, '#2f3f39', 32)
}

function plug(p: Pixels) {
  // strain relief + plug into the side jack
  p.rect(58, 168, 9, 6, C.line)
  p.rect(59, 169, 7, 4, C.shell1)
  p.rect(66, 167, 10, 8, C.line)
  p.rect(67, 168, 8, 6, C.metal1)
  p.hline(67, 168, 8, C.metal3)
  p.vline(71, 168, 6, C.metal0)
  p.rect(76, 169, 4, 4, C.metal2)
}

function notes(p: Pixels, t: number) {
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1
    const phase = (t * 0.32 + i / 8) % 1
    const sx = side < 0 ? 16 : 2 * HC - 20
    const x = Math.round(sx + side * phase * 8 + Math.sin(phase * 7 + i) * 4)
    const y = Math.round(80 - phase * 70)
    p.sprite(x, y, NOTES[i % 2]!, NOTE_COLORS[i % 4]!, phase > 0.72)
  }
}

function body(p: Pixels, s: WalkmanState) {
  // keys along the top edge, drawn first so the body hides their lower half
  for (const k of keys) {
    const down = s.down === k.id
    const top = k.y + (down ? 5 : 1)
    const play = k.id === 'play'
    p.rect(k.x, top, k.w, 60 - top, C.line)
    p.rect(k.x + 1, top + 1, k.w - 2, 60 - top, play ? C.orange : C.metal1)
    p.hline(k.x + 1, top + 1, k.w - 2, play ? C.orangeHi : C.metal3)
    p.vline(k.x + 1, top + 1, 60 - top, play ? C.orangeHi : C.metal2)
    p.vline(k.x + k.w - 2, top + 2, 60 - top, play ? C.orangeLo : C.metal0)
    const ix = k.x + Math.floor(k.w / 2)
    const iy = top + 3
    const ink = play ? C.line : C.shell0
    if (k.id === 'play') p.sprite(ix - 1, iy, ['100', '110', '111', '110', '100'], ink)
    if (k.id === 'stop') p.rect(ix - 2, iy + 1, 4, 4, ink)
    if (k.id === 'ff') p.sprite(ix - 3, iy, ['100100', '110110', '111111', '110110', '100100'], ink)
    if (k.id === 'rew') p.sprite(ix - 3, iy, ['001001', '011011', '111111', '011011', '001001'], ink)
  }

  // shadow + shell
  p.rrect(84, 66, 144, 130, 8, C.shadow)
  p.panel(78, 58, 144, 132, 8, C.body2, C.body4, C.body0, C.line)
  p.hline(86, 60, 128, C.body5)
  p.vline(80, 66, 116, C.body3)
  p.dither(81, 176, 138, 11, C.body1, 2)

  // volume wheel poking out of the right side
  p.rect(221, 92, 6, 34, C.line)
  p.rect(222, 93, 4, 32, C.metal1)
  for (let y = 94; y < 124; y += 2) p.hline(222, y, 4, C.metal0)
  p.vline(222, 93, 32, C.metal3)

  // screws
  for (const [x, y] of [[83, 63], [215, 63], [83, 183], [215, 183]] as const) {
    p.rect(x, y, 3, 3, C.body0)
    p.px(x + 1, y + 1, C.metal2)
  }
}

function cassette(p: Pixels, t: number, s: WalkmanState) {
  // smoked window in the lid
  p.rrect(87, 63, 126, 74, 4, C.line)
  p.rrect(88, 64, 124, 72, 3, C.window)

  // cassette shell
  p.rrect(92, 67, 116, 67, 3, C.shell0)
  p.rrect(93, 68, 114, 65, 2, C.shell1)
  p.hline(94, 68, 112, C.shell2)
  for (const [x, y] of [[95, 70], [203, 70], [95, 129], [203, 129], [148, 129]] as const) {
    p.rect(x, y, 2, 2, C.shell0)
    p.px(x, y, C.shell3)
  }

  // paper label: orange band, ruled lines, a big side A
  p.rect(96, 70, 108, 31, C.cream)
  p.rect(96, 70, 108, 3, C.orange)
  p.hline(96, 73, 108, C.orangeLo)
  for (const y of [81, 88, 95]) p.hline(110, y, 92, '#e4dcc0')
  p.text(99, 78, 'A', C.orange, 1, 2)
  p.frame(96, 70, 108, 31, '#b9ae8c')

  p.text(97, 112, 'C-60', C.shell3)
  p.text(189, 112, 'NR', C.shell3)

  // tape window with the two packs
  p.rect(115, 103, 70, 25, C.line)
  p.rect(116, 104, 68, 23, '#120c09')
  const take = Math.min(1, Math.max(0, s.progress))
  const reels: [number, number][] = [
    [132, 4 + Math.round(6 * (1 - take))],
    [168, 4 + Math.round(6 * take)],
  ]
  const speed = s.shuttle ? s.shuttle * 26 : s.running ? 5 : 0
  if (t && lastT) angle += speed * Math.min(0.2, t - lastT)
  lastT = t
  for (const [cx, r] of reels) {
    const cy = 115
    if (r > 4) {
      p.disc(cx, cy, r, C.tape)
      p.ring(cx, cy, r, C.tapeHi)
      // a glint on the pack edge shows it turning
      const g = angle * 0.6
      p.px(cx + Math.cos(g) * (r - 1), cy + Math.sin(g) * (r - 1), C.tapeHi)
    }
    p.disc(cx, cy, 4, C.cream)
    p.disc(cx, cy, 2, C.shell0)
    for (let k = 0; k < 6; k++) {
      const a = angle + (k * Math.PI) / 3
      p.px(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, C.shell1)
    }
  }
  // tape crossing the opening at the bottom, over the guide rollers
  p.rect(100, 129, 100, 3, C.shell0)
  p.hline(104, 130, 92, C.tape)
  p.disc(105, 130, 1, C.metal1)
  p.disc(195, 130, 1, C.metal1)

  // glass: fixed streaks plus a shine that sweeps across now and then
  for (let i = 0; i < 18; i++) {
    p.mix(92 + i, 84 - i, '#ffffff', 0.12)
    p.mix(97 + i, 84 - i, '#ffffff', 0.08)
  }
  const sweep = t ? ((t % 7) / 7) * 260 - 60 : -99
  for (let y = 64; y < 136; y++) {
    for (let w = 0; w < 5; w++) {
      const x = sweep + w + (136 - y) * 0.6
      if (x >= 88 && x < 212) p.mix(x, y, '#ffffff', w === 2 ? 0.16 : 0.08)
    }
  }
}

function panel(p: Pixels, t: number, s: WalkmanState, kick: number) {
  // LCD: tape counter, status, spectrum
  p.rect(86, 142, 74, 24, C.line)
  p.rect(87, 143, 72, 22, C.lcd)
  p.segText(91, 146, '88:88', 5, 9, C.lcdGhost, C.lcdGhost, 2)
  p.segText(91, 146, s.elapsed, 5, 9, C.lcdOn, null, 2)
  p.text(91, 158, s.status.slice(0, 8), C.lcdOn)
  for (let i = 0; i < 8; i++) {
    const x = 128 + i * 3
    let level = 0
    if (s.running && t) {
      const v = (0.5 + 0.5 * Math.sin(t * 6.1 + i * 1.7)) * (0.55 + 0.45 * Math.sin(t * 3.3 + i * 0.9 + 1))
      level = Math.round(Math.min(1, v * 1.2 + kick * (i < 3 ? 0.45 : 0.15)) * 6)
    } else if (s.shuttle) level = (i + Math.floor(t * 20)) % 7
    for (let c = 0; c < 6; c++) p.rect(x, 160 - c * 2, 2, 1, c < level ? (c > 4 ? C.gold : C.lcdOn) : C.lcdGhost)
  }
  p.hline(87, 143, 72, '#183f2e')

  // branding
  p.text(166, 144, 'LUCKY-MAN', C.cream)
  p.text(166, 151, 'AUTO REVERSE', C.gold)
  const led = s.running ? (t && Math.floor(t * 2) % 4 === 3 ? C.orangeLo : C.orangeHi) : C.orangeDk
  p.rect(166, 158, 5, 5, C.line)
  p.rect(167, 159, 3, 3, led)
  if (s.running) p.px(167, 159, C.gold)
  p.text(174, 158, s.running ? 'BATT' : 'HOLD', C.beige)

  // stripe and model plate
  p.rect(80, 170, 140, 5, C.orange)
  p.hline(80, 170, 140, C.orangeHi)
  p.hline(80, 174, 140, C.orangeLo)
  p.text(88, 179, 'WM-112', C.body4)
  p.text(176, 179, 'STEREO', C.body4)
}

export function drawWalkman(p: Pixels, t: number, s: WalkmanState, L: Layout = LAYOUTS.wide) {
  const kick = s.running && beat(t) < 0.22 ? 1 : 0
  p.origin(L.px, L.py)
  floor(p)
  headband(p)
  cup(p, -1, kick)
  cup(p, 1, kick)
  p.origin(0, 0)
  cable(p, t, s.running, L)
  p.origin(L.wx, L.wy)
  plug(p)
  body(p, s)
  cassette(p, t, s)
  panel(p, t, s, kick)
  if (s.running && t) {
    p.origin(L.px, L.py)
    notes(p, t)
  }
  p.origin(0, 0)
}
