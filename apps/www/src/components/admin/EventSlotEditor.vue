<template>
  <div class="slot-row" :class="{ 'has-error': invalid }">
    <div class="slot-header">
      <span class="slot-index">Plads {{ index + 1 }}</span>
      <button type="button" class="btn-rm-slot" :aria-label="`Fjern plads ${index + 1}`" title="Slet plads" @click="$emit('remove')">×</button>
    </div>

    <div class="slot-primary">
      <div class="si-label">
        <label class="si-field-label" :for="`${slot.id}-label`">Navn{{ config.timedSlots ? ' / tidsrum' : '' }} *</label>
        <input
          :id="`${slot.id}-label`"
          v-model="slot.label"
          class="sl-input"
          :placeholder="config.timedSlots ? 'fx Drinksboden' : 'fx Opsætning'"
          :aria-invalid="invalid"
        />
        <div v-if="invalid" class="field-error" role="alert">Udfyld navn{{ config.timedSlots ? '/tidsrum' : '' }}.</div>
      </div>
      <div class="si-cap">
        <label class="si-field-label" :for="`${slot.id}-cap`">Pladser</label>
        <input
          :id="`${slot.id}-cap`"
          class="sl-input sl-cap"
          type="number"
          min="1"
          max="999"
          :value="slot.capacity === 0 ? '' : slot.capacity"
          :disabled="slot.capacity === 0"
          @input="onCapacityInput"
        />
        <label class="slot-toggle">
          <input type="checkbox" :checked="slot.capacity === 0" @change="onUnlimited" />
          <span>∞ Ubegr.</span>
        </label>
      </div>
    </div>

    <div class="slot-secondary">
      <div class="si-role">
        <label class="si-field-label" :for="`${slot.id}-role`">Rolle</label>
        <select :id="`${slot.id}-role`" v-model="slot.role" class="sl-input">
          <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
        </select>
      </div>

      <div class="si-sub">
        <label class="si-field-label" :for="`${slot.id}-sub`">{{ config.timedSlots ? 'Tidsrum' : 'Detalje' }}</label>
        <div v-if="config.timedSlots" class="time-range-row">
          <input
            :id="`${slot.id}-sub`"
            class="sl-input"
            type="time"
            :value="timeRange.start"
            aria-label="Starttid"
            @input="emitTime('start', $event)"
          />
          <span class="time-range-sep">–</span>
          <input
            class="sl-input"
            type="time"
            :value="timeRange.end"
            aria-label="Sluttid"
            @input="emitTime('end', $event)"
          />
        </div>
        <input
          v-else
          :id="`${slot.id}-sub`"
          v-model="slot.sublabel"
          class="sl-input"
          placeholder="fx 5 spejdere pr. patrulje"
        />
      </div>

      <fieldset v-if="config.showKindPicker" class="si-kind">
        <legend class="si-field-label">Deltagelse</legend>
        <div class="kind-pills">
          <label v-for="option in kindOptions" :key="option.value" class="kind-pill" :class="{ active: slot.kind === option.value }">
            <input type="radio" :name="`${slot.id}-kind`" :value="option.value" :checked="slot.kind === option.value" @change="slot.kind = option.value" />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </fieldset>
    </div>

    <div class="slot-extras">
      <label class="slot-toggle">
        <input v-model="slot.requiresAdult" type="checkbox" />
        <span>Kræver 18+ år</span>
      </label>
      <label class="slot-toggle">
        <input type="checkbox" :checked="isGroup" @change="onGroup" />
        <span>Gruppetilmelding</span>
      </label>
      <span v-if="isGroup" class="slot-inline-field">
        <span>antal pr. gruppe</span>
        <input class="sl-input sl-mini" type="number" min="2" max="99" :value="slot.groupSize" @input="onGroupSize" />
      </span>
      <span v-if="config.showKindPicker && slot.kind === 'paid'" class="slot-inline-field">
        <span>Pris</span>
        <input class="sl-input sl-mini" type="number" min="0" placeholder="200" :value="slot.price || ''" @input="onPrice" />
        <span>kr</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { SLOT_ROLES } from '@/features/eventAdmin/eventAdmin.data';
import type { EventSlot, EventTypeConfig, SlotKind } from '@/features/eventAdmin/eventAdmin.types';

const props = defineProps<{
  slot: EventSlot;
  index: number;
  config: EventTypeConfig;
  invalid: boolean;
  timeRange: { start: string; end: string };
}>();

const emit = defineEmits<{
  remove: [];
  'set-time': [part: 'start' | 'end', value: string];
}>();

const roleOptions = SLOT_ROLES.map(role => ({ value: role, label: role || 'Ingen rolle' }));

const kindOptions: Array<{ value: SlotKind; label: string }> = [
  { value: 'volunteer', label: 'Frivillig' },
  { value: 'attend', label: 'Tilmeld' },
  { value: 'paid', label: 'Betalt' },
];

const isGroup = computed(() => props.slot.groupSize > 1);

function onCapacityInput(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  props.slot.capacity = Number.isFinite(value) && value > 0 ? value : 1;
}

function onUnlimited(event: Event) {
  props.slot.capacity = (event.target as HTMLInputElement).checked ? 0 : 3;
}

function emitTime(part: 'start' | 'end', event: Event) {
  emit('set-time', part, (event.target as HTMLInputElement).value);
}

function onGroup(event: Event) {
  props.slot.groupSize = (event.target as HTMLInputElement).checked ? 5 : 1;
}

function onGroupSize(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  props.slot.groupSize = Number.isFinite(value) && value >= 2 ? value : 2;
}

function onPrice(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value, 10);
  props.slot.price = Number.isFinite(value) && value >= 0 ? value : 0;
}
</script>

<style scoped>
.slot-row {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fbfcfe;
}

.slot-row.has-error {
  border-color: #c94853;
  background: rgba(201, 72, 83, 0.04);
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slot-index {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn-rm-slot {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.btn-rm-slot:hover {
  color: #c94853;
}

.slot-primary,
.slot-secondary {
  display: grid;
  gap: 12px;
  grid-template-columns: 2fr 1fr;
}

.slot-secondary {
  grid-template-columns: 1fr 1fr;
}

.si-field-label {
  display: block;
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.sl-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 14px;
}

.sl-input:focus {
  outline: none;
  border-color: var(--navy-mid, var(--navy));
}

.si-cap {
  display: grid;
  gap: 6px;
}

.slot-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
}

.time-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range-sep {
  color: var(--muted);
}

.si-kind {
  border: 0;
  padding: 0;
  margin: 0;
  grid-column: 1 / -1;
}

.kind-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.kind-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.kind-pill.active {
  border-color: rgba(15, 70, 123, 0.32);
  background: rgba(15, 70, 123, 0.06);
  color: var(--navy-dark);
  font-weight: 600;
}

.kind-pill input {
  accent-color: var(--navy);
}

.slot-extras {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 4px;
  border-top: 1px dashed var(--border);
}

.slot-inline-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
}

.sl-mini {
  width: 72px;
}

.field-error {
  margin-top: 5px;
  color: #c94853;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .slot-primary,
  .slot-secondary {
    grid-template-columns: 1fr;
  }
}
</style>
