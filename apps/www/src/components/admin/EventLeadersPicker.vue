<template>
  <fieldset class="leader-picker">
    <legend>Ansvarlige ledere</legend>
    <p v-if="loading" role="status">Henter ledere…</p>
    <div v-if="error" class="leader-picker__error" role="alert">
      <span>{{ error }}</span>
      <button type="button" class="btn-action" @click="load">Prøv igen</button>
    </div>
    <div v-if="options.length" class="leader-picker__options">
      <label v-for="leader in options" :key="leader.id" class="leader-picker__option">
        <input type="checkbox" :checked="modelValue.some(item => item.id === leader.id)" @change="toggle(leader)" />
        <span><strong>{{ leader.name }}</strong><small v-if="leader.email">{{ leader.email }}</small></span>
      </label>
    </div>
    <p v-else-if="!loading && !error">Ingen lederkonti fundet.</p>
    <div class="leader-picker__manual">
      <label :for="manualId">Leder uden login</label>
      <div class="leader-picker__manual-row">
        <FormControl
          :id="manualId"
          v-model="manualName"
          placeholder="Lederens navn"
          maxlength="120"
          autocomplete="off"
          :aria-invalid="!!manualError"
          :aria-describedby="manualError ? `${manualId}-error` : undefined"
          @update:model-value="manualError = ''"
          @keydown.enter.prevent="addManualLeader"
        />
        <button type="button" class="btn-action" @click="addManualLeader">Tilføj</button>
      </div>
      <p v-if="manualError" :id="`${manualId}-error`" class="leader-picker__manual-error" role="alert">{{ manualError }}</p>
      <span class="leader-picker__announcement" role="status">{{ manualNotice }}</span>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useId } from 'vue';
import FormControl from '@/components/form/FormControl.vue';
import { fetchAvailableEventLeaders, type AvailableEventLeader, type EventLeader } from '@/features/eventAdmin/eventLeaders';

const props = defineProps<{ modelValue: EventLeader[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: EventLeader[]] }>();
const available = ref<AvailableEventLeader[]>([]);
const loading = ref(false);
const error = ref('');
const manualId = useId();
const manualName = ref('');
const manualError = ref('');
const manualNotice = ref('');
// Keep saved selections visible even if the account has since been removed.
const options = computed(() => {
  const leaders = new Map<string, EventLeader & { email?: string }>(available.value.map(leader => [leader.id, leader]));
  for (const leader of props.modelValue) if (!leaders.has(leader.id)) leaders.set(leader.id, leader);
  return [...leaders.values()];
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    available.value = await fetchAvailableEventLeaders();
  } catch {
    error.value = 'Lederne kunne ikke hentes.';
  } finally {
    loading.value = false;
  }
}

function toggle(leader: EventLeader) {
  emit('update:modelValue', props.modelValue.some(item => item.id === leader.id)
    ? props.modelValue.filter(item => item.id !== leader.id)
    : [...props.modelValue, { id: leader.id, name: leader.name }]);
}

function addManualLeader() {
  const name = manualName.value.trim().replace(/\s+/g, ' ');
  manualError.value = '';
  manualNotice.value = '';
  if (!name || name.length > 120) {
    manualError.value = 'Skriv lederens navn på højst 120 tegn.';
  } else if (props.modelValue.some(leader => leader.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('da') === name.toLocaleLowerCase('da'))) {
    manualError.value = 'En leder med dette navn er allerede valgt.';
  } else {
    emit('update:modelValue', [...props.modelValue, { id: `manual:${crypto.randomUUID()}`, name }]);
    manualName.value = '';
    manualNotice.value = `${name} er tilføjet.`;
  }
  document.getElementById(manualId)?.focus();
}

onMounted(load);
</script>

<style scoped>
.leader-picker { min-width: 0; margin: 0; padding: 0; border: 0; }
.leader-picker legend { padding: 0; margin-bottom: 10px; color: var(--navy); font-weight: 700; }
.leader-picker p { margin: 0; color: var(--muted); }
.leader-picker__options { display: grid; max-height: 224px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-sm); }
.leader-picker__option { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 10px 12px; cursor: pointer; }
.leader-picker__option + .leader-picker__option { border-top: 1px solid var(--border-soft); }
.leader-picker__option:has(input:checked) { background: var(--navy-soft); }
.leader-picker__option input { width: 20px; height: 20px; flex-shrink: 0; accent-color: var(--navy); }
.leader-picker__option input:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }
.leader-picker__option span { display: grid; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
.leader-picker__option strong { font-size: 16px; }
.leader-picker__option small { color: var(--muted); font-size: 14px; }
.leader-picker__error { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; color: var(--danger); }
.leader-picker__manual { display: grid; gap: 8px; margin-top: 16px; }
.leader-picker__manual > label { color: var(--navy); font-weight: 700; }
.leader-picker__manual-row { display: flex; align-items: start; gap: 8px; }
.leader-picker__manual-row :deep(.form-control) { min-width: 0; min-height: 44px; font-size: 16px; }
.leader-picker__manual-row button { flex-shrink: 0; min-height: 44px; }
.leader-picker__manual .leader-picker__manual-error { color: var(--danger); }
.leader-picker__announcement { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
