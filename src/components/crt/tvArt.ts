// Pixel art of a 90s CRT television sitting on a VCR. Everything is drawn in
// art pixels (W x H); the screen is a transparent hole the picture shows through.
import type { Pixels } from '@/lib/pixel'

export const W = 256
export const H = 238

export const SCREEN = { x: 30, y: 62, w: 152, h: 114 }
export const DIAL = { x: 202, y: 80, w: 28, h: 28 }
export const CH_DOWN = { x: 200, y: 121, w: 14, h: 9 }
export const CH_UP = { x: 218, y: 121, w: 14, h: 9 }
export const POWER = { x: 200, y: 136, w: 22, h: 11 }

export interface TvState {
  on: boolean
  powering: boolean
  switching: boolean
  channel: string // two characters for the seven-segment display
  dial: number // channel steps turned so far (the knob eases towards it)
  pressed: 'up' | 'down' | 'power' | null
  playTime: number | null // seconds into the video on screen, null when nothing is playing
  playing: boolean // the video is running (not paused / buffering)
  now: Date
}

const C = {
  line: '#0e1f1c',
  shadow: '#060a09',
  case0: '#202624',
  case1: '#2b3230',
  case2: '#363e3b',
  case3: '#444d4a',
  case4: '#56605c',
  case5: '#6e7975',
  case6: '#8f9a95',
  bezel0: '#0b0d0d',
  bezel1: '#121514',
  bezel2: '#1a1e1d',
  bezel3: '#242a28',
  metal0: '#5d6461',
  metal1: '#9aa39f',
  metal2: '#c9cfcc',
  metal3: '#eef2ef',
  red: '#ff5a36',
  redGhost: '#2a0f0b',
  redLo: '#4a1f10',
  green: '#a9dc88',
  lime: '#d4f5b4',
  orange: '#cb6e1b',
  gold: '#fef274',
  cream: '#f3ebd3',
  teal: '#5c8895',
  vfd: '#7ef0d0',
  vfdGhost: '#0f221e',
  rcaYellow: '#fef274',
  rcaWhite: '#f3ebd3',
  rcaRed: '#d8452a',
}

// the dial eases towards the target between frames
let dialShown = 0

function antenna(p: Pixels) {
  const bx = 150
  const by = 36
  const tips: [number, number][] = [
    [92, 5],
    [214, 11],
  ]
  for (const [tx, ty] of tips) {
    const at = (k: number): [number, number] => [bx + (tx - bx) * k, by + (ty - by) * k]
    // thick lower section, thinner telescoping pieces above it
    const [mx, my] = at(0.42)
    const [nx, ny] = at(0.74)
    p.line(bx, by, mx, my, C.metal0)
    p.line(bx + 1, by, mx + 1, my, C.metal1)
    p.line(bx, by - 1, mx, my - 1, C.metal2)
    p.line(mx, my, nx, ny, C.metal1)
    p.line(mx, my - 1, nx, ny - 1, C.metal3)
    p.line(nx, ny, tx, ty, C.metal2)
    // joints
    p.rect(mx - 1, my - 1, 3, 2, C.metal0)
    p.rect(nx - 1, ny - 1, 2, 2, C.metal0)
    // ball tip
    p.disc(tx, ty, 2, C.metal1)
    p.px(tx - 1, ty - 1, C.metal3)
    p.px(tx + 1, ty + 1, C.metal0)
  }
  // dome base
  p.rrect(136, 30, 30, 16, 7, C.line)
  p.rrect(137, 31, 28, 15, 6, C.case2)
  p.hline(141, 32, 18, C.case4)
  p.hline(139, 33, 6, C.case5)
  p.dither(138, 40, 26, 5, C.case1, 2)
  p.rect(146, 34, 8, 3, C.case0)
  p.px(147, 34, C.metal1)
}

function caseBody(p: Pixels, t: number, s: TvState) {
  // feet
  p.rrect(34, 200, 30, 12, 3, C.line)
  p.rrect(35, 201, 28, 10, 2, C.case0)
  p.rrect(192, 200, 30, 12, 3, C.line)
  p.rrect(193, 201, 28, 10, 2, C.case0)

  // shell
  p.panel(12, 44, 232, 160, 10, C.case2, C.case4, C.case0, C.line)
  p.hline(20, 46, 216, C.case5) // light along the top edge
  p.hline(16, 47, 4, C.case5)
  p.vline(14, 52, 140, C.case3)
  p.dither(15, 186, 226, 14, C.case1, 2) // shade towards the bottom
  p.dither(15, 196, 226, 6, C.case1, 3)
  // glints
  p.rect(18, 49, 3, 1, C.case6)
  p.px(18, 50, C.case6)
  p.px(232, 48, C.case6)

  // chin separation
  p.hline(18, 191, 220, C.case0)
  p.hline(18, 192, 220, C.case4)

  // corner screws
  for (const [x, y] of [[18, 52], [236, 52], [18, 196], [236, 196]] as const) {
    p.rect(x, y, 3, 3, C.metal0)
    p.px(x, y, C.metal2)
    p.line(x, y + 2, x + 2, y, C.case0)
  }

  // bezel around the tube
  p.rrect(22, 54, 168, 134, 12, C.line)
  p.rrect(23, 55, 166, 132, 11, C.bezel3)
  p.rrect(24, 56, 164, 130, 11, C.bezel2)
  p.rrect(27, 59, 158, 120, 12, C.bezel1)
  p.rrect(28, 60, 156, 118, 11, C.bezel0)

  // the tube glows on the bezel while it is on
  const glow = s.on && !s.powering ? (t && Math.floor(t * 9) % 7 === 0 ? '#2a4236' : '#22382d') : s.powering ? C.lime : C.bezel0
  p.rrect(29, 61, 154, 116, 11, glow)
  p.rrect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 10, null)
  p.hline(40, 186, 140, C.case4) // lower lip catches the light

  // brand under the screen
  const brand = 'DRACK·VISION'
  const bw = brand.length * 4 - 1
  p.text(106 - bw / 2 + 1, 181, brand, C.line)
  p.text(106 - bw / 2, 180, brand, s.on ? C.cream : C.metal1)
}

