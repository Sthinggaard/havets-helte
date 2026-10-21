<template>
  <div class="admin-workspace-shell">
    <PublicHero :title="heroTitle" :copy="heroCopy" />

    <div class="page-stack">
      <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Lederportal</p>
            <h1 class="page-title">{{ heroTitle }}</h1>
            <p class="workspace-subtitle">{{ heroCopy }}</p>
          </div>
          <div class="workspace-header-actions">
            <div class="hero-meta">
              <span class="meta-chip"><i class="ti ti-list" aria-hidden="true"></i>{{ heroCountLabel }}</span>
              <span class="meta-chip"><i class="ti ti-photo" aria-hidden="true"></i>{{ mode === 'form' ? 'Formular' : 'Oversigt' }}</span>
              <span v-if="mode === 'form'" class="meta-chip"><i class="ti ti-eye" aria-hidden="true"></i>{{ draft.active ? 'Synlig' : 'Skjult' }}</span>
            </div>
            <button v-if="mode === 'form'" type="button" class="btn-action" @click="cancel">
              <i class="ti ti-layout-list" aria-hidden="true"></i>Tilbage til oversigt
            </button>
          </div>
        </div>
      </template>

      <div class="info-strip">
      <span class="info-chip">
        <i class="ti ti-calendar" aria-hidden="true"></i>
        {{ config.title }}
      </span>
      <span class="info-chip" v-if="mode === 'list'">
        <i class="ti ti-edit" aria-hidden="true"></i>
        Rediger landing page-indhold
      </span>
      <span class="info-chip" v-else>
        <i class="ti ti-layout-list" aria-hidden="true"></i>
        {{ formTitle }}
      </span>
      </div>

      <p v-if="sectionLead" class="lead event-lead">{{ sectionLead }}</p>

      <section v-if="mode === 'list'" class="admin-list">
        <div class="admin-list-head">
          <div class="admin-list-head-main">
            <p class="admin-list-eyebrow">Oversigt</p>
            <h2 class="admin-list-title">{{ config.title }}</h2>
            <p class="admin-list-sub">Rediger den eksisterende liste, eller opret en ny øverst.</p>
          </div>
          <button type="button" class="btn-action btn-action--primary admin-list-create" @click="startCreate()">
            <i class="ti ti-plus" aria-hidden="true"></i>{{ config.newLabel }}
          </button>
        </div>
        <p v-if="loading" class="lead">Henter {{ config.title.toLowerCase() }}…</p>
        <p v-else-if="loadError" class="admin-error">{{ loadError }}</p>
        <p v-else-if="!events.length" class="admin-empty">{{ config.empty }}</p>

        <ul v-else class="admin-cards">
          <li v-for="event in events" :key="event.id" class="admin-card">
            <button type="button" class="admin-card-main" @click="viewSignups(event)">
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
                  <span>· {{ componentSummary(event) }}</span>
                </div>
              </div>
            </button>
            <div class="admin-card-actions">
              <button type="button" class="btn-action" @click="viewSignups(event)">Se tilmeldte</button>
              <button type="button" class="btn-action" @click="startEdit(event.id)">Rediger {{ config.type === 'timed' ? 'vagt' : config.type === 'task' ? 'opgave' : 'arrangement' }}</button>
              <button type="button" class="btn-action btn-action--danger" @click="confirmRemove(event)">Slet</button>
            </div>
          </li>
        </ul>
      </section>

      <form v-else class="admin-form" @submit.prevent="onSave">
        <div class="field" :class="{ 'has-error': titleError }">
          <label for="evTitle">Titel *</label>
          <FormControl id="evTitle" v-model="draft.title" :placeholder="config.formNew" :aria-invalid="titleError" />
          <div v-if="titleError" class="field-error" role="alert">{{ config.titleError }}</div>
        </div>

        <section class="image-field" aria-labelledby="image-field-title">
          <div id="image-field-title" class="field-label-static">Billede</div>
          <div class="image-field-content" :class="{ 'image-field-content--empty': !draft.imageUrl }">
            <div v-if="draft.imageUrl" class="image-preview-wrap">
              <img class="image-preview" :src="draft.imageUrl" alt="Valgt billede til siden" />
            </div>
            <div class="image-field-actions">
              <button type="button" class="btn-action" @click="pickerOpen = true">
                <i class="ti ti-photo-plus" aria-hidden="true"></i>{{ draft.imageUrl ? 'Skift billede' : 'Vælg billede' }}
              </button>
              <button v-if="draft.imageUrl" type="button" class="btn-action" @click="draft.imageUrl = ''">Fjern billede</button>
              <p v-if="uploadError" class="image-field-error" role="alert">{{ uploadError }}</p>
            </div>
          </div>
        </section>

        <div class="field">
          <label for="evDesc">Beskrivelse</label>
          <FormControl id="evDesc" v-model="draft.description" as="textarea" rows="3" placeholder="Kort beskrivelse til forældrene…" />
        </div>

        <EventLeadersPicker v-model="draft.responsibleLeaders" @name-change="markLeaderNameChanged" />

        <div class="form-row">
          <div class="field" :class="{ 'has-error': eventDateError }">
            <label for="evEventDate">Eventdato (obligatorisk)</label>
            <div class="input-action-row">
              <FormControl id="evEventDate" v-model="draft.eventDate" type="date" required :aria-invalid="eventDateError" aria-describedby="event-date-error" @update:model-value="syncEventDateText" />
              <button type="button" class="field-icon-button" aria-label="Vælg dato" title="Vælg dato" @click="openDatePicker">
                <i class="ti ti-calendar" aria-hidden="true"></i>
              </button>
              <input ref="datePicker" class="native-date-picker" type="date" tabindex="-1" aria-hidden="true" @change="applyPickedDate" />
            </div>
            <div v-if="eventDateError" id="event-date-error" class="field-error" role="alert">Vælg en gyldig dato for arrangementet.</div>
          </div>
          <div class="field location-field">
            <label for="evLoc">Sted</label>
            <FormControl
              id="evLoc"
              v-model="draft.location"
              placeholder="Sluseholmen"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="evLocListbox"
              :aria-expanded="locationSuggestionsOpen"
              :aria-activedescendant="activeLocationOptionId"
              @update:model-value="onLocationInput"
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

        <div class="divider">{{ config.type === 'event' ? 'Tilmeldinger, opgaver og vagter' : 'Pladser' }}</div>
        <div class="slots-list">
          <div v-if="(config.type === 'event' || config.type === 'task') && !taskGroups.length || config.type === 'event' && !signupSlots.length || (config.type === 'event' || config.type === 'timed') && !shiftGroups.length" class="empty-section-actions">
            <SectionAddButton v-if="(config.type === 'event' || config.type === 'task') && !taskGroups.length" tone="task" label="Tilføj opgavesektion" @click="addAndFocus('task')" />
            <SectionAddButton v-if="config.type === 'event' && !signupSlots.length" tone="signup" label="Tilføj tilmeldingssektion" @click="addAndFocus('signup')" />
            <SectionAddButton v-if="(config.type === 'event' || config.type === 'timed') && !shiftGroups.length" tone="shift" label="Tilføj vagtsektion" @click="addAndFocus('shift')" />
          </div>
          <template v-for="(group, index) in taskGroups" :key="group.id">
            <TaskTypeEditor
              :slots="group.slots"
              :index="index"
              :config="config"
              :event-date="draft.eventDate"
              :invalid="group.slots.some(slot => invalidSlotIds.has(slot.id))"
              :invalid-slot-ids="invalidSlotIds"
              data-component-type="task"
              :data-section-id="group.id"
              @remove="removeTaskGroup(group.id)"
              @remove-task="removeSlot"
              @add-task="addTask(group.id)"
              @update-title="title => updateTaskTitle(group.id, title)"
              @update-date="date => updateTaskDate(group.id, date)"
              @update-schedule="(mode, offsetDays) => updateTaskSchedule(group.id, mode, offsetDays)"
              @update-deadline-schedule="(mode, offsetDays) => updateTaskDeadlineSchedule(group.id, mode, offsetDays)"
              @update-deadline-date="date => updateTaskDeadlineDate(group.id, date)"
            />
            <SectionAddButton tone="task" icon="ti-copy" label="Kopiér opgavesektion" @click="copyTaskGroup(group.id)" />
            <SectionAddButton tone="task" label="Tilføj opgavesektion" @click="addAndFocus('task')" />
          </template>

          <template v-for="(slot, index) in signupSlots" :key="slot.id">
            <EventSlotEditor
              :slot="slot"
              :index="index"
              :config="config"
              :invalid="invalidSlotIds.has(slot.id)"
              :invalid-time="false"
              :invalid-member-service-url="invalidMemberServiceUrlIds.has(slot.id)"
              :event-date="draft.eventDate"
              :time-range="{ start: '', end: '' }"
              data-component-type="signup"
              :data-section-id="slot.id"
              @remove="removeSlot(slot.id)"
              @set-time="() => undefined"
            />
            <SectionAddButton tone="signup" icon="ti-copy" label="Kopiér tilmeldingssektion" @click="copySignupSlot(slot.id)" />
            <SectionAddButton tone="signup" label="Tilføj tilmeldingssektion" @click="addAndFocus('signup')" />
          </template>

          <template v-for="(group, index) in shiftGroups" :key="group.id">
            <ShiftTypeEditor
              :index="index"
              :slots="group.slots"
              :invalid="group.slots.some(slot => invalidSlotIds.has(slot.id))"
              :invalid-time-ids="invalidSlotTimeIds"
              :event-date="draft.eventDate"
              data-component-type="shift"
              :data-section-id="group.id"
              @remove="removeShiftGroup(group.id)"
              @remove-period="removeShiftPeriod"
              @add-period="addShiftPeriod(group.id)"
              @update-common="(field, value) => updateShiftCommon(group.id, field, value)"
              @update-duration="duration => updateShiftDuration(group.id, duration)"
              @update-capacity="updateShiftCapacity"
              @update-adult="updateShiftAdult"
              @set-start="start => setShiftStart(group.id, start)"
              @update-schedule="(mode, offsetDays) => updateShiftSchedule(group.id, mode, offsetDays)"
              @update-recurrence="(weekdays, startDate, endDate) => updateShiftRecurrence(group.id, weekdays, startDate, endDate)"
            />
            <SectionAddButton tone="shift" icon="ti-copy" label="Kopiér vagtsektion" @click="copyShiftGroup(group.id)" />
            <SectionAddButton tone="shift" label="Tilføj vagtsektion" @click="addAndFocus('shift')" />
          </template>
        </div>
        <div v-if="slotsError" class="field-error" role="alert">Tilføj mindst én tilmelding, opgave eller vagt.</div>

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

      <div class="admin-toast" :class="{ show: toastVisible }" role="status" aria-live="polite">{{ toastText }}</div>

      </PageCard>

    <div class="admin-modals">
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

      <div v-if="eventActionTarget" class="admin-action-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-action-title">
        <div class="admin-action-dialog__panel">
          <button type="button" class="admin-action-dialog__close" aria-label="Luk" @click="eventActionTarget = null">×</button>
          <p class="admin-list-eyebrow">Admin</p>
          <h2 id="admin-action-title">{{ eventActionTarget.title }}</h2>
          <p>Hvad vil du gøre?</p>
          <div class="admin-action-dialog__actions">
            <button type="button" class="btn-action btn-action--primary" @click="editEventFromActions">Rediger event</button>
            <button type="button" class="btn-action" @click="viewSignupsFromActions">Se tilmeldte</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EventSlotEditor from '@/components/admin/EventSlotEditor.vue';
