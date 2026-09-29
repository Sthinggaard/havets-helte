<template>
  <section class="shift-type" :class="{ 'has-error': invalid || slots.some(slot => invalidTimeIds.has(slot.id)) }">
    <header class="shift-type-header">
      <span class="shift-type-title">Vagttype {{ index + 1 }}</span>
      <label class="field shift-name-field">
        <FormControl :model-value="slots[0]?.label ?? ''" placeholder="fx Drinksboden" :aria-invalid="invalid" aria-label="Vagtnavn" @update:model-value="updateCommon('label', $event)" />
        <span v-if="invalid" class="field-error" role="alert">Udfyld vagtnavn.</span>
      </label>
      <button type="button" class="remove-button" :aria-label="`Fjern vagttype ${index + 1}`" title="Slet vagttype" @click="emit('remove')">×</button>
    </header>

    <div class="shift-type-basics">
      <div class="field">
        <span>Planlægning</span>
        <FormControl as="select" aria-label="Planlægning" :model-value="scheduleValue" @update:model-value="updateSchedule">
          <option value="fixed">Fast dato</option>
          <option value="weekly">Hver uge</option>
          <option value="biweekly">Hver anden uge</option>
        </FormControl>
        <FormControl v-if="scheduleValue === 'fixed'" aria-label="Vagtens dato" :model-value="slots[0]?.date ?? ''" type="date" @update:model-value="updateCommon('date', $event)" />
        <div v-else class="recurrence-fields">
          <div class="weekday-picker" role="group" aria-label="Vælg ugedage">
            <span class="weekday-picker-label">Ugedage</span>
            <div class="weekday-options">
              <label
                v-for="day in weekdays"
                :key="day.value"
                class="weekday-option"
                :class="{ 'weekday-option--selected': selectedWeekdays.includes(day.value) }"
              >
                <input
                  type="checkbox"
                  :checked="selectedWeekdays.includes(day.value)"
                  :disabled="selectedWeekdays.length === 1 && selectedWeekdays[0] === day.value"
                  :aria-label="day.fullLabel"
                  @change="updateWeekday(day.value, $event)"
                />
                <span>{{ day.label }}</span>
              </label>
            </div>
          </div>
          <div class="recurrence-range">
            <FormControl aria-label="Gentag fra" type="date" :model-value="slots[0]?.recurrenceStartDate || eventDate || ''" @update:model-value="updateRecurrenceDate('start', $event)" />
            <span>til</span>
            <FormControl aria-label="Gentag til" type="date" :model-value="slots[0]?.recurrenceEndDate || eventDate || ''" @update:model-value="updateRecurrenceDate('end', $event)" />
          </div>
        </div>
      </div>
      <label class="field">
        <span>Vagtlængde</span>
        <FormControl as="select" :model-value="slots[0]?.shiftDurationMinutes ?? 60" @update:model-value="updateDuration">
          <option v-for="duration in durationOptions" :key="duration" :value="duration">{{ durationLabel(duration) }}</option>
        </FormControl>
      </label>
    </div>

    <div class="period-list">
      <article v-for="(period, periodIndex) in slots" :key="period.id" class="shift-period" :class="{ 'has-error': invalidTimeIds.has(period.id) }">
        <div class="period-header">
          <span>Vagtperiode {{ periodIndex + 1 }}</span>
          <button v-if="slots.length > 1" type="button" class="remove-period-button" :aria-label="`Fjern vagtperiode ${periodIndex + 1}`" title="Slet vagtperiode" @click="emit('remove-period', period.id)">×</button>
        </div>
        <div class="period-fields">
          <label class="field field--capacity">
            <span>Antal personer</span>
            <FormControl type="number" min="1" max="999" :model-value="period.capacity" @update:model-value="updateCapacity(period.id, $event)" />
          </label>
          <label v-if="periodIndex === 0" class="field field--time">
            <span>Starttid</span>
            <FormControl type="time" :model-value="period.startTime" :aria-invalid="invalidTimeIds.has(period.id)" @update:model-value="emitStart" />
            <span v-if="invalidTimeIds.has(period.id)" class="field-error" role="alert">Vælg en starttid.</span>
          </label>
          <div v-else class="field field--time">
            <span>Tidsrum</span>
            <output class="generated-time">{{ periodTime(period) }}</output>
          </div>
        </div>
        <output v-if="periodIndex === 0 && period.endTime" class="period-end">Slutter {{ period.endTime }}</output>
        <label class="adult-toggle">
          <input :checked="period.requiresAdult" type="checkbox" @change="updateAdult(period.id, $event)" />
          <span>Kræver 18+ år</span>
        </label>
      </article>
    </div>

    <button type="button" class="add-period-button" :disabled="!slots[0]?.startTime" @click="emit('add-period')">
      <i class="ti ti-plus" aria-hidden="true"></i>Tilføj vagtperiode
    </button>
  </section>
