// Tiny pixel-art painter: draws into a low-resolution RGBA buffer that a
// <canvas> shows scaled up with `image-rendering: pixelated`.

export type Color = string | null // '#rrggbb', null = transparent (a hole)

const cache = new Map<string, number>()

// '#rrggbb' -> the same colour as a little-endian RGBA word for Uint32Array
function word(c: Color): number {
  if (!c) return 0
  let v = cache.get(c)
  if (v === undefined) {
    const n = parseInt(c.slice(1), 16)
    v = ((0xff << 24) | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0
    cache.set(c, v)
  }
  return v
}

// 3x5 font: 15 bits per glyph, row by row, most significant bit first
const FONT: Record<string, number> = {}
const glyphs: [string, string][] = [
  ['0', '111101101101111'], ['1', '010110010010111'], ['2', '111001111100111'], ['3', '111001111001111'],
  ['4', '101101111001001'], ['5', '111100111001111'], ['6', '111100111101111'], ['7', '111001001010010'],
  ['8', '111101111101111'], ['9', '111101111001111'], ['A', '010101111101101'], ['B', '110101110101110'],
  ['C', '011100100100011'], ['D', '110101101101110'], ['E', '111100110100111'], ['F', '111100110100100'],
  ['G', '011100101101011'], ['H', '101101111101101'], ['I', '111010010010111'], ['J', '001001001101010'],
  ['K', '101101110101101'], ['L', '100100100100111'], ['M', '101111111101101'], ['N', '110101101101101'],
  ['O', '010101101101010'], ['P', '110101110100100'], ['Q', '010101101110011'], ['R', '110101110101101'],
  ['S', '011100010001110'], ['T', '111010010010010'], ['U', '101101101101111'], ['V', '101101101101010'],
  ['W', '101101111111101'], ['X', '101101010101101'], ['Y', '101101010010010'], ['Z', '111001010100111'],
  [':', '000010000010000'], ['-', '000000111000000'], ['.', '000000000000010'], ['·', '000000010000000'],
  ['/', '001001010100100'], ['!', '010010010000010'], ['?', '110001010000010'], ['+', '000010111010000'],
  ['>', '100110111110100'], ['<', '001011111011001'], ['=', '000111000111000'], ['♥', '000101111111010'],
]
for (const [ch, bits] of glyphs) FONT[ch] = parseInt(bits, 2)

// which of the seven segments (a b c d e f g) light up for each character
const SEG: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg',
  '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '',
  A: 'abcefg', C: 'adef', E: 'adefg', F: 'aefg', H: 'bcefg', L: 'def', P: 'abefg', U: 'bcdef',
}

