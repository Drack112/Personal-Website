type Rgb = readonly [number, number, number]

export const themes = {
  original: { noise: [0.9, 1.05, 0.95] as Rgb },
  mizer: { noise: [1.05, 0.8, 1.15] as Rgb },
}

export type Theme = keyof typeof themes
