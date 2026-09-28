<template>
  <select
    v-if="as === 'select'"
    v-bind="$attrs"
    class="form-control"
    :value="modelValue"
    @change="updateValue"
  >
    <slot />
  </select>
  <textarea
    v-else-if="as === 'textarea'"
    v-bind="$attrs"
    class="form-control"
    :value="modelValue"
    @input="updateValue"
  />
  <input
    v-else
    v-bind="$attrs"
    class="form-control"
    :type="type"
    :value="modelValue"
    @input="updateValue"
  />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  as?: 'input' | 'select' | 'textarea';
  type?: string;
  modelValue?: string | number;
  modelModifiers?: { trim?: boolean; number?: boolean };
}>(), {
  as: 'input',
  type: 'text',
  modelValue: '',
  modelModifiers: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

function updateValue(event: Event) {
  let nextValue = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  if (props.modelModifiers.trim) nextValue = nextValue.trim();
  emit('update:modelValue', props.modelModifiers.number ? Number(nextValue) : nextValue);
}
</script>

<style scoped>
.form-control {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 15px;
}

textarea.form-control {
  min-height: 96px;
  resize: vertical;
}

.form-control:disabled {
  cursor: not-allowed;
  background: #f4f6f9;
  color: var(--muted);
}

.form-control:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
  border-color: var(--navy-mid, var(--navy));
}
</style>
