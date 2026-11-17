export const mmss = (s: number) =>
  `${String(Math.floor(s / 60) % 100).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function ago(uts: number | null) {
  if (!uts) return 'now'
  const m = Math.max(1, Math.round((Date.now() / 1000 - uts) / 60))
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.round(m / 60)}h`
  return `${Math.round(m / 1440)}d`
}
