<template>
  <div class="slot-row" :class="{ 'has-error': invalid || invalidTime }">
    <div class="slot-header">
      <span class="slot-index">{{ componentLabel }} {{ index + 1 }}</span>
      <button type="button" class="btn-rm-slot" :aria-label="`Fjern ${componentLabel.toLowerCase()} ${index + 1}`" :title="`Slet ${componentLabel.toLowerCase()}`" @click="$emit('remove')">×</button>
    </div>

    <div class="slot-primary">
      <FormField class="si-label" label="Navn" :for-id="`${slot.id}-label`" required :error="invalid ? 'Udfyld navn.' : undefined" :error-id="`${slot.id}-label-error`">
        <FormControl
          :id="`${slot.id}-label`"
          v-model="slot.label"
          :placeholder="isShift ? 'fx Drinksboden' : 'fx Opsætning'"
          :aria-invalid="invalid"
          :aria-describedby="invalid ? `${slot.id}-label-error` : undefined"
        />
      </FormField>
      <div class="si-cap">
        <label class="si-field-label" :for="`${slot.id}-cap`">{{ isShift ? 'Antal personer' : 'Pladser' }}</label>
        <FormControl
          :id="`${slot.id}-cap`"
          class="sl-cap"
          type="number"
          min="1"
          max="999"
          :model-value="slot.capacity === 0 ? '' : slot.capacity"
          :disabled="slot.capacity === 0"
          @update:model-value="onCapacityInput"
        />
        <label class="slot-toggle">
          <input type="checkbox" :checked="slot.capacity === 0" @change="onUnlimited" />
          <span>∞ Ubegr.</span>
        </label>
      </div>
    </div>

    <div class="slot-secondary" :class="{ 'slot-secondary--shift': isShift }">
        <div v-if="slot.componentType === 'task' && !isShift" class="si-role">
        <label class="si-field-label" :for="`${slot.id}-role`">Rolle</label>
        <FormControl :id="`${slot.id}-role`" v-model="slot.role" as="select">
          <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
        </FormControl>
        </div>
      <div v-else-if="slot.componentType === 'signup'" class="si-deadline">
        <label class="si-field-label" :for="`${slot.id}-deadline`">Tilmeldingsfrist</label>
        <FormControl :id="`${slot.id}-deadline`" as="select" :model-value="deadlineScheduleValue" @update:model-value="updateDeadlineSchedule">
          <option value="none">Ingen tilmeldingsfrist</option>
          <option value="fixed">Fast dato</option>
          <option v-for="option in relativeDeadlineOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </FormControl>
        <FormControl v-if="deadlineScheduleValue === 'fixed'" :model-value="slot.deadlineDate ?? ''" type="date" @update:model-value="updateDeadlineDate" />
        <output v-else-if="deadlineScheduleValue !== 'none'" class="schedule-preview">{{ calculatedDeadline || 'Vælg en eventdato først' }}</output>
      </div>
      <fieldset v-if="slot.componentType === 'signup'" class="si-target-audience">
        <legend class="si-field-label">Hvem henvender tilmeldingen sig til?</legend>
        <div class="kind-pills">
          <label v-for="option in signupAudienceOptions" :key="option.value" class="kind-pill" :class="{ active: slot.signupAudience === option.value }">
            <input v-model="slot.signupAudience" type="radio" :name="`${slot.id}-signup-audience`" :value="option.value" />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </fieldset>
      <div v-if="slot.componentType === 'signup'" class="si-audience">
        <span class="si-field-label">Klaner og hold, der kan tilmelde sig</span>
        <details class="audience-picker">
          <summary>{{ audienceSelectionSummary }}</summary>
          <div class="audience-picker-options">
            <label v-for="group in audienceGroupOptions" :key="group.id" class="audience-picker-option">
              <input
                type="checkbox"
                :checked="slot.eligibleGroups.some(selected => selected.id === group.id)"
                @change="toggleAudienceGroup(group)"
              />
              <span>{{ group.label }}</span>
            </label>
            <p v-if="!audienceGroupOptions.length" class="audience-picker-empty">Opret først en gren eller et hold under Grene.</p>
          </div>
        </details>
        <small class="audience-picker-hint">Ingen valg åbner tilmeldingen for alle klaner og hold.</small>
      </div>
      <div v-if="!hideDate" class="si-date">
        <label class="si-field-label" :for="`${slot.id}-date`">Dato</label>
        <FormControl :id="`${slot.id}-date`" v-model="slot.date" type="date" />
      </div>

      <div class="si-sub">
        <label class="si-field-label" :for="`${slot.id}-sub`">{{ isShift ? 'Tidsrum' : 'Detalje' }}</label>
        <div v-if="isShift" class="time-range-row">
          <FormControl
            :id="`${slot.id}-sub`"
            type="time"
            :model-value="timeRange.start"
            aria-label="Starttid"
            :aria-invalid="invalidTime"
            :aria-describedby="invalidTime ? `${slot.id}-time-error` : undefined"
            @update:model-value="emitTime('start', $event)"
          />
          <span class="time-range-sep">–</span>
          <FormControl
            type="time"
            :model-value="timeRange.end"
            aria-label="Sluttid"
            :aria-invalid="invalidTime"
            :aria-describedby="invalidTime ? `${slot.id}-time-error` : undefined"
            @update:model-value="emitTime('end', $event)"
          />
        </div>
        <div v-if="invalidTime" :id="`${slot.id}-time-error`" class="field-error" role="alert">Vælg både start- og sluttid.</div>
        <FormControl
          v-else-if="!isShift"
          :id="`${slot.id}-sub`"
          v-model="slot.sublabel"
          placeholder="fx 5 spejdere pr. patrulje"
        />
      </div>

      <fieldset v-if="config.showKindPicker && !isShift && slot.componentType === 'signup'" class="si-kind">
        <legend class="si-field-label">Deltagelse</legend>
        <div class="kind-pills">
          <label v-for="option in visibleKindOptions" :key="option.value" class="kind-pill" :class="{ active: slot.kind === option.value }">
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
      <label v-if="slot.componentType === 'signup'" class="slot-toggle">
        <input type="checkbox" :checked="isGroup" @change="onGroup" />
        <span>Gruppetilmelding</span>
      </label>
      <span v-if="slot.componentType === 'signup' && isGroup" class="slot-inline-field">
        <span>antal pr. gruppe</span>
        <FormControl class="sl-mini" type="number" min="2" :max="slot.capacity || 99" :model-value="slot.groupSize" @update:model-value="onGroupSize" />
        <small class="slot-inline-hint">Anbefalet: {{ recommendedGroupSize }}</small>
      </span>
      <fieldset v-if="slot.componentType === 'signup' && slot.kind === 'paid'" class="payment-fields">
        <legend>Tilmelding og betaling</legend>
        <div class="kind-pills">
          <label class="kind-pill" :class="{ active: slot.registrationMode === 'local' }">
            <input type="radio" :name="`${slot.id}-registration-mode`" value="local" :checked="slot.registrationMode === 'local'" @change="setRegistrationMode('local')" />
            <span>Havets Helte + MobilePay</span>
          </label>
          <label class="kind-pill" :class="{ active: slot.registrationMode === 'memberService' }">
            <input type="radio" :name="`${slot.id}-registration-mode`" value="memberService" :checked="slot.registrationMode === 'memberService'" @change="setRegistrationMode('memberService')" />
            <span>Medlemsservice</span>
          </label>
        </div>
        <template v-if="slot.registrationMode === 'memberService'">
          <label class="payment-field payment-field--link">
            <span>Link til Medlemsservice *</span>
            <FormControl v-model.trim="slot.memberServiceUrl" type="url" inputmode="url" placeholder="https://…" :aria-invalid="invalidMemberServiceUrl" :aria-describedby="invalidMemberServiceUrl ? `${slot.id}-member-service-url-error` : undefined" />
            <span v-if="invalidMemberServiceUrl" :id="`${slot.id}-member-service-url-error`" class="field-error" role="alert">Indsæt et gyldigt HTTPS-link til den konkrete tilmelding i Medlemsservice.</span>
          </label>
        </template>
        <template v-else>
          <label class="payment-field">
            <span>Pris</span>
            <span class="payment-input-wrap">
              <FormControl class="sl-mini" type="number" min="0" placeholder="200" :model-value="slot.price || ''" @update:model-value="onPrice" />
              <span>kr</span>
            </span>
          </label>
          <label class="payment-field payment-field--link">
            <span>MobilePay-link</span>
            <FormControl v-model="slot.paymentUrl" type="url" placeholder="https://mobilepay.dk/…" />
          </label>
        </template>
      </fieldset>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import FormControl from '@/components/form/FormControl.vue';
