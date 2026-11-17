import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { sfx } from '@/composables/useSound'
import { profile, stack } from '@/data/profile'

import { gopher } from '../terminalArt'

export interface Line {
  kind: 'cmd' | 'text' | 'art' | 'error' | 'note'
  text: string
  color?: string
}

interface Command {
  help: string
  run: (args: string[]) => void
}

export function useCommands(close: () => void) {
  const router = useRouter()
  const lines = ref<Line[]>([])
  const history: string[] = []
  let historyPos = -1

  const say = (text: string, kind: Line['kind'] = 'text', color?: string) => lines.value.push({ text, kind, color })
  const art = (text: string, color: string) => say(text.replace(/^\n/, '').replace(/\s+$/, ''), 'art', color)

  const commands: Record<string, Command> = {
    help: {
      help: 'list the commands',
      run: () => {
        for (const [name, c] of Object.entries(commands)) say(`  ${name.padEnd(9)} ${c.help}`)
        say('  ` / F2 / Esc toggle this console · ↑↓ history · Tab complete', 'note')
      },
    },
    gopher: {
      help: 'print the Go mascot',
      run: () => {
        art(gopher, '#00ADD8')
        say('the Go gopher was designed by Renée French · CC BY 4.0 · ASCII from the official artwork (go.dev/blog/gopher)', 'note')
      },
    },
    whoami: {
      help: 'who is behind this console',
      run: () => {
        say(`${profile.handle} — ${profile.name}`, 'text', '#F3EBD3')
        say(`${profile.headline} · ${profile.focus.join(' · ')}`, 'text', '#A9DC88')
        say(profile.specialties, 'note')
      },
    },
    ls: {
      help: 'list the stack',
      run: () => {
        for (const g of stack) say(`${g.label.padEnd(14)} ${g.items.join(' · ').toLowerCase()}`)
      },
    },
    video: {
      help: 'open the TV on Kamen Rider Black',
      run: () => {
        say('tuning to VIDEO · kamen rider black…', 'note')
        close()
        router.push('/video/kamen-rider-black')
      },
    },
    mix: {
      help: 'play my midnight coding mix on the TV',
      run: () => {
        say('♪ tuning to MIDNIGHT MIX · put your headphones on…', 'note')
        close()
        router.push('/video/midnight-mix?play=1')
      },
    },
    midnight: {
      help: 'alias for `mix`',
      run: () => commands.mix!.run([]),
    },
    cookie: {
      help: 'open the cookie',
      run: () => {
        close()
        window.dispatchEvent(new CustomEvent('lk:open-cookie'))
      },
    },
    clear: {
      help: 'clear the screen',
      run: () => (lines.value = []),
    },
    exit: {
      help: 'close the console',
      run: () => close(),
    },
  }

  function run(raw: string) {
    const line = raw.trim()
    say(line, 'cmd')
    if (!line) return
    history.unshift(line)
    historyPos = -1
    const [name, ...args] = line.split(/\s+/)
    const cmd = commands[name!.toLowerCase()]
    if (cmd) {
      sfx.select()
      cmd.run(args)
    } else if (name === 'sudo') {
      say('nice try. permission denied: you are not in the sudoers file. this incident will be reported 🍪', 'error')
    } else {
      sfx.error()
      say(`${name}: command not found · type \`help\``, 'error')
    }
  }

  function complete(value: string) {
    const v = value.trim().toLowerCase()
    if (!v) return value
    const hits = Object.keys(commands).filter((c) => c.startsWith(v))
    if (hits.length === 1) return hits[0]!
    if (hits.length > 1) say(hits.join('  '), 'note')
    return value
  }

  function browse(step: 1 | -1) {
    historyPos = Math.max(-1, Math.min(history.length - 1, historyPos + step))
    return historyPos >= 0 ? history[historyPos]! : ''
  }

  return { lines, say, run, complete, browse }
}
