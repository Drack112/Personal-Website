import { Howl, Howler } from "howler";
import { watchEffect } from "vue";
import { settings } from "./useSettings";

const urls = import.meta.glob("@/assets/sfx/*.mp3", {
  eager: true,
  query: "?url&no-inline", // separate files, never base64 inside the JS
  import: "default",
}) as Record<string, string>;

// UI sounds load right away; the bigger ones only when first needed
const load = (name: string, preload = true) =>
  new Howl({ src: [urls[`/src/assets/sfx/${name}.mp3`]!], preload });

const s = {
  move: load("move"),
  select: load("select"),
  back: load("back"),
  open: load("open"),
  close: load("close"),
  error: load("error"),
  static: load("static"),
  tape: load("tape"),
  channel: load("channel"),
  blip: load("blip"),
  boot: load("boot", false),
  chime: load("intro-chime", false),
  boom: load("intro-boom", false),
};
const intro = [s.chime, s.boom];

// The files are normalised together to -1 dBFS; LEVEL brings them back to the
const LEVEL = 1 / 3.5;

watchEffect(() => {
  Howler.mute(!settings.sound.value);
  Howler.volume(settings.volume.value * LEVEL);
});

export const sfx = {
  move: () => s.move.play(),
  select: () => s.select.play(),
  back: () => s.back.play(),
  open: () => s.open.play(),
  close: () => s.close.play(),
  error: () => s.error.play(),
  staticNoise: () => s.static.play(),
  tape: () => s.tape.play(),
  // CRT tuner: detent clunk, static, a falling whistle and the picture locking in
  channel: () => s.channel.play(),
  // soft tick for each ASCII cell locking into place, a little higher or lower each time
  blip: () => s.blip.rate(0.78 + Math.random() * 0.44, s.blip.play()),
  // startup "bong" for the cookie window: a big detuned F# major chord with an echo
  boot: () => s.boot.play(),

  // the boot screen calls this on mount, so the intro is ready for PRESS START
  preloadIntro: () => intro.forEach((h) => h.load()),
  // crystal bell chord with a long reverb tail
  introChime: () => s.chime.play(),
  // a reversed-cymbal swell that lands on a deep boom 0.6 s after the call
  introBoom: () => s.boom.play(),
  // fade out whatever the intro is still playing (when it is skipped)
  introStop: () =>
    intro.forEach((h) => {
      if (!h.playing()) return;
      h.once("fade", () => h.stop().volume(1));
      h.fade(1, 0, 300);
    }),
};

export function useSound() {
  return sfx;
}
