<template>
  <main class="public-landing-shell" :class="`public-landing-shell--${heroVariant}`" :style="shellStyle">
    <article class="page">
      <PublicHero
        class="top-header"
        :image="heroImage"
        :image-alt="heroImageAlt || heroTitle"
        :badge="heroBadge"
        :count-label="heroCountLabel"
        :title="heroTitle"
        :copy="heroCopy"
      >
        <template #actions>
          <slot name="hero-actions" />
        </template>

        <template #meta>
          <slot name="hero-meta" />
        </template>
      </PublicHero>

      <section class="page-content">
        <div class="page-section">
          <div v-if="sectionEyebrow || sectionTitle || sectionChip" class="section-head section-head--compact">
            <div>
              <p v-if="sectionEyebrow" class="eyebrow">{{ sectionEyebrow }}</p>
              <h2 class="section-title">{{ sectionTitle }}</h2>
            </div>
            <div v-if="sectionChip" class="section-chip">{{ sectionChip }}</div>
          </div>

          <div v-if="$slots.info" class="info-strip">
            <slot name="info" />
          </div>

          <p v-if="sectionLead" class="lead event-lead">{{ sectionLead }}</p>

          <slot name="body" />
        </div>
      </section>
    </article>

    <slot name="modal" />
    <slot name="toast" />
  </main>
</template>

<script setup lang="ts">
import PublicHero from '@/components/public/PublicHero.vue';

const props = withDefaults(
  defineProps<{
    contentWidth?: string;
    heroBadge?: string;
    heroCopy: string;
    heroCountLabel?: string;
    heroImage?: string;
    heroImageAlt?: string;
    heroTitle: string;
    heroVariant?: 'standard' | 'event';
    sectionChip?: string;
    sectionEyebrow?: string;
    sectionLead?: string;
    sectionTitle: string;
  }>(),
  {
    contentWidth: '560px',
    heroBadge: '',
    heroCountLabel: '',
    heroImage: '',
    heroImageAlt: '',
    heroVariant: 'standard',
    sectionChip: '',
    sectionEyebrow: '',
    sectionLead: '',
  },
);

const shellStyle = {
  '--landing-shell-width': props.contentWidth,
} as Record<string, string>;
</script>

<style scoped>
.public-landing-shell {
  position: relative;
  overflow: clip;
  min-height: 100vh;
  background: #f6f9fc;
  color: var(--text);
}

/* Standard pages use a compact hero; event details can grow with content. */
.public-landing-shell--standard :deep(.hero) {
  min-height: 330px;
  background: linear-gradient(135deg, #0b4378 0%, #0f467b 100%);
}

.public-landing-shell--standard :deep(.hero-inner) {
  width: min(1100px, calc(100% - 32px));
  align-content: center;
  justify-items: center;
  text-align: center;
  padding-block: 34px 42px;
}

.public-landing-shell--standard :deep(.hero-copy) {
  max-width: 620px;
}

.public-landing-shell--event :deep(.hero) {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 50svh;
  align-items: end;
  background: var(--navy);
}

.public-landing-shell--event :deep(.hero-inner) {
  width: min(1100px, calc(100% - 32px));
  padding: 40px 0;
}

.page-content {
  display: grid;
  padding: 30px 16px 50px;
  background: #f6f9fc;
}

.page-section {
  width: min(var(--landing-shell-width), 100%);
  margin: 0 auto;
  background: #fff;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(9, 38, 68, 0.05);
}

.section-head {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
}

.section-head--compact {
  margin-bottom: 18px;
}

.section-title {
  margin: 0;
  color: var(--text);
}

.info-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

@media (max-width: 700px) {
  .public-landing-shell--event :deep(.hero) {
    min-height: 50svh;
  }

  .public-landing-shell--event :deep(.hero-inner) {
    width: min(100%, calc(100% - 28px));
    padding-block: 30px;
  }

  .page-content {
    padding: 20px 14px 40px;
  }
}
</style>
