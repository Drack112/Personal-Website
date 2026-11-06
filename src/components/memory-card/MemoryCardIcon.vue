<script setup lang="ts">
import { computed } from 'vue'

export type Media = 'cart' | 'disc' | 'tape' | 'floppy'
const MEDIA: Media[] = ['cart', 'disc', 'tape', 'floppy']

const props = defineProps<{ glyph: string; color: string; label: string; selected?: boolean; badge?: string; media?: Media }>()

const hash = computed(() => {
  let h = 0
  for (const ch of props.label) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
})
// without an explicit media, pick one from the label so a save always gets the same one
const kind = computed<Media>(() => props.media ?? MEDIA[hash.value % MEDIA.length]!)
const shineId = computed(() => `shine-${hash.value.toString(36)}`)
</script>

<template>
  <div class="save" :class="{ selected }" :style="{ '--c': color }">
    <div class="stage">
      <div class="media" :class="kind">
        <!-- game cartridge -->
        <svg v-if="kind === 'cart'" viewBox="0 0 64 64" aria-hidden="true">
          <path class="body" d="M9 4h46v48h-5v8H14v-8H9z" />
          <path class="hi" d="M12 7h40" />
          <path class="ridge" d="M15 11h34M15 14.5h34" />
          <rect class="sticker" x="14" y="19" width="36" height="29" rx="2" />
          <rect class="stripe" x="14" y="19" width="36" height="5" rx="1" />
          <path class="pins" d="M19 55v4M24 55v4M29 55v4M34 55v4M39 55v4M44 55v4" />
        </svg>

        <!-- optical disc: only the disc spins, the printed label stays readable -->
        <svg v-else-if="kind === 'disc'" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient :id="shineId" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#cfe9f0" />
              <stop offset="0.3" stop-color="#a9dc88" />
              <stop offset="0.5" stop-color="#fef274" />
              <stop offset="0.7" stop-color="#cb6e1b" />
              <stop offset="1" stop-color="#5c8895" />
            </linearGradient>
          </defs>
          <g class="spin">
            <circle class="platter" cx="32" cy="32" r="29" :fill="`url(#${shineId})`" />
            <path class="glint" d="M32 6a26 26 0 0 1 22 12" />
            <path class="glint" d="M32 58a26 26 0 0 1-22-12" />
          </g>
          <circle class="sticker" cx="32" cy="32" r="16" />
          <circle class="ring" cx="32" cy="32" r="16" />
        </svg>

        <!-- compact cassette -->
        <svg v-else-if="kind === 'tape'" viewBox="0 0 64 64" aria-hidden="true">
          <rect class="body" x="3" y="11" width="58" height="42" rx="4" />
          <rect class="sticker" x="8" y="15" width="48" height="20" rx="2" />
          <rect class="stripe" x="8" y="15" width="48" height="4" rx="1" />
          <rect class="window" x="17" y="38" width="30" height="9" rx="4.5" />
          <g class="reel">
            <circle cx="24" cy="42.5" r="3.4" />
            <path d="M24 39.6v5.8M21.1 42.5h5.8" />
          </g>
          <g class="reel">
            <circle cx="40" cy="42.5" r="3.4" />
            <path d="M40 39.6v5.8M37.1 42.5h5.8" />
          </g>
          <path class="foot" d="M15 53l3-4h28l3 4" />
          <circle class="screw" cx="7" cy="49" r="1.3" />
          <circle class="screw" cx="57" cy="49" r="1.3" />
        </svg>

        <!-- 3.5" floppy -->
        <svg v-else viewBox="0 0 64 64" aria-hidden="true">
          <path class="body" d="M6 6h46l6 6v46H6z" />
          <rect class="shutter" x="18" y="6" width="28" height="17" />
          <rect class="slot" x="35" y="9" width="6" height="11" />
          <rect class="sticker" x="11" y="28" width="42" height="27" rx="2" />
          <rect class="stripe" x="11" y="28" width="42" height="4" rx="1" />
          <rect class="notch" x="9" y="9" width="4" height="4" />
        </svg>

        <span class="nf glyph">{{ glyph }}</span>
      </div>
      <div class="shadow" />
    </div>
    <div class="label">{{ label }}</div>
    <div v-if="badge" class="badge">{{ badge }}</div>
  </div>
