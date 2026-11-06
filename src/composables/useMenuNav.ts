import {
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  type MaybeRefOrGetter,
} from "vue";
import { sfx } from "./useSound";
import { overlayOpen } from "./useUi";

interface Options {
  count: MaybeRefOrGetter<number>;
  columns?: MaybeRefOrGetter<number>;
  onSelect?: (index: number) => void;
  onBack?: () => void;
  enabled?: () => boolean;
}

export function useMenuNav(opts: Options) {
  const index = ref(0);

  function move(delta: number) {
    const n = toValue(opts.count);
    if (!n) return;
    const next = Math.min(n - 1, Math.max(0, index.value + delta));
    if (next !== index.value) {
      index.value = next;
      sfx.move();
    }
  }

  function onKey(e: KeyboardEvent) {
    if (overlayOpen.value || (opts.enabled && !opts.enabled())) return;
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    )
      return;
    const cols = toValue(opts.columns ?? 1);
    switch (e.key) {
      case "ArrowDown":
      case "s":
        move(cols);
        break;
      case "ArrowUp":
      case "w":
        move(-cols);
        break;
      case "ArrowRight":
      case "d":
        if (cols > 1) move(1);
        else return;
        break;
      case "ArrowLeft":
      case "a":
        if (cols > 1) move(-1);
        else return;
        break;
      case "Enter":
      case " ":
        sfx.select();
        opts.onSelect?.(index.value);
        break;
      case "Escape":
      case "Backspace":
        if (!opts.onBack) return;
        sfx.back();
        opts.onBack();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  onMounted(() => window.addEventListener("keydown", onKey));
  onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

  return {
    index,
    hover(i: number) {
      if (i !== index.value) {
        index.value = i;
        sfx.move();
      }
    },
  };
}