</template>

<script setup lang="ts">
import FormControl from '@/components/form/FormControl.vue';
import type { EventSlot } from '@/features/eventAdmin/eventAdmin.types';
import { computed } from 'vue';

const props = defineProps<{
  index: number;
  slots: EventSlot[];
  invalid: boolean;
  invalidTimeIds: Set<string>;
  eventDate?: string;
}>();

const emit = defineEmits<{
  remove: [];
  'remove-period': [slotId: string];
  'add-period': [];
  'update-common': [field: 'label' | 'date', value: string];
  'update-duration': [duration: number];
  'update-capacity': [slotId: string, value: number];
  'update-adult': [slotId: string, value: boolean];
  'set-start': [start: string];
  'update-schedule': [mode: 'fixed' | 'weekly' | 'biweekly', offsetDays: number];
  'update-recurrence': [weekdays: number[], startDate: string, endDate: string];
}>();

const weekdays = [
  { value: 1, label: 'man', fullLabel: 'Mandag' }, { value: 2, label: 'tirs', fullLabel: 'Tirsdag' },
  { value: 3, label: 'ons', fullLabel: 'Onsdag' }, { value: 4, label: 'tors', fullLabel: 'Torsdag' },
  { value: 5, label: 'fre', fullLabel: 'Fredag' }, { value: 6, label: 'lør', fullLabel: 'Lørdag' },
  { value: 0, label: 'søn', fullLabel: 'Søndag' },
];

const scheduleValue = computed(() => {
  const slot = props.slots[0];
  return slot?.scheduleMode === 'weekly' || slot?.scheduleMode === 'biweekly' ? slot.scheduleMode : 'fixed';
});
const selectedWeekdays = computed(() => {
  const slot = props.slots[0];
  return slot?.recurrenceWeekdays?.length ? slot.recurrenceWeekdays : [slot?.recurrenceWeekday ?? 6];
});

const durationOptions = Array.from({ length: 24 }, (_, index) => (index + 1) * 30);

function updateCommon(field: 'label' | 'date', value: string | number) {
  emit('update-common', field, String(value));
}

function updateSchedule(input: string | number) {
  const value = String(input);
  emit('update-schedule', value as 'fixed' | 'weekly' | 'biweekly', 0);
}

function updateWeekday(day: number, event: Event) {
  const slot = props.slots[0];
  const selected = new Set(selectedWeekdays.value);
  if ((event.target as HTMLInputElement).checked) selected.add(day);
  else selected.delete(day);
  const nextWeekdays = weekdays.filter(item => selected.has(item.value)).map(item => item.value);
  emit('update-recurrence', nextWeekdays, slot?.recurrenceStartDate || props.eventDate || '', slot?.recurrenceEndDate || props.eventDate || '');
}