import EventLeadersPicker from '@/components/admin/EventLeadersPicker.vue';
import ShiftTypeEditor from '@/components/admin/ShiftTypeEditor.vue';
import TaskTypeEditor from '@/components/admin/TaskTypeEditor.vue';
import SectionAddButton from '@/components/admin/SectionAddButton.vue';
import FormControl from '@/components/form/FormControl.vue';
import LibraryPickerModal from '@/components/library/LibraryPickerModal.vue';
import PageCard from '@/components/PageCard.vue';
import PublicHero from '@/components/public/PublicHero.vue';
import { useEventAdmin } from '@/features/eventAdmin/useEventAdmin';
import { createSlot, createSlotId, timeAfter } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent, EventSection, EventSlot } from '@/features/eventAdmin/eventAdmin.types';
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
  editingId,
  draft,
  titleError,
  eventDateError,
  slotsError,
  invalidSlotIds,
  invalidSlotTimeIds,
  invalidMemberServiceUrlIds,
  formTitle,
  load,
  startCreate,
  startEdit,
  cancel,
  addSlot,
  removeSlot,
  save,
  markLeaderNameChanged,
  remove,
} = useEventAdmin(props.section);

const heroTitle = computed(() => (mode.value === 'form' ? draft.title || formTitle.value : config.title));
const taskGroups = computed(() => {
  const groups = new Map<string, EventSlot[]>();
  for (const slot of draft.slots) {
    if (slot.componentType !== 'task') continue;
    const groupId = slot.taskGroupId || `legacy-${slot.taskGroupTitle || slot.label}-${slot.date}`;
    const group = groups.get(groupId) ?? [];
    group.push(slot);
    groups.set(groupId, group);
  }
  return [...groups.entries()].map(([id, slots]) => ({ id, slots }));
});
const signupSlots = computed(() => draft.slots.filter(slot => slot.componentType === 'signup'));
const shiftGroups = computed(() => {
  const groups = new Map<string, EventSlot[]>();
  for (const slot of draft.slots) {
    if (slot.componentType !== 'shift') continue;
    const groupId = slot.shiftGroupId || slot.id;
    const group = groups.get(groupId) ?? [];
    group.push(slot);
    groups.set(groupId, group);
  }
  return [...groups.entries()].map(([id, slots]) => ({ id, slots }));
});

