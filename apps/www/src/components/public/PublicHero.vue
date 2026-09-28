<template>
  <section class="hero">
    <img v-if="image" class="hero-image" :src="image" :alt="imageAlt || title" />
    <div v-if="image" class="hero-scrim" aria-hidden="true" />

    <div class="hero-inner">
      <div v-if="$slots.brand || logoSrc" class="hero-brand">
        <slot name="brand">
          <img class="hero-logo" :src="logoSrc" :alt="logoAlt" />
        </slot>
      </div>

      <div class="hero-kicker">
        <span v-if="badge" class="hero-badge">{{ badge }}</span>
        <span v-if="countLabel" class="hero-count">{{ countLabel }}</span>
      </div>

      <h1 class="hero-title">{{ title }}</h1>
      <p class="hero-copy">{{ copy }}</p>

      <div v-if="$slots.actions" class="hero-actions">
        <slot name="actions" />
      </div>

      <div v-if="$slots.meta" class="hero-meta">
        <slot name="meta" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    badge?: string;
    copy: string;
    countLabel?: string;
    image?: string;
    imageAlt?: string;
    logoAlt?: string;
    logoSrc?: string;
    title: string;
  }>(),
  {
    badge: '',
    countLabel: '',
    image: '',
    imageAlt: '',
    logoAlt: 'Havets Helte logo',
    logoSrc: '/havets-helte-logo.svg',
  },
);
</script>

<style scoped>
.hero {
  position: relative;
  z-index: 0;
  min-height: 60vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0b4378 0%, #0f467b 100%);
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  opacity: 0.55;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 51, 102, 0.02) 0%, rgba(0, 51, 102, 0.08) 42%, rgba(0, 51, 102, 0.82) 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 48px 20px 56px;
  display: grid;
  gap: 12px;
  color: #fff;
}

.hero-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.hero-logo {
  display: block;
  width: min(184px, 52vw);
  height: auto;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.18));
}

.hero-kicker {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #b7e0ef;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 4.6rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.hero-copy {
  max-width: 760px;
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 700px) {
  .hero-inner {
    padding-inline: 16px;
  }
}
</style>