import FormField from '@/components/form/FormField.vue';
import { SLOT_ROLES, formatSlotDate } from '@/features/eventAdmin/eventAdmin.data';
import { calculateSlotDeadline } from '@/features/eventAdmin/eventScheduling';
import type { EventSlot, EventTypeConfig, SignupAudience, SignupAudienceGroup, SlotKind } from '@/features/eventAdmin/eventAdmin.types';
import { rosterBranches, rosterTeams } from '@/features/roster/roster.data';

const props = defineProps<{
  slot: EventSlot;
  index: number;
  config: EventTypeConfig;
  invalid: boolean;
  invalidTime: boolean;
  invalidMemberServiceUrl?: boolean;
  eventDate?: string;
  timeRange: { start: string; end: string };
  hideDate?: boolean;
}>();

const emit = defineEmits<{
  remove: [];
  'set-time': [part: 'start' | 'end', value: string];
}>();

const roleOptions = SLOT_ROLES.map(role => ({ value: role, label: role || 'Ingen rolle' }));

const kindOptions: Array<{ value: SlotKind; label: string }> = [
  { value: 'volunteer', label: 'Frivillig' },
  { value: 'attend', label: 'Gratis tilmelding' },
  { value: 'paid', label: 'Betalt tilmelding' },
];
const visibleKindOptions = computed(() => kindOptions);
const signupAudienceOptions: Array<{ value: SignupAudience; label: string }> = [
  { value: 'scouts', label: 'Spejdertilmeldinger' },
  { value: 'parents', label: 'Forældrehelte' },
  { value: 'both', label: 'Begge' },
];
const recommendedGroupSize = computed(() => recommendGroupSize(props.slot.capacity));
const audienceGroupOptions = computed<SignupAudienceGroup[]>(() => {
  const groups: SignupAudienceGroup[] = [];
  for (const team of rosterTeams.filter(item => item.active)) {
    const branch = rosterBranches.find(item => item.id === team.branchId && item.active);
    if (!branch) continue;
    groups.push({
      id: `team:${encodeURIComponent(branch.id)}:${encodeURIComponent(team.label)}`,
      label: `${branch.label} · ${team.label}`,
      branchId: branch.id,
      branchLabel: branch.label,
      team: team.label,
    });
  }
  groups.sort((a, b) => a.branchLabel.localeCompare(b.branchLabel, 'da') || a.team.localeCompare(b.team, 'da'));
  const optionIds = new Set(groups.map(group => group.id));
  for (const selected of props.slot.eligibleGroups.filter(group => group.team)) {
    if (!optionIds.has(selected.id)) groups.push(selected);
  }
  return groups;
});
const audienceSelectionSummary = computed(() => {
  const selected = props.slot.eligibleGroups;
  const count = selected.length;
  if (!count) return 'Alle klaner og hold';
  if (count <= 2) return selected.map(group => group.label).join(', ');
  return `${count} hold valgt`;
});

