<template>
  <div class="admin-page-template">
    <PublicHero :title="title" :copy="copy" />
    <div class="admin-page-template__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import PublicHero from '@/components/public/PublicHero.vue';

defineProps<{ title: string; copy: string }>();
</script>

<style scoped>
.admin-page-template {
  min-height: 100vh;
  background: #f6f9fc;
}

.admin-page-template :deep(.hero) {
  min-height: 330px;
  background: linear-gradient(135deg, #0b4378 0%, #0f467b 100%);
}

.admin-page-template :deep(.hero-inner) {
  width: min(1100px, calc(100% - 32px));
  align-content: center;
  justify-items: center;
  padding-block: 34px 42px;
  text-align: center;
}

.admin-page-template :deep(.hero-copy) {
  max-width: 620px;
}

.admin-page-template__content {
  width: min(1180px, calc(100% - 32px));
  margin: -72px auto 48px;
  position: relative;
  z-index: 2;
}

@media (max-width: 700px) {
  .admin-page-template :deep(.hero) {
    min-height: 280px;
  }

  .admin-page-template :deep(.hero-inner) {
    width: min(100%, calc(100% - 28px));
    gap: 8px;
    padding: 24px 14px 34px;
  }

  .admin-page-template :deep(.hero-logo) {
    width: min(132px, 38vw);
  }

  .admin-page-template :deep(.hero-title) {
    font-size: clamp(2rem, 8vw, 3rem);
  }

  .admin-page-template :deep(.hero-copy) {
    font-size: 0.95rem;
    line-height: 1.45;
  }

  .admin-page-template__content {
    width: min(100%, calc(100% - 28px));
    margin-top: -36px;
  }
}
</style>
