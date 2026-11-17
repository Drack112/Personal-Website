<template>
  <div class="floor">
    <div class="grid" />
  </div>
</template>

<style scoped lang="css">
.floor {
  --cell: 36px;
  position: absolute;
  left: -50%;
  width: 200%;
  top: var(--horizon);
  bottom: 0;
  overflow: hidden;
  transform: perspective(240px) rotateX(55deg);
  transform-origin: top;
  mask-image: linear-gradient(transparent, #000 45%);
}

.grid {
  position: absolute;
  inset: calc(var(--cell) * -1) 0 0;
  background:
    linear-gradient(color-mix(in srgb, var(--lime) 16%, transparent) 1px, transparent 1px) 0 0 / 100% var(--cell),
    linear-gradient(90deg, color-mix(in srgb, var(--lime) 8%, transparent) 1px, transparent 1px) 50% 0 / 48px 100%;
  animation: scroll 1.6s linear infinite;
}

@keyframes scroll {
  to {
    transform: translateY(var(--cell));
  }
}
</style>
