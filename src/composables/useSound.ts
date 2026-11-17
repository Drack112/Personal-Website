import { watchEffect } from 'vue'
import { Howl, Howler } from 'howler'

import { settings } from '@/composables/useSettings'

const urls = import.meta.glob('@/assets/sfx/*.mp3', {
  eager: true,
  query: '?url&no-inline',
  import: 'default',
}) as Record<string, string>

const load = (name: string, preload = true) =>
  new Howl({ src: [urls[`/src/assets/sfx/${name}.mp3`]!], preload })

const s = {
  move: load('move'),
  select: load('select'),
  back: load('back'),
  open: load('open'),
  close: load('close'),
  error: load('error'),
  tape: load('tape'),
  channel: load('channel'),
  blip: load('blip'),
  boot: load('boot', false),
  chime: load('intro-chime', false),
  boom: load('intro-boom', false),
}
const intro = [s.chime, s.boom]

const LEVEL = 1 / 3.5

watchEffect(() => {
  Howler.mute(!settings.sound.value)
  Howler.volume(settings.volume.value * LEVEL)
})

export const sfx = {
  move: () => s.move.play(),
  select: () => s.select.play(),
  back: () => s.back.play(),
  open: () => s.open.play(),
  close: () => s.close.play(),
  error: () => s.error.play(),
  tape: () => s.tape.play(),
  channel: () => s.channel.play(),
  blip: () => s.blip.rate(0.78 + Math.random() * 0.44, s.blip.play()),
  boot: () => s.boot.play(),
  preloadIntro: () => intro.forEach((h) => h.load()),
  introChime: () => s.chime.play(),
  introBoom: () => s.boom.play(),
  introStop: () =>
    intro.forEach((h) => {
      if (!h.playing()) return
      h.once('fade', () => h.stop().volume(1))
      h.fade(1, 0, 300)
    }),
}
