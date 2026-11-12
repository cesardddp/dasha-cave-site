<template>
  <div class="site-layout">
    <slot />
  </div>
</template>

<style scoped>
.site-layout {
  min-height: 100vh;
  background: var(--color-page-background, linear-gradient(165deg, #2e9974 0%, #111417 50%, #060809 100%));
  color: #fff;
}
</style>
