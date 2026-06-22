<template>
  <section class="page-card">
    <div v-if="$slots.header" class="page-card__header">
      <slot name="header" />
    </div>
    <div class="page-card__body">
      <slot />
    </div>
  </section>
</template>

