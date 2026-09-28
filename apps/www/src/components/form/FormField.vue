<template>
  <div class="form-field">
    <label v-if="label" class="form-field__label" :for="forId">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <slot />
    <p v-if="error" :id="errorId" class="form-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  forId?: string;
  required?: boolean;
  error?: string;
  errorId?: string;
}>();
</script>

<style scoped>
.form-field {
  display: grid;
  gap: 6px;
}

.form-field__label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.form-field__error {
  margin: 0;
  color: #c94853;
  font-size: 12px;
  font-weight: 600;
}
</style>