export class Pixels {
  readonly data: Uint32Array
  private readonly image: ImageData
  // drawing offset, so a part of a scene can be drawn in its own coordinates
  private ox = 0
  private oy = 0

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.image = new ImageData(w, h)
    this.data = new Uint32Array(this.image.data.buffer)
  }

  clear() {
    this.data.fill(0)
    this.origin(0, 0)
  }

  origin(x: number, y: number) {
    this.ox = x
    this.oy = y
  }

  copy(from: Pixels) {
    this.data.set(from.data)
  }

  px(x: number, y: number, c: Color) {
    x = (x + this.ox) | 0
    y = (y + this.oy) | 0
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    this.data[y * this.w + x] = word(c)
  }

  rect(x: number, y: number, w: number, h: number, c: Color) {
    x += this.ox
    y += this.oy
    const v = word(c)
    const x0 = Math.max(0, x | 0)
    const x1 = Math.min(this.w, (x + w) | 0)
    for (let yy = Math.max(0, y | 0); yy < Math.min(this.h, (y + h) | 0); yy++) {
      if (x1 > x0) this.data.fill(v, yy * this.w + x0, yy * this.w + x1)
    }
  }

  hline(x: number, y: number, len: number, c: Color) {
    this.rect(x, y, len, 1, c)
  }

  vline(x: number, y: number, len: number, c: Color) {
    this.rect(x, y, 1, len, c)
  }

  frame(x: number, y: number, w: number, h: number, c: Color) {
    this.hline(x, y, w, c)
    this.hline(x, y + h - 1, w, c)
    this.vline(x, y, h, c)
    this.vline(x + w - 1, y, h, c)
  }

  // how far row `y` of a rounded rect starts inside its left/right edge
  private inset(y: number, h: number, r: number) {
    const d = Math.min(y, h - 1 - y)
    if (d >= r) return 0
    return r - Math.round(Math.sqrt(r * r - (r - d - 0.5) ** 2))
  }

  rrect(x: number, y: number, w: number, h: number, r: number, c: Color) {
    for (let i = 0; i < h; i++) {
      const s = this.inset(i, h, r)
      this.hline(x + s, y + i, w - 2 * s, c)
    }
  }

  // 1px outline of a rounded rect, with no gaps on the steep corner steps
  rframe(x: number, y: number, w: number, h: number, r: number, c: Color) {
    for (let i = 0; i < h; i++) {
      const s = this.inset(i, h, r)
      const prev = i === 0 || i === h - 1 ? w : this.inset(i < h / 2 ? i - 1 : i + 1, h, r)
      const run = Math.max(1, prev - s)
      if (i === 0 || i === h - 1) {
        this.hline(x + s, y + i, w - 2 * s, c)
        continue
      }
      this.hline(x + s, y + i, run, c)
      this.hline(x + w - s - run, y + i, run, c)
    }
  }

  // rounded rect with a 1px outline, a lit top/left edge and a shaded bottom/right edge
  panel(x: number, y: number, w: number, h: number, r: number, fill: Color, hi: Color, lo: Color, line: Color) {
    this.rrect(x, y, w, h, r, line)
    this.rrect(x + 1, y + 1, w - 2, h - 2, Math.max(0, r - 1), lo)
    this.rrect(x + 1, y + 1, w - 3, h - 3, Math.max(0, r - 1), hi)
    this.rrect(x + 2, y + 2, w - 4, h - 4, Math.max(0, r - 2), fill)
  }

  // ordered dither: `level` 0-4 of every 2x2 block painted
  dither(x: number, y: number, w: number, h: number, c: Color, level = 2) {
    const order = [0, 2, 3, 1] // 2x2 Bayer
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (order[(yy & 1) * 2 + (xx & 1)]! < level) this.px(xx, yy, c)
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color) {
    x0 = Math.round(x0)
    y0 = Math.round(y0)
    x1 = Math.round(x1)
    y1 = Math.round(y1)
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      this.px(x0, y0, c)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }

  // quadratic bezier as a chain of short lines
  curve(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, c: Color, steps = 24) {
    let px = x0
    let py = y0
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const u = 1 - t
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1
      const y = u * u * y0 + 2 * u * t * cy + t * t * y1
      this.line(px, py, x, y, c)
      px = x
      py = y
    }
  }

  disc(cx: number, cy: number, r: number, c: Color) {
    for (let y = -r; y <= r; y++) {
      const half = Math.round(Math.sqrt(r * r - y * y + r * 0.8))
      this.hline(cx - half, cy + y, half * 2 + 1, c)
    }
  }

  ring(cx: number, cy: number, r: number, c: Color) {
    let x = r
    let y = 0
    let err = 1 - r
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]] as const) {
        this.px(cx + a, cy + b, c)
      }
      y++
      if (err < 0) err += 2 * y + 1
      else {
        x--
        err += 2 * (y - x) + 1
      }
    }
  }

  // blend `c` over what is already there, `a` 0-1 (for glass glare)
  mix(x: number, y: number, c: string, a: number) {
    x = (x + this.ox) | 0
    y = (y + this.oy) | 0
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = y * this.w + x
    const under = this.data[i]!
    if (!under) return
    const over = word(c)
    let out = 0xff000000
    for (const shift of [0, 8, 16]) {
      const v = Math.round(((under >> shift) & 0xff) * (1 - a) + ((over >> shift) & 0xff) * a)
      out |= v << shift
    }
    this.data[i] = out >>> 0
  }

  // 3x5 text, each font pixel `scale` art pixels; returns the width it took.
  // Unknown characters print as blanks.
  text(x: number, y: number, str: string, c: Color, gap = 1, scale = 1) {
    let cx = x
    for (const ch of str.toUpperCase()) {
      const g = FONT[ch] ?? 0
      for (let i = 0; i < 15; i++) {
        if (g & (1 << (14 - i))) this.rect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale, c)
      }
      cx += 3 * scale + gap
    }
    return cx - x - gap
  }

  // a small bitmap given as rows of '1'/'0'; `skip` drops every other pixel (a dithered fade)
  sprite(x: number, y: number, rows: readonly string[], c: Color, skip = false) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === '1' && !(skip && (x + i + y + j) & 1)) this.px(x + i, y + j, c)
      }
    })
  }

  // one seven-segment character of w x h; unlit segments are drawn in `off`
  seg(x: number, y: number, ch: string, w: number, h: number, on: Color, off: Color = null) {
    const lit = SEG[ch.toUpperCase()] ?? ''
    const mid = Math.floor((h - 1) / 2)
    const bars: Record<string, [number, number, number, number]> = {
      a: [x + 1, y, w - 2, 1],
      b: [x + w - 1, y + 1, 1, mid - 1],
      c: [x + w - 1, y + mid + 1, 1, h - mid - 2],
      d: [x + 1, y + h - 1, w - 2, 1],
      e: [x, y + mid + 1, 1, h - mid - 2],
      f: [x, y + 1, 1, mid - 1],
      g: [x + 1, y + mid, w - 2, 1],
    }
    for (const [s, [bx, by, bw, bh]] of Object.entries(bars)) {
      const c = lit.includes(s) ? on : off
      if (c) this.rect(bx, by, bw, bh, c)
    }
  }

  segText(x: number, y: number, str: string, w: number, h: number, on: Color, off: Color = null, gap = 2) {
    let cx = x
    for (const ch of str) {
      if (ch === ':') {
        this.px(cx, y + Math.floor(h / 3), on)
        this.px(cx, y + h - 1 - Math.floor(h / 3), on)
        cx += 1 + gap
        continue
      }
      this.seg(cx, y, ch, w, h, on, off)
      cx += w + gap
    }
  }

  show(ctx: CanvasRenderingContext2D) {
    ctx.putImageData(this.image, 0, 0)
  }
}

// a rect in art pixels as absolute CSS percentages, for hotspots and overlays
export function place(r: { x: number; y: number; w: number; h: number }, W: number, H: number) {
  return {
    left: `${(r.x / W) * 100}%`,
    top: `${(r.y / H) * 100}%`,
    width: `${(r.w / W) * 100}%`,
    height: `${(r.h / H) * 100}%`,
  }
}