async function addAndFocus(componentType: 'task' | 'shift' | 'signup') {
  addSlot(componentType);
  await nextTick();
  const components = document.querySelectorAll<HTMLElement>(`[data-component-type="${componentType}"]`);
  const newest = components[components.length - 1];
  newest?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  newest?.querySelector<HTMLElement>('input, select, button')?.focus({ preventScroll: true });
}

async function focusCopiedSection(componentType: 'task' | 'shift' | 'signup', sectionId: string, message: string) {
  await nextTick();
  const target = document.querySelector<HTMLElement>(`[data-component-type="${componentType}"][data-section-id="${sectionId}"]`);
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target?.querySelector<HTMLElement>('input, select, button')?.focus({ preventScroll: true });
  showToast(message);
}

function showToast(message: string) {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
    toastTimer = null;
  }, 2600);
}
const heroImage = computed(() => {
  if (mode.value === 'form') return draft.imageUrl || eventItems.find(item => item.type === config.type)?.image || '';
  const firstImage = events.value[0]?.imageUrl;
  return firstImage || eventItems.find(item => item.type === config.type)?.image || '';
});
const heroCopy = computed(() =>
  mode.value === 'form'
    ? `Rediger den offentlige landing page for ${config.title.toLowerCase()}.`
    : `Åbn et opslag og rediger det som den offentlige landing page viser det.`,
);
const heroCountLabel = computed(() => {
  if (mode.value === 'form') return `${draft.slots.length} elementer`;
  return `${events.value.length} opslag`;
});
const sectionEyebrow = computed(() => (mode.value === 'form' ? config.formEdit : 'Oversigt'));
const sectionTitle = computed(() => (mode.value === 'form' ? (draft.title || formTitle.value) : `${config.title} opslag`));
const sectionChip = computed(() => (mode.value === 'form' ? (draft.active ? 'Synlig' : 'Skjult') : ''));
const sectionLead = computed(() =>
  mode.value === 'form'
    ? 'Skift titel, tekst, billede, opgaver, vagter og betaling.'
    : `Det her er den redigerbare backend-version af ${config.title.toLowerCase()}.`,
);

