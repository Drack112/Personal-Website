import { ref } from 'vue'

import { settings } from '@/composables/useSettings'
import type { Theme } from '@/data/themes'

const NOISE_MS = 700

export const theme = ref<Theme>('original')
export const shifting = ref<Theme | null>(null)

let noiseTimer = 0

function apply(next: Theme) {
  theme.value = next
  if (next === 'original') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = next
}

export function setTheme(next: Theme) {
  if (next === theme.value) return
  apply(next)
  window.clearTimeout(noiseTimer)

  if (!settings.motion.value) {
    shifting.value = null
    return
  }

  shifting.value = next
  noiseTimer = window.setTimeout(() => (shifting.value = null), NOISE_MS)
}