</template>

<style scoped>
.save {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.4rem 0.6rem;
  border: 3px solid transparent;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.save.selected {
  background: rgba(169, 220, 136, 0.12);
  border-color: var(--lime);
  box-shadow: 0 0 0 3px var(--ink), 0 0 24px rgba(169, 220, 136, 0.35);
}

.stage {
  perspective: 300px;
  height: 84px;
  display: grid;
  place-items: center;
}

.media {
  position: relative;
  width: 70px;
  height: 70px;
  transform-style: preserve-3d;
  transform: rotateY(-16deg) rotateX(8deg);
  transition: transform 0.3s;
  filter: drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.35));
}

.media svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.glyph {
  position: absolute;
  left: 50%;
  top: var(--gy, 50%);
  transform: translate(-50%, -50%);
  font-size: var(--gs, 20px);
  color: var(--c);
  text-shadow: 1px 1px 0 #000;
}

/* shared svg parts */
svg * {
  stroke: var(--ink);
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.sticker {
  fill: #0e1f1c;
}

.stripe {
  fill: var(--c);
  stroke: none;
  opacity: 0.85;
}

/* cartridge */
.cart {
  --gy: 58%;
}

.cart .body {
  fill: var(--green);
}

.cart .hi {
  stroke: var(--green-hi);
  stroke-width: 2;
}

.cart .ridge {
  stroke: var(--green-lo);
  stroke-width: 2;
}

.cart .pins {
  stroke: var(--gold);
  stroke-width: 2;
}

/* disc */
.disc {
  --gs: 22px;
}

.glint {
  fill: none;
  stroke: rgba(255, 255, 255, 0.75);
  stroke-width: 2;
}

.ring {
  fill: none;
  stroke: var(--c);
  stroke-width: 2;
  opacity: 0.8;
}

.spin {
  transform-origin: 32px 32px;
}

/* cassette */
.tape {
  --gy: 40%;
  --gs: 17px;
}

.tape .body {
  fill: var(--orange-lo);
}

.window {
  fill: #2b1a0c;
}

.reel {
  transform-box: fill-box;
  transform-origin: center;
}

.reel circle {
  fill: var(--cream);
  stroke-width: 1.5;
}

.reel path {
  stroke: var(--orange-lo);
  stroke-width: 1.5;
}

.foot {
  fill: #7d3f0d;
  stroke-width: 2;
}

.screw {
  fill: var(--gold);
  stroke-width: 1;
}

/* floppy */
.floppy {
  --gy: 67%;
  --gs: 18px;
}

.floppy .body {
  fill: var(--teal);
}

.shutter {
  fill: #c9d3d0;
}

.slot {
  fill: #3a4744;
  stroke-width: 1.5;
}

.notch {
  fill: #0e1f1c;
  stroke-width: 1.5;
}

/* selected: animate like a PS2 save icon */
.selected .media.cart,
.selected .media.floppy {
  animation: spin 2.4s linear infinite;
}

.selected .media.disc,
.selected .media.tape {
  transform: rotateX(8deg);
  animation: bob 1.6s ease-in-out infinite;
}

.selected .spin {
  animation: roll 1.2s linear infinite;
}

.selected .reel {
  animation: roll 1s linear infinite;
}

.shadow {
  width: 50px;
  height: 8px;
  margin-top: 2px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
}

.selected .cart+.shadow,
.selected .floppy+.shadow {
  animation: shrink 2.4s linear infinite;
}

.label {
  max-width: 100%;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  color: var(--cream);
  line-height: 1.25;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 5px;
  background: var(--orange);
  color: var(--ink);
  box-shadow: 0 0 0 2px var(--ink);
}

@keyframes spin {
  from {
    transform: rotateY(0deg) rotateX(8deg);
  }

  to {
    transform: rotateY(360deg) rotateX(8deg);
  }
}

@keyframes roll {
  to {
    transform: rotate(360deg);
  }
}

@keyframes bob {
  50% {
    transform: rotateX(8deg) translateY(-4px);
  }
}

@keyframes shrink {

  0%,
  50%,
  100% {
    transform: scaleX(1);
  }

  25%,
  75% {
    transform: scaleX(0.3);
  }
}
</style>
