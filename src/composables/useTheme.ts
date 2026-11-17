import { ref } from 'vue'

import { settings } from '@/composables/useSettings'
import { sfx } from '@/composables/useSound'
import type { Theme } from '@/data/themes'

const SWAP_MS = 420
const END_MS = 1100

export const theme = ref<Theme>('original')
export const shifting = ref<Theme | null>(null)

let swapTimer = 0
let endTimer = 0

function apply(next: Theme) {
  theme.value = next
  if (next === 'original') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = next
}

export function setTheme(next: Theme) {
  if (next === (shifting.value ?? theme.value)) return
  window.clearTimeout(swapTimer)
  window.clearTimeout(endTimer)

  if (!settings.motion.value) {
    shifting.value = null
    apply(next)
    return
  }

  shifting.value = next
  sfx.open()
  swapTimer = window.setTimeout(() => apply(next), SWAP_MS)
  endTimer = window.setTimeout(() => (shifting.value = null), END_MS)
}
