<template>
  <div class="page-stack">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">{{ config.title }}</p>
            <h1 class="page-title">{{ mode === 'form' ? formTitle : config.title }}</h1>
          </div>
          <button v-if="mode === 'list'" type="button" class="btn-action btn-action--primary" @click="startCreate()">
            <i class="ti ti-plus" aria-hidden="true"></i>{{ config.newLabel }}
          </button>
          <button v-else type="button" class="btn-action" @click="cancel">
            <i class="ti ti-arrow-left" aria-hidden="true"></i>Annullér
          </button>
        </div>
      </template>

      <!-- List view -->
      <section v-if="mode === 'list'" class="admin-list">
        <p v-if="loading" class="lead">Henter {{ config.title.toLowerCase() }}…</p>
        <p v-else-if="loadError" class="admin-error">{{ loadError }}</p>
        <p v-else-if="!events.length" class="admin-empty">{{ config.empty }}</p>

        <ul v-else class="admin-cards">
          <li v-for="event in events" :key="event.id" class="admin-card">
            <button type="button" class="admin-card-main" @click="startEdit(event.id)">
              <img v-if="event.imageUrl" class="admin-card-thumb" :src="event.imageUrl" :alt="event.title" loading="lazy" decoding="async" />
              <div class="admin-card-body">
                <div class="admin-card-title-row">
                  <span class="admin-card-title">{{ event.title }}</span>
                  <span class="admin-status-chip" :class="event.active ? 'active' : 'inactive'">
                    {{ event.active ? 'Aktiv' : 'Skjult' }}
                  </span>
                </div>
                <div class="admin-card-meta">
                  <span v-if="event.dateText">{{ event.dateText }}</span>
                  <span v-if="event.location">· {{ event.location }}</span>
                  <span>· {{ event.slots.length }} {{ event.slots.length === 1 ? 'plads' : 'pladser' }}</span>
                </div>
              </div>
            </button>
            <div class="admin-card-actions">
              <button type="button" class="btn-action" @click="startEdit(event.id)">Rediger</button>
              <button type="button" class="btn-action btn-action--danger" @click="confirmRemove(event)">Slet</button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Form view -->
      <form v-else class="admin-form" @submit.prevent="onSave">
        <div class="field" :class="{ 'has-error': titleError }">
          <label for="evTitle">Titel *</label>
          <input id="evTitle" v-model="draft.title" type="text" class="form-input" :placeholder="config.formNew" :aria-invalid="titleError" />
          <div v-if="titleError" class="field-error" role="alert">{{ config.titleError }}</div>
        </div>

        <div class="field">
          <label for="evDesc">Beskrivelse</label>
          <textarea id="evDesc" v-model="draft.description" class="form-input" rows="3" placeholder="Kort beskrivelse til forældrene…"></textarea>
        </div>

        <div class="form-row">
          <div class="field">
            <label for="evDate">Dato-tekst</label>
            <div class="input-action-row">
              <input id="evDate" v-model="draft.dateText" type="text" class="form-input" placeholder="Tirsdag 23. juni · 16:00–22:00" />
              <button type="button" class="field-icon-button" aria-label="Vælg dato" title="Vælg dato" @click="openDatePicker">
                <i class="ti ti-calendar" aria-hidden="true"></i>
              </button>
              <input ref="datePicker" class="native-date-picker" type="date" tabindex="-1" aria-hidden="true" @change="applyPickedDate" />
            </div>
          </div>
          <div class="field location-field">
            <label for="evLoc">Sted</label>
            <input
              id="evLoc"
              v-model="draft.location"
              type="text"
              class="form-input"
              placeholder="Sluseholmen"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="evLocListbox"
              :aria-expanded="locationSuggestionsOpen"
              :aria-activedescendant="activeLocationOptionId"
              @input="onLocationInput"
              @keydown="onLocationKeydown"
              @blur="onLocationBlur"
            />
            <div
              v-if="locationSuggestionsOpen"
              id="evLocListbox"
              class="addr-listbox"
              role="listbox"
              aria-label="Adresseforslag"
            >
              <button
                v-for="(suggestion, index) in locationSuggestions"
                :id="locationOptionId(index)"
                :key="suggestion.place_id"
                type="button"
                class="addr-option"
                :class="{ active: index === locationActiveIndex }"
                role="option"
                :aria-selected="index === locationActiveIndex"
                @mousedown.prevent="selectLocationSuggestion(index)"
              >
                {{ suggestion.display_name }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="locationMapUrl" class="location-map-wrap">
          <iframe class="location-map" :src="locationMapUrl" loading="lazy" title="Kort over valgt sted"></iframe>
        </div>

        <div class="field">
          <span class="field-label-static">Billede</span>
          <div class="img-block">
            <img v-if="draft.imageUrl" class="img-preview" :src="draft.imageUrl" alt="" />
            <div class="img-actions">
              <button type="button" class="btn-action" @click="pickerOpen = true">
                <i class="ti ti-photo-search" aria-hidden="true"></i>Vælg fra bibliotek
              </button>
              <button v-if="draft.imageUrl" type="button" class="btn-action" @click="draft.imageUrl = ''">Fjern billede</button>
            </div>
          </div>
        </div>

        <div class="divider">Pladser</div>
        <div class="slots-list">
          <EventSlotEditor
            v-for="(slot, index) in draft.slots"
            :key="slot.id"
            :slot="slot"
            :index="index"
            :config="config"
            :invalid="invalidSlotIds.has(slot.id)"
            :invalid-time="invalidSlotTimeIds.has(slot.id)"
            :time-range="slotTimeRange(slot)"
            @remove="removeSlot(slot.id)"
            @set-time="(part, value) => setSlotTime(slot, part, value)"
          />
        </div>
        <button type="button" class="btn-action btn-add-slot" @click="addSlot">
          <i class="ti ti-plus" aria-hidden="true"></i>Tilføj plads
        </button>
        <div v-if="slotsError" class="field-error" role="alert">Tilføj mindst én plads.</div>

        <template v-if="config.showPayment">
          <div class="divider">Betaling</div>
          <div class="form-row">
            <div class="field">
              <label for="evPay">MobilePay-link</label>
              <input id="evPay" v-model="draft.paymentUrl" type="url" class="form-input" placeholder="https://mobilepay.dk/…" />
            </div>
            <div class="field field--narrow">
              <label for="evCancel">Aflysningsfrist (dage)</label>
              <input id="evCancel" v-model.number="draft.cancelDeadlineDays" type="number" min="0" class="form-input" placeholder="3" />
            </div>
          </div>
        </template>

        <div class="form-footer">
          <label class="check-row">
            <input v-model="draft.active" type="checkbox" />
            <span>Aktiv (synlig for forældre)</span>
          </label>
          <button type="submit" class="btn-action btn-action--primary" :disabled="saving">
            {{ saving ? 'Gemmer…' : config.saveLabel }}
          </button>
          <p v-if="saveError" class="admin-error" role="alert">{{ saveError }}</p>
        </div>
      </form>
    </PageCard>

    <LibraryPickerModal
      :open="pickerOpen"
      title="Billedbibliotek"
      subtitle="Vælg et eksisterende billede eller upload et nyt."
      :items="libraryItems"
      :categories="libraryCategories"
      :selected-item-id="''"
      @close="pickerOpen = false"
      @pick="onPickImage"
      @upload="onUploadImage"
    />

    <ConfirmDialog
      :open="pendingRemove !== null"
      title="Slet arrangement"
      :message="pendingRemove ? `Slet “${pendingRemove.title}”? Dette kan ikke fortrydes.` : ''"
      confirm-label="Slet arrangement"
      @confirm="performRemove"
      @cancel="pendingRemove = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import ConfirmDialog from '@/components/ConfirmDialog.vue';
import PageCard from '@/components/PageCard.vue';
import EventSlotEditor from '@/components/admin/EventSlotEditor.vue';
import LibraryPickerModal from '@/components/library/LibraryPickerModal.vue';
import { useEventAdmin } from '@/features/eventAdmin/useEventAdmin';
import type { AdminEvent, EventSection } from '@/features/eventAdmin/eventAdmin.types';
import { eventItems } from '@/features/events/events.data';
import { useLibraryPage } from '@/features/library/useLibraryPage';
import type { LibraryItem } from '@/features/library/library.types';

const props = defineProps<{ section: EventSection }>();

const {
  config,
  events,
  loading,
  loadError,
  saving,
  saveError,
  mode,
  draft,
  titleError,
  slotsError,
  invalidSlotIds,
  invalidSlotTimeIds,
  formTitle,
  load,
  startCreate,
  startEdit,
  cancel,
  addSlot,
  removeSlot,
  slotTimeRange,
  setSlotTime,
  save,
  remove,
} = useEventAdmin(props.section);

const {
  items: libraryItems,
  categories: libraryCategories,
  load: loadLibrary,
  uploadItem,
} = useLibraryPage({ autoLoad: false });

const pickerOpen = ref(false);
const libraryLoaded = ref(false);
const route = useRoute();
const datePicker = ref<HTMLInputElement | null>(null);
const locationSuggestions = ref<LocationSuggestion[]>([]);
const locationActiveIndex = ref(-1);
const locationMapQuery = ref('');
let locationSearchTimer: ReturnType<typeof setTimeout> | null = null;
let locationMapTimer: ReturnType<typeof setTimeout> | null = null;
let locationRequestCounter = 0;

type LocationSuggestion = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const DA_WEEKDAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const DA_MONTHS = [
  'januar',
  'februar',
  'marts',
  'april',
  'maj',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'december',
];

const locationSuggestionsOpen = computed(() => locationSuggestions.value.length > 0);
const activeLocationOptionId = computed(() =>
  locationActiveIndex.value >= 0 ? locationOptionId(locationActiveIndex.value) : undefined,
);
const locationMapUrl = computed(() => {
  const query = locationMapQuery.value.trim();
  if (!query) return '';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
});

onMounted(async () => {
  await load();
  // Deep link from the public events page: /vagter?edit=<id> opens that event.
  const editId = route.query.edit;
  if (typeof editId === 'string' && editId) {
    if (events.value.some(event => event.id === editId)) {
      startEdit(editId);
    } else {
      // Not a real Firestore doc (e.g. a static placeholder from /events) —
      // open a populated create form so saving persists it for the first time.
      const template = staticTemplate(editId);
      if (template) startCreate(template);
    }
  } else if (route.query.new !== undefined) {
    startCreate();
  }
});

function staticTemplate(id: string) {
  const item = eventItems.find(event => event.id === id);
  if (!item) return null;
  return {
    title: item.title,
    description: item.summary,
    dateText: item.dateText,
    location: item.location,
    imageUrl: item.image.startsWith('/og-') ? '' : item.image,
  };
}

async function onSave() {
  const saved = await save();
  if (!saved) {
    await nextTick();
    focusFirstInvalidField();
  }
}

watch(pickerOpen, open => {
  if (!open || libraryLoaded.value) return;
  libraryLoaded.value = true;
  void loadLibrary();
});

watch(mode, currentMode => {
  locationMapQuery.value = currentMode === 'form' ? draft.location.trim() : '';
  closeLocationSuggestions();
});

onBeforeUnmount(() => {
  if (locationSearchTimer) clearTimeout(locationSearchTimer);
  if (locationMapTimer) clearTimeout(locationMapTimer);
});

function focusFirstInvalidField() {
  const target = document.querySelector<HTMLElement>(
    '.admin-form [aria-invalid="true"], .admin-form .field-error',
  );
  target?.focus?.();
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function openDatePicker() {
  const picker = datePicker.value;
  if (!picker) return;
  if (typeof picker.showPicker === 'function') {
    try {
      picker.showPicker();
      return;
    } catch {
      // Fall back to focus below when the browser blocks programmatic picker UI.
    }
  }
  picker.focus();
}

function applyPickedDate(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (!value) return;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return;
  const weekday = DA_WEEKDAYS[date.getDay()];
  draft.dateText = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}. ${DA_MONTHS[date.getMonth()]}`;
}

function onLocationInput() {
  draft.locationLat = null;
  draft.locationLng = null;
  scheduleLocationSearch(draft.location);
  scheduleLocationMap(draft.location);
}

function scheduleLocationSearch(query: string) {
  if (locationSearchTimer) clearTimeout(locationSearchTimer);
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    closeLocationSuggestions();
    return;
  }
  locationSearchTimer = setTimeout(() => {
    void searchLocation(trimmed);
  }, 350);
}

function scheduleLocationMap(query: string) {
  if (locationMapTimer) clearTimeout(locationMapTimer);
  const trimmed = query.trim();
  if (!trimmed) {
    locationMapQuery.value = '';
    return;
  }
  locationMapTimer = setTimeout(() => {
    locationMapQuery.value = trimmed;
  }, 600);
}

async function searchLocation(query: string) {
  const requestId = ++locationRequestCounter;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=dk&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'da' } });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const results = (await response.json()) as LocationSuggestion[];
    if (requestId !== locationRequestCounter) return;
    locationSuggestions.value = Array.isArray(results) ? results : [];
    locationActiveIndex.value = -1;
  } catch (error) {
    console.error('[event-admin] location search failed', error);
    closeLocationSuggestions();
  }
}

function selectLocationSuggestion(index: number) {
  const suggestion = locationSuggestions.value[index];
  if (!suggestion) return;
  if (locationMapTimer) clearTimeout(locationMapTimer);
  draft.location = suggestion.display_name;
  draft.locationLat = parseFloat(suggestion.lat);
  draft.locationLng = parseFloat(suggestion.lon);
  locationMapQuery.value = suggestion.display_name;
  closeLocationSuggestions();
}

function onLocationKeydown(event: KeyboardEvent) {
  if (!locationSuggestionsOpen.value) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveLocationActive(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveLocationActive(-1);
  } else if (event.key === 'Enter' && locationActiveIndex.value >= 0) {
    event.preventDefault();
    selectLocationSuggestion(locationActiveIndex.value);
  } else if (event.key === 'Escape') {
    closeLocationSuggestions();
  }
}

function moveLocationActive(delta: number) {
  if (!locationSuggestions.value.length) return;
  locationActiveIndex.value =
    (locationActiveIndex.value + delta + locationSuggestions.value.length) % locationSuggestions.value.length;
}

function onLocationBlur() {
  window.setTimeout(closeLocationSuggestions, 120);
}

function closeLocationSuggestions() {
  locationSuggestions.value = [];
  locationActiveIndex.value = -1;
}

function locationOptionId(index: number) {
  return `evLocOption${index}`;
}

function onPickImage(item: LibraryItem) {
  draft.imageUrl = item.imageUrl;
  pickerOpen.value = false;
}

async function onUploadImage(file: File, categoryId: string) {
  const uploaded = await uploadItem(file, categoryId);
  if (uploaded) {
    draft.imageUrl = uploaded.imageUrl;
    pickerOpen.value = false;
  }
}

const pendingRemove = ref<AdminEvent | null>(null);

function confirmRemove(event: AdminEvent) {
  pendingRemove.value = event;
}

function performRemove() {
  const event = pendingRemove.value;
  pendingRemove.value = null;
  if (event) void remove(event.id);
}
</script>

<style scoped>
.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.admin-error {
  color: #c94853;
  font-weight: 600;
}

.admin-empty {
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--muted);
  background: #f3f5f8;
}

.admin-cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.admin-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
}

.admin-card-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.admin-card-thumb {
  width: 64px;
  height: 64px;
  border-radius: 9px;
  object-fit: cover;
  flex-shrink: 0;
}

.admin-card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-card-title {
  color: var(--navy);
  font-size: 1rem;
  font-weight: 700;
}

.admin-card-meta {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.88rem;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.admin-status-chip {
  padding: 2px 9px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.admin-status-chip.active {
  background: var(--gold-light);
  color: var(--navy);
}

.admin-status-chip.inactive {
  background: #eef1f4;
  color: var(--muted);
}

.admin-card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action--danger {
  border-color: rgba(201, 72, 83, 0.4);
  color: #c94853;
}

.admin-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 6px;
}

.field--narrow {
  max-width: 180px;
}

.field label,
.field-label-static {
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.field.has-error .form-input {
  border-color: #c94853;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #f8f9fb;
  color: var(--text);
  font: inherit;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: var(--navy-light);
  background: #fff;
}

.form-input:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}

textarea.form-input {
  resize: vertical;
}

.form-row {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
}

.input-action-row {
  position: relative;
  display: grid;
}

.input-action-row .form-input {
  padding-right: 46px;
}

.field-icon-button {
  position: absolute;
  top: 50%;
  right: 5px;
  width: 34px;
  height: 34px;
  transform: translateY(-50%);
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--navy);
  cursor: pointer;
  font: inherit;
}

.field-icon-button:hover,
.field-icon-button:focus-visible {
  border-color: var(--border);
  background: #f3f5f8;
}

.field-icon-button:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}

.native-date-picker {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.location-field {
  position: relative;
}

.addr-listbox {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  max-height: 230px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(11, 31, 58, 0.14);
}

.addr-option {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid #eef2f6;
  background: #fff;
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 1.35;
  text-align: left;
}

.addr-option:last-child {
  border-bottom: 0;
}

.addr-option:hover,
.addr-option.active {
  background: #f3f5f8;
  color: var(--navy);
}

.location-map-wrap {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f3f5f8;
}

.location-map {
  display: block;
  width: 100%;
  height: 210px;
  border: 0;
}

.img-block {
  display: grid;
  gap: 10px;
}

.img-preview {
  width: 100%;
  max-width: 260px;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.img-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.divider {
  margin-top: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
  color: var(--navy);
  font-size: 0.95rem;
  font-weight: 700;
}

.slots-list {
  display: grid;
  gap: 12px;
}

.btn-add-slot {
  justify-self: start;
}

.field-error {
  color: #c94853;
  font-size: 12px;
  font-weight: 600;
}

.form-footer {
  display: grid;
  gap: 12px;
  padding-top: 6px;
}

.check-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
}

.form-footer .btn-action--primary {
  justify-self: start;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .admin-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