function controls(p: Pixels, t: number, s: TvState) {
  const live = s.on && !s.powering
  // panel recess
  p.rrect(196, 54, 40, 134, 4, C.case1)
  p.vline(196, 58, 126, C.case0)
  p.vline(235, 58, 126, C.case3)

  // seven-segment channel display
  p.rect(199, 58, 34, 17, C.line)
  p.rect(200, 59, 32, 15, '#140806')
  p.text(202, 64, 'CH', live ? '#7a2a1a' : C.redGhost)
  const blink = s.switching && Math.floor(t * 12) % 2
  p.segText(213, 61, s.channel.padStart(2, ' ').slice(-2), 6, 11, live && !blink ? C.red : C.redGhost, C.redGhost, 2)
  p.hline(200, 59, 32, '#2a1411') // glass glare
  p.px(201, 60, '#4a2219')

  // rotary tuner with tick marks
  dialShown += (s.dial - dialShown) * 0.35
  if (Math.abs(s.dial - dialShown) < 0.01) dialShown = s.dial
  const cx = 216
  const cy = 94
  const step = (Math.PI * 2) / 12
  const active = ((Math.round(s.dial) % 12) + 12) % 12
  for (let i = 0; i < 12; i++) {
    const a = i * step - Math.PI / 2
    p.px(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, i === active && live ? C.gold : C.case4)
  }
  const angle = dialShown * step - Math.PI / 2
  p.disc(cx + 1, cy + 2, 12, C.shadow)
  p.disc(cx, cy, 12, C.line)
  p.disc(cx, cy, 11, C.case3)
  for (let k = 0; k < 36; k++) {
    const a = angle + (k * Math.PI * 2) / 36
    p.px(cx + Math.cos(a) * 10.4, cy + Math.sin(a) * 10.4, k % 2 ? C.case5 : C.case0)
  }
  p.disc(cx, cy, 8, C.case4)
  p.disc(cx, cy, 6, C.case3)
  p.px(cx - 4, cy - 5, C.case6)
  p.px(cx - 5, cy - 4, C.case6)
  p.px(cx - 3, cy - 6, C.case5)
  p.line(cx, cy, cx + Math.cos(angle) * 7, cy + Math.sin(angle) * 7, C.cream)
  p.px(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8, C.orange)
  p.text(209, 112, 'TUNE', C.case5)

  // CH -/+ buttons
  const button = (r: { x: number; y: number; w: number; h: number }, down: boolean, icon: (x: number, y: number) => void) => {
    const o = down ? 1 : 0
    p.rect(r.x, r.y, r.w, r.h, C.line)
    p.rect(r.x + 1, r.y + 1 + o, r.w - 2, r.h - 2 - o, down ? C.case2 : C.case4)
    if (!down) {
      p.hline(r.x + 1, r.y + 1, r.w - 2, C.case6)
      p.hline(r.x + 1, r.y + r.h - 2, r.w - 2, C.case2)
    }
    icon(r.x + Math.floor(r.w / 2), r.y + 3 + o)
  }
  button(CH_DOWN, s.pressed === 'down', (x, y) => {
    p.hline(x - 2, y, 5, C.cream)
    p.hline(x - 1, y + 1, 3, C.cream)
    p.px(x, y + 2, C.cream)
  })
  button(CH_UP, s.pressed === 'up', (x, y) => {
    p.px(x, y, C.cream)
    p.hline(x - 1, y + 1, 3, C.cream)
    p.hline(x - 2, y + 2, 5, C.cream)
  })

  // power switch and standby / on LED
  button(POWER, s.pressed === 'power', (x, y) => {
    p.ring(x, y + 1, 2, s.on ? C.gold : C.metal1)
    p.vline(x, y - 1, 2, s.on ? C.gold : C.metal1)
  })
  const led = s.powering ? C.gold : s.on ? C.green : C.red
  p.rect(225, 139, 5, 5, C.line)
  p.rect(226, 140, 3, 3, led)
  if (s.on || s.powering) p.px(226, 140, C.lime)
  p.text(200, 149, 'POWER', C.case5)

  // speaker grille: slots with a lit lower lip; they shiver a little with sound
  for (let i = 0; i < 10; i++) {
    const y = 158 + i * 3
    const shake = live && t && Math.sin(t * 22 + i * 1.7) > 0.7 ? 1 : 0
    p.hline(201 + shake, y, 30, C.bezel0)
    p.hline(201, y + 1, 30, C.case3)
  }
}

