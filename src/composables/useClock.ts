import { onBeforeUnmount, onMounted, shallowRef } from "vue";

export function useClock() {
  const now = shallowRef(new Date());
  let timer = 0;
  onMounted(
    () => (timer = window.setInterval(() => (now.value = new Date()), 1000)),
  );
  onBeforeUnmount(() => window.clearInterval(timer));
  return now;
}
