import { useStorage, usePreferredReducedMotion } from "@vueuse/core";
import { watchEffect } from "vue";

const prefersReduced = usePreferredReducedMotion();

export const settings = {
  sound: useStorage("lk.sound", true),
  volume: useStorage("lk.volume", 0.6),
  crt: useStorage("lk.crt", true),
  motion: useStorage("lk.motion", prefersReduced.value !== "reduce"),
  trail: useStorage("lk.trail", true),
};

watchEffect(() => {
  document.documentElement.classList.toggle(
    "reduce-motion",
    !settings.motion.value,
  );
});

export function useSettings() {
  return settings;
}
