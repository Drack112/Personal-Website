<script setup lang="ts">
import { sfx } from '@/composables/useSound'

const props = withDefaults(
  defineProps<{
    variant?: 'green' | 'orange' | 'cream'
    pressed?: boolean
    href?: string
    icon?: string
    small?: boolean
    silent?: boolean
  }>(),
  { variant: 'green', pressed: false, small: false, silent: false },
)
const emit = defineEmits<{ click: [MouseEvent] }>()

function onClick(e: MouseEvent) {
  if (!props.silent) sfx.select()
  emit('click', e)
}
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :target="href?.startsWith('http') ? '_blank' : undefined"
    :rel="href?.startsWith('http') ? 'noopener' : undefined"
    :type="href ? undefined : 'button'"
    class="bbtn"
    :class="[variant, { pressed, small }]"
    @click="onClick"
    @pointerenter="!silent && sfx.move()"
  >
    <span v-if="icon" class="nf icon">{{ icon }}</span>
    <span class="label"><slot /></span>
  </component>
</template>

<style scoped>
.bbtn {
  --face: var(--green);
  --hi: var(--green-hi);
  --lo: var(--green-lo);
  --fg: var(--cream);
  display: inline-flex;
  align-items: center;
  gap: 0.55em;
  padding: 0.6em 1em;
  border: 0;
  color: var(--fg);
  background: var(--face);
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  letter-spacing: 0.04em;
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--hi),
    inset -3px -3px 0 var(--lo),
    4px 4px 0 3px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.06s,
    box-shadow 0.06s;
  user-select: none;
}
.bbtn:hover {
  filter: brightness(1.12);
}
.bbtn:active,
.bbtn.pressed {
  transform: translate(3px, 3px);
  box-shadow:
    0 0 0 3px var(--ink),
    inset 3px 3px 0 var(--lo),
    inset -3px -3px 0 var(--hi),
    1px 1px 0 3px rgba(0, 0, 0, 0.35);
}
.bbtn.orange {
  --face: var(--orange);
  --hi: #e0914a;
  --lo: var(--orange-lo);
  --fg: var(--ink);
}
.bbtn.cream {
  --face: var(--beige);
  --hi: var(--beige-hi);
  --lo: var(--beige-lo);
  --fg: var(--ink);
}
.bbtn.small {
  font-size: 0.78rem;
  padding: 0.4em 0.7em;
}
.icon {
  font-size: 1.15em;
}
</style>
