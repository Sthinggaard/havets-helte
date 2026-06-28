<template>
  <div class="public-landing-shell" :style="shellStyle">
    <PublicHero
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

    <main class="page-shell">
      <section class="page-section">
        <div class="section-head section-head--compact">
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
      </section>
    </main>

    <slot name="modal" />
    <slot name="toast" />
  </div>
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
  min-height: 100vh;
  background: #f6f9fc;
  color: var(--text);
}

.page-shell {
  width: min(var(--landing-shell-width), calc(100% - 32px));
  margin: -72px auto 48px;
  display: grid;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.page-section {
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
  .page-shell {
    width: min(100%, calc(100% - 28px));
    margin-top: -56px;
  }
}
</style>
