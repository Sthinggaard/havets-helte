<template>
  <section class="task-type" :class="{ 'has-error': invalid }">
    <header class="task-type-header">
      <span class="task-type-title">Opgavetype {{ index + 1 }}</span>
      <button type="button" class="remove-button" :aria-label="`Fjern opgavetype ${index + 1}`" title="Slet opgavetype" @click="emit('remove')">×</button>
    </header>

    <label class="group-title-field">
      <span>Opgavetitel *</span>
      <FormControl :model-value="slots[0]?.taskGroupTitle ?? ''" placeholder="fx Klargøring" :aria-invalid="invalid" @update:model-value="updateTitle" />
      <span v-if="invalid" class="field-error" role="alert">Udfyld opgavetitel.</span>
    </label>
    <div class="schedule-fields">
    <label class="group-date-field">
      <span>Påbegyndes</span>
      <FormControl as="select" :model-value="scheduleValue" @update:model-value="updateSchedule">
        <option value="fixed">Fast dato</option>
        <option v-for="option in relativeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </FormControl>
      <FormControl v-if="scheduleValue === 'fixed'" :model-value="slots[0]?.date ?? ''" type="date" @update:model-value="updateDate" />
      <output v-else class="schedule-preview">Beregnet dato: {{ calculatedDate || 'Vælg en eventdato først' }}</output>
    </label>
    <label class="group-date-field">
      <span>Skal være udført senest</span>
      <FormControl as="select" :model-value="deadlineScheduleValue" @update:model-value="updateDeadlineSchedule">
        <option value="none">Ingen deadline</option>
        <option value="fixed">Fast dato</option>
        <option v-for="option in relativeOptions" :key="`deadline-${option.value}`" :value="option.value">{{ option.label }}</option>
      </FormControl>
      <FormControl v-if="deadlineScheduleValue === 'fixed'" :model-value="slots[0]?.deadlineDate ?? ''" type="date" @update:model-value="updateDeadlineDate" />
      <output v-else-if="deadlineScheduleValue !== 'none'" class="schedule-preview">Beregnet deadline: {{ calculatedDeadline || 'Vælg en eventdato først' }}</output>
    </label>
    </div>

    <div class="task-list">
      <EventSlotEditor
        v-for="(slot, slotIndex) in slots"
        :key="slot.id"
        :slot="slot"
        :index="slotIndex"
        :config="config"
        :invalid="invalidSlotIds.has(slot.id)"
        :invalid-time="false"
        :time-range="{ start: '', end: '' }"
        :hide-date="true"
        @remove="emit('remove-task', slot.id)"
        @set-time="() => undefined"
      />
    </div>

    <button type="button" class="add-task-button" @click="emit('add-task')">
      <i class="ti ti-plus" aria-hidden="true"></i>Tilføj opgave under typen
    </button>
  </section>
</template>

<script setup lang="ts">
import EventSlotEditor from '@/components/admin/EventSlotEditor.vue';
import FormControl from '@/components/form/FormControl.vue';
import { calculateSlotDate, calculateSlotDeadline } from '@/features/eventAdmin/eventScheduling';
import { formatSlotDate } from '@/features/eventAdmin/eventAdmin.data';
import type { EventSlot, EventTypeConfig } from '@/features/eventAdmin/eventAdmin.types';
import { computed } from 'vue';

const props = defineProps<{
  index: number;
  slots: EventSlot[];
  config: EventTypeConfig;
  invalid: boolean;
  invalidSlotIds: Set<string>;
  eventDate?: string;
}>();

const emit = defineEmits<{
  remove: [];
  'remove-task': [slotId: string];
  'add-task': [];
  'update-title': [value: string];
  'update-date': [value: string];
  'update-schedule': [mode: 'fixed' | 'relative', offsetDays: number];
  'update-deadline-schedule': [mode: 'fixed' | 'relative' | undefined, offsetDays: number | undefined];
  'update-deadline-date': [value: string];
}>();

const relativeOptions = [
  { value: '-42', label: '6 uger før eventet' },
  { value: '-28', label: '4 uger før eventet' },
  { value: '-14', label: '2 uger før eventet' },
  { value: '-7', label: '1 uge før eventet' },
  { value: '-1', label: '1 dag før eventet' },
  { value: '0', label: 'På eventdagen' },
  { value: '1', label: '1 dag efter eventet' },
  { value: '7', label: '1 uge efter eventet' },
];

const scheduleValue = computed(() => {
  const slot = props.slots[0];
  return slot?.scheduleMode === 'relative' ? String(slot.offsetDays ?? 0) : 'fixed';
});
const calculatedDate = computed(() => {
  const slot = props.slots[0];
  if (!slot || scheduleValue.value === 'fixed') return '';
  const date = calculateSlotDate(props.eventDate, { date: '', scheduleMode: 'relative', offsetDays: slot.offsetDays });
  return date ? formatSlotDate(date) : '';
});
const deadlineScheduleValue = computed(() => {
  const slot = props.slots[0];
  if (!slot?.deadlineScheduleMode) return 'none';
  return slot.deadlineScheduleMode === 'relative' ? String(slot.deadlineOffsetDays ?? 0) : 'fixed';
});
const calculatedDeadline = computed(() => {
  const slot = props.slots[0];
  if (!slot || deadlineScheduleValue.value === 'none' || deadlineScheduleValue.value === 'fixed') return '';
  const date = calculateSlotDeadline(props.eventDate, { deadlineDate: '', deadlineScheduleMode: 'relative', deadlineOffsetDays: slot.deadlineOffsetDays });
  return date ? formatSlotDate(date) : '';
});

function updateTitle(value: string | number) {
  emit('update-title', String(value));
}

function updateDate(value: string | number) {
  emit('update-date', String(value));
}

function updateSchedule(input: string | number) {
  const value = String(input);
  if (value === 'fixed') emit('update-schedule', 'fixed', 0);
  else emit('update-schedule', 'relative', Number(value));
}

function updateDeadlineSchedule(input: string | number) {
  const value = String(input);
  const mode = value === 'none' ? undefined : value === 'fixed' ? 'fixed' : 'relative';
  emit('update-deadline-schedule', mode, mode === 'relative' ? Number(value) : undefined);
}

function updateDeadlineDate(value: string | number) {
  emit('update-deadline-date', String(value));
}
</script>

<style scoped>
.task-type {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fbfcfe;
}

.task-type:not(.has-error) {
  border-color: #e4c86a;
  background: #fffdf2;
}

.task-type.has-error {
  border-color: #c94853;
}

.task-type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-type-title {
  color: var(--navy);
  font-size: 13px;
  font-weight: 800;
}

.remove-button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.remove-button:hover {
  color: #c94853;
}

.group-title-field,
.group-date-field,
.task-list {
  display: grid;
  gap: 8px;
}

.group-title-field {
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.group-date-field {
  max-width: 280px;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.schedule-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.schedule-preview {
  display: block;
  padding-top: 2px;
  color: var(--navy);
  opacity: 0.8;
  font-size: 13px;
  font-weight: 700;
}

.add-task-button:focus-visible,
.remove-button:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}

.field-error {
  color: #c94853;
  font-size: 12px;
  font-weight: 600;
}

.add-task-button {
  justify-self: start;
  min-height: 44px;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  color: var(--navy);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

@media (max-width: 640px) {
  .schedule-fields {
    grid-template-columns: 1fr;
  }
}
</style>
