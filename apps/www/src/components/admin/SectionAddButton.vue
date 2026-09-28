<template>
  <button type="button" class="btn-action section-add" :class="`section-add--${tone}`" @click="emit('click')">
    <i class="ti" :class="icon" aria-hidden="true"></i>
    {{ label }}
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label: string; icon?: string; tone?: 'signup' | 'task' | 'shift' }>(), {
  icon: 'ti-plus',
  tone: 'signup',
});

const emit = defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.section-add {
  width: 100%;
  justify-content: flex-start;
  border-style: dashed;
  background: var(--navy-soft);
}

.section-add:hover {
  border-color: var(--navy-light);
  opacity: 1;
}

.section-add--signup {
  background: #fbfcfe;
}

.section-add--signup:hover {
  background: #f1f5f9;
}

.section-add--task {
  border-color: #e4c86a;
  background: #fffdf2;
}

.section-add--task:hover {
  background: #fff7d6;
}

.section-add--shift {
  border-color: #b8d0e8;
  background: #f4f9ff;
}

.section-add--shift:hover {
  background: #e8f2ff;
}
</style>
