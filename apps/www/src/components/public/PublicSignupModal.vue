<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <div>
            <div class="modal-title">{{ title }}</div>
            <div v-if="subtitle" class="modal-sub">{{ subtitle }}</div>
          </div>
          <button type="button" class="icon-button" @click="emit('close')">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <div v-if="bannerText" class="modal-banner" :class="bannerClass">
          <i v-if="bannerIcon" class="modal-banner-icon" :class="bannerIcon" aria-hidden="true"></i>
          <span>{{ bannerText }}</span>
        </div>

        <form class="signup-form" @submit.prevent="emit('submit')">
          <slot />

          <p v-if="generalError" class="general-error" role="alert">{{ generalError }}</p>

          <div class="modal-actions">
            <button type="button" class="modal-button" @click="emit('close')">{{ cancelLabel }}</button>
            <button type="submit" class="modal-button modal-button--primary" :disabled="submitting">
              {{ submitting ? submittingLabel : submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    bannerClass?: 'info' | 'warning' | 'success';
    bannerIcon?: string;
    bannerText?: string;
    cancelLabel?: string;
    generalError?: string;
    open: boolean;
    subtitle?: string;
    submitLabel: string;
    submitting?: boolean;
    submittingLabel?: string;
    title: string;
  }>(),
  {
    bannerClass: 'info',
    bannerIcon: '',
    bannerText: '',
    cancelLabel: 'Annullér',
    generalError: '',
    subtitle: '',
    submitting: false,
    submittingLabel: 'Gemmer…',
  },
);

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

const bannerClass = computed(() =>
  props.bannerClass === 'warning' ? 'warning' : props.bannerClass === 'success' ? 'success' : 'info',
);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(6, 18, 33, 0.58);
  z-index: 1000;
}

.modal {
  width: min(560px, 100%);
  max-height: min(90vh, 840px);
  overflow: auto;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(216, 225, 234, 0.95);
  box-shadow: 0 24px 56px rgba(4, 18, 33, 0.22);
  padding: 18px;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.modal-title {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 800;
}

.modal-sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  color: var(--text);
  cursor: pointer;
}

.modal-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.45;
}

.modal-banner.info {
  background: #edf6fc;
  color: #0b4378;
  border: 1px solid rgba(11, 67, 120, 0.16);
}

.modal-banner.warning {
  background: rgba(201, 72, 83, 0.08);
  color: #9d2f3c;
  border: 1px solid rgba(201, 72, 83, 0.16);
}

.modal-banner.success {
  background: rgba(24, 128, 72, 0.08);
  color: #13603a;
  border: 1px solid rgba(24, 128, 72, 0.16);
}

.modal-banner-icon {
  font-size: 1.1rem;
}

.signup-form {
  display: grid;
  gap: 14px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 4px;
}

.modal-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-button:active {
  transform: scale(0.97);
}

.modal-button--primary {
  border-color: var(--navy);
  background: var(--navy);
  color: #fff;
}

.modal-button:disabled {
  opacity: 0.7;
  cursor: progress;
}

.general-error {
  margin: 0;
  color: #9d2f3c;
  font-weight: 600;
}
</style>