const {
  items: libraryItems,
  categories: libraryCategories,
  load: loadLibrary,
  uploadError,
  uploadItem,
} = useLibraryPage({ autoLoad: false });

const pickerOpen = ref(false);
const libraryLoaded = ref(false);
const route = useRoute();
const router = useRouter();
const eventActionTarget = ref<AdminEvent | null>(null);
const toastVisible = ref(false);
const toastText = ref('');
let toastTimer: ReturnType<typeof setTimeout> | null = null;
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

function openEventActions(event: AdminEvent) { eventActionTarget.value = event; }
function editEventFromActions() {
  const event = eventActionTarget.value;
  eventActionTarget.value = null;
  if (event) startEdit(event.id);
}
async function viewSignupsFromActions() {
  const event = eventActionTarget.value;
  eventActionTarget.value = null;
  if (!event) return;
  await viewSignups(event);
}
async function viewSignups(event: AdminEvent) {
  await router.push({ path: '/admin/tilmeldte', query: { event: event.id } });
}

onMounted(async () => {
  await load();
  // Deep link from the public events page: /vagter?edit=<id> opens that event.
  const editId = route.query.edit ?? route.params.eventId;
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

function shiftSlots(groupId: string) {
  return draft.slots.filter(slot => slot.componentType === 'shift' && (slot.shiftGroupId || slot.id) === groupId);
}

function updateShiftCommon(groupId: string, field: 'label' | 'date', value: string) {
  shiftSlots(groupId).forEach(slot => {
    slot[field] = value;
  });
}

function updateShiftSchedule(groupId: string, mode: 'fixed' | 'weekly' | 'biweekly', offsetDays: number) {
  shiftSlots(groupId).forEach(slot => {
    slot.scheduleMode = mode;
    slot.relativeTo = undefined;
    slot.offsetDays = undefined;
    slot.recurrenceMaterialized = false;
    if (mode !== 'fixed') {
      slot.date = '';
      slot.recurrenceWeekday = slot.recurrenceWeekday ?? 6;
      slot.recurrenceWeekdays = slot.recurrenceWeekdays?.length ? slot.recurrenceWeekdays : [slot.recurrenceWeekday];
      slot.recurrenceStartDate = slot.recurrenceStartDate || draft.eventDate || '';
      slot.recurrenceEndDate = slot.recurrenceEndDate || draft.eventDate || '';
    }
  });
}

function updateShiftRecurrence(groupId: string, weekdays: number[], startDate: string, endDate: string) {
  shiftSlots(groupId).forEach(slot => {
    slot.scheduleMode = slot.scheduleMode === 'biweekly' ? 'biweekly' : 'weekly';
    slot.recurrenceWeekdays = [...weekdays];
    slot.recurrenceWeekday = weekdays[0];
    slot.recurrenceStartDate = startDate;
    slot.recurrenceEndDate = endDate;
    slot.date = '';
    slot.recurrenceMaterialized = false;
  });
}

function shiftDuration(groupId: string) {
  return shiftSlots(groupId)[0]?.shiftDurationMinutes ?? 60;
}

function reflowShiftPeriods(groupId: string) {
  const periods = shiftSlots(groupId);
  const duration = shiftDuration(groupId);
  let start = periods[0]?.startTime ?? '';
  periods.forEach(period => {
    period.startTime = start;
    period.endTime = timeAfter(start, duration);
    period.sublabel = period.startTime && period.endTime ? `${period.startTime}–${period.endTime}` : '';
    period.shiftDurationMinutes = duration;
    start = period.endTime;
  });
}

function updateShiftDuration(groupId: string, duration: number) {
  shiftSlots(groupId).forEach(slot => { slot.shiftDurationMinutes = duration; });
  reflowShiftPeriods(groupId);
}

function updateShiftCapacity(slotId: string, value: number) {
  const slot = draft.slots.find(candidate => candidate.id === slotId);
  if (slot) slot.capacity = value;
}

function updateShiftAdult(slotId: string, value: boolean) {
  const slot = draft.slots.find(candidate => candidate.id === slotId);
  if (slot) slot.requiresAdult = value;
}

function setShiftStart(groupId: string, start: string) {
  const firstPeriod = shiftSlots(groupId)[0];
  if (!firstPeriod) return;
  firstPeriod.startTime = start;
  reflowShiftPeriods(groupId);
}

function addShiftPeriod(groupId: string) {
  const periods = shiftSlots(groupId);
  const previous = periods.at(-1);
  if (!previous) return;
  const duration = shiftDuration(groupId);
  draft.slots.push(createSlot({
    ...previous,
    id: undefined,
    shiftGroupId: groupId,
    sublabel: '',
    startTime: previous.endTime,
    endTime: timeAfter(previous.endTime, duration),
    shiftDurationMinutes: duration,
  }));
  slotsError.value = false;
}

function removeShiftPeriod(slotId: string) {
  removeSlot(slotId);
}

function removeShiftGroup(groupId: string) {
  draft.slots = draft.slots.filter(slot => slot.componentType !== 'shift' || (slot.shiftGroupId || slot.id) !== groupId);
}

function taskSlots(groupId: string) {
  return draft.slots.filter(slot => slot.componentType === 'task' && (slot.taskGroupId || `legacy-${slot.taskGroupTitle || slot.label}-${slot.date}`) === groupId);
}

function updateTaskTitle(groupId: string, title: string) {
  taskSlots(groupId).forEach(slot => { slot.taskGroupTitle = title; });
}

function updateTaskDate(groupId: string, date: string) {
  taskSlots(groupId).forEach(slot => { slot.date = date; });
}

function updateTaskSchedule(groupId: string, mode: 'fixed' | 'relative', offsetDays: number) {
  taskSlots(groupId).forEach(slot => {
    slot.scheduleMode = mode;
    slot.relativeTo = mode === 'relative' ? 'event' : undefined;
    slot.offsetDays = mode === 'relative' ? offsetDays : undefined;
    if (mode === 'relative') slot.date = '';
  });
}

function updateTaskDeadlineSchedule(groupId: string, mode: 'fixed' | 'relative' | undefined, offsetDays: number | undefined) {
  taskSlots(groupId).forEach(slot => {
    slot.deadlineScheduleMode = mode;
    slot.deadlineOffsetDays = offsetDays;
    if (mode !== 'fixed') slot.deadlineDate = '';
  });
}

function updateTaskDeadlineDate(groupId: string, date: string) {
  taskSlots(groupId).forEach(slot => {
    slot.deadlineDate = date;
    slot.deadlineScheduleMode = 'fixed';
    slot.deadlineOffsetDays = undefined;
  });
}

function addTask(groupId: string) {
  const group = taskSlots(groupId);
  const template = group[0];
  if (!template) return;
  draft.slots.push(createSlot({
    ...template,
    id: undefined,
    taskGroupId: groupId,
    taskGroupTitle: template.taskGroupTitle,
    label: '',
    sublabel: '',
  }));
  slotsError.value = false;
}

function removeTaskGroup(groupId: string) {
  draft.slots = draft.slots.filter(slot => slot.componentType !== 'task' || (slot.taskGroupId || `legacy-${slot.taskGroupTitle || slot.label}-${slot.date}`) !== groupId);
}

async function copyTaskGroup(groupId: string) {
  const group = taskSlots(groupId);
  if (!group.length) return;
  const newGroupId = createSlotId();
  const copies = group.map(slot => createSlot({
    ...slot,
    id: undefined,
    taskGroupId: newGroupId,
  }));
  const insertAt = Math.max(...group.map(slot => draft.slots.indexOf(slot))) + 1;
  draft.slots.splice(insertAt, 0, ...copies);
  slotsError.value = false;
  await focusCopiedSection('task', newGroupId, 'Opgavesektionen er kopieret');
}

async function copySignupSlot(slotId: string) {
  const slot = draft.slots.find(candidate => candidate.id === slotId);
  if (!slot) return;
  const copied = createSlot({ ...slot, id: undefined, shiftGroupId: '', taskGroupId: '' });
  draft.slots.splice(draft.slots.indexOf(slot) + 1, 0, copied);
  slotsError.value = false;
  await focusCopiedSection('signup', copied.id, 'Tilmeldingssektionen er kopieret');
}

async function copyShiftGroup(groupId: string) {
  const group = shiftSlots(groupId);
  if (!group.length) return;
  const newGroupId = createSlotId();
  const copies = group.map(slot => createSlot({
    ...slot,
    id: undefined,
    shiftGroupId: newGroupId,
  }));
  const insertAt = Math.max(...group.map(slot => draft.slots.indexOf(slot))) + 1;
  draft.slots.splice(insertAt, 0, ...copies);
  slotsError.value = false;
  await focusCopiedSection('shift', newGroupId, 'Vagtsektionen er kopieret');
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
  if (toastTimer) clearTimeout(toastTimer);
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
  draft.eventDate = value;
  syncEventDateText();
}

function syncEventDateText(input?: string | number) {
  const value = input === undefined ? draft.eventDate : String(input);
  if (!value) return;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return;
  const weekday = DA_WEEKDAYS[date.getDay()];
  draft.dateText = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}. ${DA_MONTHS[date.getMonth()]}`;
}

function onLocationInput(input: string | number) {
  const location = String(input);
  draft.locationLat = null;
  draft.locationLng = null;
  scheduleLocationSearch(location);
  scheduleLocationMap(location);
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

function componentSummary(event: AdminEvent) {
  const tasks = event.slots.filter(slot => slot.componentType === 'task').length;
  const shifts = event.slots.length - tasks;
  return [tasks ? `${tasks} ${tasks === 1 ? 'opgave' : 'opgaver'}` : '', shifts ? `${shifts} ${shifts === 1 ? 'vagt' : 'vagter'}` : '']
    .filter(Boolean)
    .join(' · ') || 'Ingen elementer';
}

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
.admin-workspace-shell {
  min-height: 100vh;
  background: #f6f9fc;
}

.admin-workspace-shell :deep(.hero) {
  min-height: 330px;
  background: linear-gradient(135deg, #0b4378 0%, #0f467b 100%);
}

.admin-workspace-shell :deep(.hero-inner) {
  width: min(1100px, calc(100% - 32px));
  align-content: center;
  justify-items: center;
  padding-block: 34px 42px;
  text-align: center;
}

.admin-workspace-shell :deep(.hero-copy) {
  max-width: 620px;
}

.admin-workspace-shell .page-stack {
  width: min(1180px, calc(100% - 32px));
  margin: -72px auto 48px;
  position: relative;
  z-index: 2;
}

.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.workspace-subtitle {
  max-width: 58ch;
  margin: 6px 0 0;
  color: var(--muted);
  line-height: 1.45;
}

.workspace-header-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-actions,
.hero-meta,
.info-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-action,
.meta-chip,
.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
}

.hero-action {
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, border-color 0.15s;
}

.hero-action:hover,
.hero-action:focus-visible {
  transform: translateY(-1px);
}

.hero-action--primary {
  background: #0b1f3a;
  border-color: #0b1f3a;
}

.meta-chip {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
}

.info-chip {
  background: #edf6fc;
  border: 1px solid rgba(11, 67, 120, 0.16);
  color: #0b4378;
}

.admin-error {
  color: #c94853;
  font-weight: 600;
}

.admin-list-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.admin-list-head-main {
  min-width: 0;
}

.admin-list-eyebrow {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-list-title {
  margin: 0;
  color: var(--navy);
  font-size: 1.1rem;
  font-weight: 800;
}

.admin-list-sub {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.admin-list-create {
  flex-shrink: 0;
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
  flex-wrap: wrap;
}

.btn-action--danger {
  border-color: rgba(201, 72, 83, 0.4);
  color: #c94853;
}

.admin-form {
  display: grid;
  gap: 16px;
}

.payment-settings {
  display: grid;
  gap: 12px;
  padding: 14px 0 2px;
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

.field.has-error :deep(.form-control) {
  border-color: #c94853;
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

.input-action-row :deep(.form-control) {
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

.image-field {
  display: grid;
  gap: 8px;
}

.image-field-content {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(180px, 280px) minmax(0, 1fr);
  align-items: start;
}

.image-field-content--empty {
  grid-template-columns: 1fr;
}

.image-preview-wrap {
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--navy-soft);
}

.image-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-field-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.image-field-error {
  flex-basis: 100%;
  margin: 0;
  color: #c94853;
  font-size: 12px;
  font-weight: 600;
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

.empty-section-actions {
  display: grid;
  gap: 12px;
}

.admin-action-dialog { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 20px; background: rgba(5, 24, 49, .58); }
.admin-action-dialog__panel { position: relative; width: min(440px, 100%); padding: 28px; border-radius: 18px; background: #fff; box-shadow: 0 18px 60px rgba(5, 24, 49, .28); }
.admin-action-dialog__panel h2 { margin: 0 0 8px; color: var(--navy); }
.admin-action-dialog__panel p { margin: 0 0 20px; color: var(--muted); }
.admin-action-dialog__close { position: absolute; top: 12px; right: 14px; border: 0; background: transparent; color: var(--navy); font-size: 28px; cursor: pointer; }
.admin-action-dialog__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.admin-toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 60;
  padding: 12px 18px;
  border-radius: 999px;
  background: var(--navy);
  color: #fff;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(120%);
  transition: transform 0.28s var(--ease-out-quint);
}

.admin-toast.show {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
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

.year-wheel-date-fields {
  align-items: start;
}

.field-help {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}

@media (max-width: 640px) {
  .admin-workspace-shell :deep(.hero) {
    min-height: 280px;
  }

  .admin-workspace-shell :deep(.hero-inner) {
    width: min(100%, calc(100% - 28px));
    gap: 8px;
    padding: 24px 14px 34px;
  }

  .admin-workspace-shell :deep(.hero-logo) {
    width: min(132px, 38vw);
  }

  .admin-workspace-shell :deep(.hero-title) {
    font-size: clamp(2rem, 8vw, 3rem);
  }

  .admin-workspace-shell :deep(.hero-copy) {
    font-size: 0.95rem;
    line-height: 1.45;
  }

  .admin-workspace-shell .page-stack {
    width: min(100%, calc(100% - 28px));
    margin-top: -36px;
  }

  .workspace-header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .admin-list-head {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-list-create {
    width: 100%;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .image-field-content {
    grid-template-columns: 1fr;
  }

  .admin-card {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-card-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-card-actions .btn-action {
    justify-content: center;
  }

}
</style>
