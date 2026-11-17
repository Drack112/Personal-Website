import type { Theme } from '@/data/themes'

export type ScreenItem =
  | { kind: 'youtube'; key: string; id: string; ep: number; playlistId: string; title: string; label: string; fill?: boolean }
  | { kind: 'image'; key: string; url: string; title: string; label: string }

export interface GuideItem {
  screen: ScreenItem
  num: string
  title: string
  thumb?: string
  theme?: Theme
}

export interface Category {
  id: string
  group: string
  title: string
  subtitle: string
  icon: string
  link?: string
  linkLabel?: string
  via?: { name: string; url: string; text: string }
  items: GuideItem[]
}
