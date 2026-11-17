import { nextTick, ref } from 'vue'

import { sfx } from '@/composables/useSound'
import { cookieImages as stills } from '@/data/clips'

import { ASPECT, imageToAscii, type AsciiArt } from '../ascii'

export interface LogLine {
  text: string
  kind?: 'ok' | 'dim' | 'hooray'
}

interface Box {
  w: number
  h: number
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))

export function useCookieRoll(measure: () => Box) {
  const log = ref<LogLine[]>([])
  const art = ref<AsciiArt | null>(null)
  const done = ref(false)
  const busy = ref(false)
  let lastPick = -1
  let runId = 0

  async function roll() {
    if (busy.value) return
    busy.value = true
    const id = ++runId

    done.value = false
    art.value = null

    let pick = Math.floor(Math.random() * stills.length)
    if (stills.length > 1 && pick === lastPick) pick = (pick + 1) % stills.length

    lastPick = pick
    const clip = stills[pick]!
    log.value = []

    const say = async (text: string, kind?: LogLine['kind'], ms = 260) => {
      if (id !== runId) return
      log.value.push({ text, kind })
      sfx.move()
      await wait(ms)
    }

    await say('unwrapping cookie...', 'dim')
    await say(`found image ${String(pick + 1).padStart(2, '0')}/${stills.length} · ${clip.name}`, 'ok')
    await nextTick()

    const box = measure()
    const cell = window.innerWidth < 720 ? 5.5 : 6.5
    const cols = Math.max(20, Math.floor(box.w / cell))
    const lines = Math.max(10, Math.floor(box.h / (cell / ASPECT)))

    try {
      const next = await imageToAscii(clip.url, cols, lines)
      if (id !== runId) return
      await say(`decoding frame → ${next.cols}×${next.lines} ascii · ${next.cells.length} glyphs`, 'dim', 200)
      sfx.boot()
      art.value = next
    } catch {
      await say('this cookie crumbled, try another one', 'dim')
      busy.value = false
    }
  }

  function formed() {
    done.value = true
    busy.value = false
    log.value.push({ text: '★ a star has arrived!', kind: 'hooray' })
  }

  function cancel() {
    runId++
    busy.value = false
  }

  return { log, art, done, busy, roll, formed, cancel }
}
