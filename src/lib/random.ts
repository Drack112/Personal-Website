export const rand = (a: number, b: number) => a + Math.random() * (b - a)

export const pick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!

export const loop = (min: number, max: number) => {
  const d = rand(min, max)
  return { animationDuration: `${d}s`, animationDelay: `${-rand(0, d)}s` }
}
