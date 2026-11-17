import dayjs from 'dayjs'

import type { Repo } from '@/composables/useGithub'
import type { Experience } from '@/data/profile'

export type Slot = 'github' | 'career'

export type Media = 'cart' | 'disc' | 'tape' | 'floppy'

export interface Save {
  id: string
  label: string
  glyph: string
  color: string
  badge?: string
  media?: Media
  date: string
  size: string
  repo?: Repo
  job?: Experience
}

export const ym = (value: string) => dayjs(value).format('MMM YYYY')

export const stamp = (value: string) => dayjs(value).format('YYYY/MM/DD')

export function months(start: string, end: string | null) {
  const total = (end ? dayjs(end) : dayjs()).diff(start, 'month') + 1
  const years = Math.floor(total / 12)
  const remaining = total % 12

  return [
    years && `${years} yr${years > 1 ? 's' : ''}`,
    remaining && `${remaining} mo${remaining > 1 ? 's' : ''}`,
  ].filter(Boolean).join(' ')
}

export const kb = (size: number) =>
  size >= 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`