function updateRecurrenceDate(kind: 'start' | 'end', value: string | number) {
  const slot = props.slots[0];
  const startDate = kind === 'start' ? String(value) : slot?.recurrenceStartDate || props.eventDate || '';
  const endDate = kind === 'end' ? String(value) : slot?.recurrenceEndDate || props.eventDate || '';
  emit('update-recurrence', selectedWeekdays.value, startDate, endDate);
}

function updateCapacity(slotId: string, input: string | number) {
  const value = parseInt(String(input), 10);
  emit('update-capacity', slotId, Number.isFinite(value) && value > 0 ? value : 1);
}

function updateDuration(value: string | number) {
  emit('update-duration', Number(value));
}

function updateAdult(slotId: string, event: Event) {
  emit('update-adult', slotId, (event.target as HTMLInputElement).checked);
}

function emitStart(value: string | number) {
  emit('set-start', String(value));
}

function durationLabel(duration: number) {
  if (duration === 30) return '30 minutter';
  const hours = duration / 60;
  return `${hours.toLocaleString('da-DK')} time${hours === 1 ? '' : 'r'}`;
}

function periodTime(period: EventSlot) {
  return period.startTime && period.endTime ? `${period.startTime}–${period.endTime}` : 'Vælg starttid ovenfor';
}
</script>

<style scoped>
.shift-type,
.shift-period {
  display: grid;
  gap: 14px;
  border: 1px solid var(--border);
  background: #fbfcfe;
}

.shift-type {
  padding: 16px;
  border-radius: 14px;
}

.schedule-preview {
  display: block;
  padding-top: 2px;
  color: var(--navy);
  opacity: 0.8;
  font-size: 13px;
  font-weight: 700;
}

.recurrence-fields,
.recurrence-range {
  display: grid;
  gap: 8px;
}

.weekday-picker {
  display: grid;
  gap: 5px;
}

.weekday-picker-label {
  color: var(--muted);
  font-size: 12px;
}

.weekday-options {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.weekday-option {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #fff;
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}

.weekday-option--selected {
  border-color: var(--navy);
  background: var(--navy-soft);
  color: var(--navy);
}

.weekday-option input {
  margin: 0;
  accent-color: var(--navy);
}

.weekday-option input:disabled {
  cursor: not-allowed;
}

.recurrence-range {
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
}

.recurrence-range span {
  color: var(--muted);
  font-size: 12px;
}

.shift-type:not(.has-error) {
  border-color: #b8d0e8;
  background: #f4f9ff;
}

.shift-type.has-error,
.shift-period.has-error {
  border-color: #c94853;
}

.period-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.shift-type-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
}

.shift-name-field {
  min-width: 0;
}

.shift-name-field .form-control {
  min-height: 45px;
}

.shift-type-title,
.period-header {
  color: var(--navy);
  font-size: 13px;
  font-weight: 800;
}

.period-header {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.remove-button,
.remove-period-button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.remove-button:hover,
.remove-period-button:hover {
  color: #c94853;
}

.period-fields {
  display: grid;
  gap: 12px;
}

.shift-type-basics {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.period-list {
  display: grid;
  gap: 10px;
}

.shift-period {
  padding: 14px;
  border-radius: 10px;
  background: #fff;
}

.period-fields {
  grid-template-columns: minmax(140px, .7fr) minmax(0, 1.3fr);
}

.field {
  display: grid;
  gap: 5px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.add-period-button:focus-visible,
.remove-button:focus-visible,
.remove-period-button:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}

.generated-time,
.period-end {
  color: var(--text);
  font-size: 15px;
}

.generated-time {
  min-height: 42px;
  display: flex;
  align-items: center;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #f4f6f9;
}

.period-end {
  margin-top: -4px;
  color: var(--muted);
}

.adult-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}

.field-error {
  color: #c94853;
  font-size: 12px;
  font-weight: 600;
}

.add-period-button {
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

.add-period-button:disabled {
  cursor: not-allowed;
  opacity: .5;
}

@media (max-width: 640px) {
  .weekday-options {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .period-fields {
    grid-template-columns: 1fr;
  }

  .shift-type-basics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
