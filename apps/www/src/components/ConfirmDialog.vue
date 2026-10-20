<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="confirm-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="messageId"
      @click.self="cancel"
    >
      <div ref="dialog" class="confirm-dialog">
        <h2 :id="titleId" class="confirm-title">{{ title }}</h2>
        <p :id="messageId" class="confirm-message">{{ message }}</p>
        <slot />
        <div class="confirm-actions">
          <button type="button" class="confirm-btn confirm-btn--cancel" :disabled="busy" @click="cancel">
            {{ cancelLabel }}
          </button>
          <button
            ref="confirmButton"
            type="button"
            class="confirm-btn confirm-btn--confirm"
            :disabled="busy"
            @click="!busy && emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    busy?: boolean;
  }>(),
  {
    confirmLabel: 'Slet',
    cancelLabel: 'Annuller',
    busy: false,
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

let sequence = 0;
const id = ++sequence;
const titleId = `confirm-title-${id}`;
const messageId = `confirm-message-${id}`;
const confirmButton = ref<HTMLButtonElement | null>(null);
const dialog = ref<HTMLElement | null>(null);
let previousFocus: HTMLElement | null = null;

watch(
  () => props.open,
  async isOpen => {
    if (!isOpen) {
      previousFocus?.focus();
      return;
    }
    previousFocus = document.activeElement as HTMLElement | null;
    await nextTick();
    (dialog.value?.querySelector<HTMLElement>('textarea, input') || confirmButton.value)?.focus();
  },
);

function cancel() {
  if (!props.busy) emit('cancel');
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.open) return;
  if (event.key === 'Escape') cancel();
  if (event.key !== 'Tab') return;
  const controls = dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]');
  if (!controls?.length) {
    event.preventDefault();
    return;
  }
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown));
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 15, 30, 0.55);
}

.confirm-dialog {
  width: 100%;
  max-width: 420px;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  padding: 28px 24px 22px;
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-lift);
}

.confirm-title {
  margin: 0 0 8px;
  color: var(--navy);
  font-size: 18px;
  font-weight: 700;
}

.confirm-message {
  margin: 0 0 22px;
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--dur-fast) ease-out;
}

.confirm-btn--cancel {
  flex: 1;
  border: 1px solid var(--border-soft);
  background: var(--row-bg);
  color: var(--muted);
}

.confirm-btn--confirm {
  flex: 2;
  border: none;
  background: var(--coral);
  color: #fff;
}

.confirm-btn--confirm:hover,
.confirm-btn--cancel:hover {
  opacity: 0.88;
}

.confirm-btn:disabled { opacity: 0.6; cursor: wait; }

.confirm-btn:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}
</style>
