export const ASPECT = 0.55; // cell width / line height

export interface AsciiCell {
  x: number;
  y: number;
  ch: string;
  color: string;
}
export interface AsciiArt {
  cols: number;
  lines: number;
  cells: AsciiCell[];
}

const CHARSET =
  "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
let ramp: { d: number; ch: string }[] | null = null;

function glyphRamp(count = 48) {
  if (ramp) return ramp;
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 48;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.font = '700 40px "Hack Nerd Font", monospace';
  g.textBaseline = "top";
  const dens = [...CHARSET].map((ch) => {
    g.clearRect(0, 0, c.width, c.height);
    g.fillText(ch, 0, 0);
    const a = g.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 3; i < a.length; i += 4) sum += a[i]!;
    return { d: sum, ch };
  });
  dens.sort((a, b) => a.d - b.d);
  const lo = dens[0]!.d;
  const hi = dens.at(-1)!.d;
  const norm = dens.map((x) => ({ d: (x.d - lo) / (hi - lo), ch: x.ch }));
  const picks: { d: number; ch: string }[] = [];
  for (let k = 0; k < count; k++) {
    const target = k / (count - 1);
    const best = norm.reduce((a, b) =>
      Math.abs(b.d - target) < Math.abs(a.d - target) ? b : a,
    );
    if (picks.at(-1)?.ch !== best.ch) picks.push(best);
  }
  ramp = picks;
  return picks;
}

function nearestGlyph(target: number) {
  const r = glyphRamp();
  let best = r[0]!;
  for (const g of r)
    if (Math.abs(g.d - target) < Math.abs(best.d - target)) best = g;
  return best.ch;
}

// --- colour helpers ----------------------------------------------------------------------
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h =
    mx === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : mx === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (!s) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
const hex = (v: number) =>
  Math.round(Math.max(0, Math.min(255, v)))
    .toString(16)
    .padStart(2, "0");

export async function imageToAscii(
  src: string,
  cols = 110,
  fixedLines?: number,
): Promise<AsciiArt> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const lines =
    fixedLines ?? Math.max(1, Math.round((ih / iw) * cols * ASPECT));
  // source rectangle with the same shape as the grid on screen
  const want = cols / (lines / ASPECT); // width / height of the drawn art
  let sw = iw;
  let sh = ih;
  if (iw / ih > want) sw = ih * want;
  else sh = iw / want;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) * 0.35;

  // downscale in two steps so the average colour per cell is smooth
  const mid = document.createElement("canvas");
  mid.width = cols * 4;
  mid.height = lines * 4;
  const mg = mid.getContext("2d")!;
  mg.imageSmoothingQuality = "high";
  mg.drawImage(img, sx, sy, sw, sh, 0, 0, mid.width, mid.height);
  const small = document.createElement("canvas");
  small.width = cols;
  small.height = lines;
  const sg = small.getContext("2d", { willReadFrequently: true })!;
  sg.imageSmoothingQuality = "high";
  sg.drawImage(mid, 0, 0, cols, lines);
  const px = sg.getImageData(0, 0, cols, lines).data;

  const n = cols * lines;
  const lum = new Float32Array(n);
  const sat = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = px[i * 4]! / 255;
    const g = px[i * 4 + 1]! / 255;
    const b = px[i * 4 + 2]! / 255;
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const mx = Math.max(r, g, b);
    sat[i] = mx ? (mx - Math.min(r, g, b)) / mx : 0;
  }

  const sorted = Array.from(lum).sort((a, b) => a - b);
  const lo = sorted[Math.floor(n * 0.02)]!;
  const hi = sorted[Math.floor(n * 0.98)]!;
  const order = Array.from(lum.keys()).sort((a, b) => lum[a]! - lum[b]!);
  const rank = new Float32Array(n);
  order.forEach((idx, k) => (rank[idx] = k / (n - 1)));
  for (let i = 0; i < n; i++) {
    let v = Math.min(1, Math.max(0, (lum[i]! - lo) / Math.max(hi - lo, 1e-6)));
    v = Math.pow(0.5 * v + 0.5 * rank[i]!, 1.1);
    if (v > 0.82 && sat[i]! < 0.16) v = 0.82 - (v - 0.82) * 2.5;
    lum[i] = v;
  }

  const cells: AsciiCell[] = [];
  for (let y = 0; y < lines; y++) {
    for (let x = 0; x < cols; x++) {
      const u = Math.abs(((x + 0.5) / cols) * 2 - 1);
      const v = Math.abs(((y + 0.5) / lines) * 2 - 1);
      const p = fixedLines ? 14 : 6;
      const d =
        Math.pow(u ** p + v ** p, 1 / p) +
        (Math.random() - 0.5) * (fixedLines ? 0.03 : 0.07);
      if (d >= 1) continue;
      const fade = Math.min(
        1,
        Math.max(0.3, (1 - d) / (fixedLines ? 0.05 : 0.12)),
      );
      const i = y * cols + x;
      const l = lum[i]!;
      const [h, s] = rgbToHsl(
        px[i * 4]! / 255,
        px[i * 4 + 1]! / 255,
        px[i * 4 + 2]! / 255,
      );
      // vivid colour; glyph density carries the brightness
      const [r, g, b] = hslToRgb(
        h,
        Math.min(1, s * 1.6 + 0.1),
        0.45 + 0.45 * l,
      );
      const bg = [13, 26, 26];
      const color = `#${hex(r * 255 * fade + bg[0]! * (1 - fade))}${hex(g * 255 * fade + bg[1]! * (1 - fade))}${hex(b * 255 * fade + bg[2]! * (1 - fade))}`;
      cells.push({ x, y, ch: nearestGlyph(0.08 + 0.92 * l), color });
    }
  }
  return { cols, lines, cells };
}