function frontJacks(p: Pixels) {
  // composite AV input in the chin
  const jacks: [number, string][] = [[30, C.rcaYellow], [40, C.rcaWhite], [50, C.rcaRed]]
  for (const [x, c] of jacks) {
    p.disc(x, 197, 3, C.line)
    p.disc(x, 197, 2, c)
    p.rect(x - 1, 196, 2, 2, C.line)
    p.px(x - 2, 195, C.metal3)
  }
  p.text(58, 195, 'AV', C.case5)
  // STEREO sticker in the site colours
  p.rect(148, 194, 40, 7, C.line)
  p.rect(149, 195, 4, 5, C.orange)
  p.rect(153, 195, 4, 5, C.gold)
  p.rect(157, 195, 4, 5, C.green)
  p.text(163, 195, 'STEREO', C.metal2)
}

function vcr(p: Pixels, t: number, s: TvState) {
  const live = s.on && !s.powering
  // soft floor shadow
  p.dither(14, 234, 228, 3, C.shadow, 2)
  p.dither(28, 237, 200, 1, C.shadow, 1)
  // body
  p.panel(18, 210, 220, 26, 3, C.case1, C.case3, C.case0, C.line)
  p.hline(20, 211, 216, C.case4)
  p.hline(22, 220, 104, C.case0)

  // tape door
  p.rect(34, 215, 92, 13, C.line)
  p.rect(35, 216, 90, 11, C.bezel1)
  p.hline(35, 216, 90, C.case3)
  p.hline(35, 226, 90, C.bezel0)
  for (let x = 40; x < 122; x += 6) p.px(x, 221, C.bezel3) // ribs on the flap
  p.text(36, 230, 'VIDEO', C.case4)
  p.text(100, 230, '4HEAD', C.case4)

  // vacuum fluorescent display: the time of day when idle, the video's running time while one plays
  p.rect(134, 214, 54, 16, C.line)
  p.rect(135, 215, 52, 14, '#07100e')
  p.segText(147, 217, '88:88', 5, 9, C.vfdGhost, C.vfdGhost, 2)
  const counting = live && s.playTime !== null
  if (counting) {
    const sec = Math.floor(s.playTime!)
    const two = (n: number) => String(n).padStart(2, '0')
    const text = sec < 3600 ? `${two(Math.floor(sec / 60))}:${two(sec % 60)}` : `${String(Math.floor(sec / 3600)).padStart(2, ' ')}:${two(Math.floor(sec / 60) % 60)}`
    p.segText(147, 217, text, 5, 9, C.vfd, null, 2)
    if (s.playing) {
      // play arrow that steps forward like a tape counter
      const f = t ? Math.floor(t * 4) % 3 : 0
      p.text(137, 219, '>', f === 2 ? C.vfdGhost : C.vfd)
      p.px(137 + 4 + f, 223, C.vfd)
    } else {
      // paused: two bars, blinking
      const c = !t || Math.floor(t * 2) % 2 ? C.vfd : C.vfdGhost
      p.vline(137, 219, 5, c)
      p.vline(139, 219, 5, c)
    }
  } else {
    const clock = `${String(s.now.getHours()).padStart(2, '0')}:${String(s.now.getMinutes()).padStart(2, '0')}`
    p.segText(147, 217, clock, 5, 9, C.vfd, null, 2)
    if (s.now.getSeconds() % 2) {
      // the colon ticks with the seconds
      p.px(161, 220, C.vfdGhost)
      p.px(161, 222, C.vfdGhost)
    }
    p.text(137, 219, '>', C.vfdGhost)
  }
  p.hline(135, 215, 52, '#12241f')

  // deck buttons and the red REC
  for (let i = 0; i < 4; i++) {
    const x = 196 + i * 9
    p.rect(x, 222, 7, 5, C.line)
    p.rect(x + 1, 223, 5, 3, i === 3 ? C.rcaRed : C.case3)
    p.hline(x + 1, 223, 5, i === 3 ? '#f07a5c' : C.case5)
  }
  p.text(196, 215, 'VCR', C.case5)
  p.rect(214, 216, 3, 3, live ? C.green : C.redLo)
}

export function drawTv(p: Pixels, t: number, s: TvState) {
  antenna(p)
  caseBody(p, t, s)
  controls(p, t, s)
  frontJacks(p)
  vcr(p, t, s)
}