const isGroup = computed(() => props.slot.groupSize > 1);
const isShift = computed(() => props.slot.componentType === 'shift' || props.config.timedSlots);
const componentLabel = computed(() => isShift.value ? 'Vagt' : props.slot.componentType === 'signup' ? 'Tilmelding' : 'Opgave');
const relativeDeadlineOptions = [
  { value: '-42', label: '6 uger før eventet' },
  { value: '-28', label: '4 uger før eventet' },
  { value: '-14', label: '2 uger før eventet' },
  { value: '-7', label: '1 uge før eventet' },
  { value: '-1', label: '1 dag før eventet' },
  { value: '0', label: 'På eventdagen' },
];
const deadlineScheduleValue = computed(() => {
  if (!props.slot.deadlineScheduleMode) return 'none';
  return props.slot.deadlineScheduleMode === 'relative' ? String(props.slot.deadlineOffsetDays ?? 0) : 'fixed';
});
const calculatedDeadline = computed(() => {
  if (deadlineScheduleValue.value === 'none' || deadlineScheduleValue.value === 'fixed') return '';
  const date = calculateSlotDeadline(props.eventDate, props.slot);
  return date ? `Tilmeld senest ${formatSlotDate(date)}` : '';
});

function toggleAudienceGroup(group: SignupAudienceGroup) {
  const selected = props.slot.eligibleGroups;
  props.slot.eligibleGroups = selected.some(item => item.id === group.id)
    ? selected.filter(item => item.id !== group.id)
    : [...selected, { ...group }];
}

function onCapacityInput(input: string | number) {
  const value = parseInt(String(input), 10);
  props.slot.capacity = Number.isFinite(value) && value > 0 ? value : 1;
  if (props.slot.componentType === 'signup' && isGroup.value) props.slot.groupSize = recommendGroupSize(props.slot.capacity);
}

function onUnlimited(event: Event) {
  props.slot.capacity = (event.target as HTMLInputElement).checked ? 0 : 3;
  if (props.slot.componentType === 'signup' && isGroup.value) props.slot.groupSize = recommendGroupSize(props.slot.capacity);
}

function emitTime(part: 'start' | 'end', value: string | number) {
  emit('set-time', part, String(value));
}

function onGroup(event: Event) {
  props.slot.groupSize = (event.target as HTMLInputElement).checked ? recommendGroupSize(props.slot.capacity) : 1;
}

function recommendGroupSize(capacity: number) {
  if (!capacity) return 5;
  const divisors = Array.from({ length: Math.min(capacity, 10) - 1 }, (_, index) => index + 2)
    .filter(size => capacity % size === 0);
  return divisors.sort((a, b) => Math.abs(5 - a) - Math.abs(5 - b) || b - a)[0] ?? Math.min(5, capacity);
}

function onGroupSize(input: string | number) {
  const value = parseInt(String(input), 10);
  props.slot.groupSize = Number.isFinite(value) && value >= 2 ? value : 2;
}

function onPrice(input: string | number) {
  const value = parseInt(String(input), 10);
  props.slot.price = Number.isFinite(value) && value >= 0 ? value : 0;
}

function setRegistrationMode(mode: 'local' | 'memberService') {
  props.slot.registrationMode = mode;
}

function updateDeadlineSchedule(input: string | number) {
  const value = String(input);
  const mode = value === 'none' ? undefined : value === 'fixed' ? 'fixed' : 'relative';
  props.slot.deadlineScheduleMode = mode;
  props.slot.deadlineOffsetDays = mode === 'relative' ? Number(value) : undefined;
  if (mode !== 'fixed') props.slot.deadlineDate = '';
}

function updateDeadlineDate(input: string | number) {
  props.slot.deadlineDate = String(input);
  props.slot.deadlineScheduleMode = 'fixed';
  props.slot.deadlineOffsetDays = undefined;
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
  grid-template-columns: 1fr 1fr 1.4fr;
}

.slot-secondary--shift {
  grid-template-columns: 1fr 1.4fr;
}

.si-field-label {
  display: block;
  margin-bottom: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
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

.si-target-audience {
  min-width: 0;
  border: 0;
  padding: 0;
  margin: 0;
}

.si-deadline {
  display: grid;
  gap: 6px;
}

.si-audience {
  position: relative;
  display: grid;
  gap: 6px;
  grid-column: 1 / -1;
}

.audience-picker summary {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  list-style: none;
}

.audience-picker summary::-webkit-details-marker {
  display: none;
}

.audience-picker summary::after {
  content: '⌄';
  color: var(--navy);
  font-size: 18px;
  line-height: 1;
}

.audience-picker[open] summary::after {
  content: '⌃';
}

.audience-picker-options {
  position: absolute;
  top: calc(100% + 4px);
  z-index: 20;
  display: grid;
  width: min(100%, 420px);
  max-height: 220px;
  gap: 2px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  box-shadow: var(--shadow-lift);
}

.audience-picker-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-sm);
  color: var(--text);
  cursor: pointer;
}

.audience-picker-option:hover {
  background: var(--navy-soft);
}

.audience-picker-option input {
  accent-color: var(--navy);
}

.audience-picker-empty,
.audience-picker-hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.schedule-preview {
  padding-top: 2px;
  color: var(--navy);
  font-size: 13px;
  font-weight: 700;
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

.slot-inline-hint {
  color: var(--navy-mid);
  font-size: 11px;
  font-weight: 700;
}

.payment-fields {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr) auto;
  gap: 10px 14px;
  width: 100%;
  margin: 0;
  padding: 12px;
  border: 1px solid rgba(15, 70, 123, 0.22);
  border-radius: 10px;
  background: rgba(15, 70, 123, 0.04);
}

.payment-fields legend {
  padding: 0 4px;
  color: var(--navy);
  font-size: 12px;
  font-weight: 700;
}

.payment-fields > .kind-pills {
  align-items: center;
  align-self: end;
}

.payment-field {
  display: grid;
  gap: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.payment-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 400;
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

  .payment-fields {
    grid-template-columns: 1fr;
  }
}
</style>
