<template>
  <PublicLandingPageShell
    content-width="1100px"
    :hero-image="heroImage"
    :hero-image-alt="heroTitle"
    :hero-title="heroTitle"
    :hero-copy="heroCopy"
    hero-variant="event"
    section-title=""
  >
    <template #hero-actions>
      <button type="button" class="hero-action hero-action--primary" @click="scrollToSignup">
        <i class="ti ti-arrow-down" aria-hidden="true"></i>
        {{ sectionMeta.cta }}
      </button>
      <RouterLink class="hero-action" :to="backHref">
        <i class="ti ti-arrow-left" aria-hidden="true"></i>
        Tilbage
      </RouterLink>
      <button type="button" class="hero-action" @click="copyCurrentLink">
        <i class="ti ti-link" aria-hidden="true"></i>
        Kopiér link
      </button>
      <button type="button" class="hero-action" @click="shareCurrentOnFacebook">
        <i class="ti ti-brand-facebook" aria-hidden="true"></i>
        Del
      </button>
    </template>

    <template #hero-meta>
      <HeroMeta
        :date="selectedEvent?.dateText"
        :location="selectedEvent?.location"
        :elements="selectedEvent?.slots.length ?? 0"
      />
      <div v-if="selectedEventAudienceLabels.length" class="event-audience-list">
        <span class="event-audience-label">Tilmelding for:</span>
        <span v-for="label in selectedEventAudienceLabels" :key="label" class="event-audience-chip">{{ label }}</span>
      </div>
    </template>

    <template #body>
      <div v-if="selectedEvent" ref="signupSection">
        <EventLeaders :leaders="selectedEvent.responsibleLeaders" />
        <div v-if="locationMapUrl" class="location-map-wrap">
          <iframe class="location-map" :src="locationMapUrl" loading="lazy" title="Kort over valgt sted"></iframe>
        </div>

        <div v-if="loadingSignups" class="loading-row">
          <i class="ti ti-loader spinning" aria-hidden="true"></i>
          Henter tilmeldinger…
        </div>

        <div v-if="!selectedEvent.slots.length" class="empty-state">
          <div class="empty-state-title">Ingen opgaver eller vagter endnu</div>
          <div class="empty-state-copy">Der er ikke lagt noget ind under arrangementet endnu.</div>
        </div>

        <div v-if="calendarGroups.length > 1" class="shift-tabs-carousel" aria-label="Arrangementsdage">
          <button v-if="calendarTabsCanScrollPrev" type="button" class="shift-tabs-arrow shift-tabs-arrow--prev" aria-label="Vis tidligere dage" @click="scrollCalendarTabs(-1)">
            <i class="ti ti-chevron-left" aria-hidden="true"></i>
          </button>
          <div ref="shiftTabsViewport" class="shift-tabs-viewport" @scroll="updateCalendarTabsOverflow">
            <div class="shift-tabs">
              <section v-for="month in calendarMonthGroups" :key="month.id" class="shift-tabs-month-group">
                <h3 class="shift-tabs-month-label">{{ month.label }}</h3>
                <div class="shift-tabs-month-days" role="tablist" :aria-label="month.label">
              <button
                v-for="day in month.days"
                :key="day.id"
                type="button"
                role="tab"
                class="shift-tab"
                :class="{ active: day.id === selectedCalendarDate, full: calendarDayIsFull(day), task: calendarDayHasTask(day) && !calendarDayHasShift(day) && !calendarDayHasSignup(day), signup: calendarDayHasSignup(day) && !calendarDayHasShift(day) }"
                :aria-selected="day.id === selectedCalendarDate"
                :aria-label="`${calendarDayLabel(day)}, ${calendarDayIsFull(day) ? 'fyldt' : 'ledige pladser'}`"
                @click="selectedCalendarDate = day.id"
              >
                <span class="shift-tab-calendar" aria-hidden="true">
                  <i class="ti ti-calendar-event"></i>
                  <span class="shift-tab-weekday">{{ calendarDayWeekday(day) }}</span>
                  <strong class="shift-tab-day">{{ calendarDayNumber(day) }}</strong>
                  <span class="shift-tab-kind">{{ calendarDayKind(day) }}</span>
                </span>
              </button>
                </div>
              </section>
            </div>
          </div>
          <button v-if="calendarTabsCanScrollNext" type="button" class="shift-tabs-arrow shift-tabs-arrow--next" aria-label="Vis flere dage" @click="scrollCalendarTabs(1)">
            <i class="ti ti-chevron-right" aria-hidden="true"></i>
          </button>
        </div>

        <div
          v-if="selectedEvent.slots.length"
          id="slot-group-panel"
          class="slot-list"
        >
          <template v-for="group in visibleSlotGroups" :key="group.id">
          <article v-if="group.slots.length === 1" class="slot-card" :class="{ 'slot-card--task': group.slots[0].componentType === 'task', 'slot-card--shift': group.slots[0].componentType === 'shift' }">
            <template v-for="slot in group.slots" :key="slot.id">
            <div class="slot-card-head">
              <div>
                <span class="component-type-chip" :class="`component-type-chip--${slot.componentType}`">{{ componentLabel(slot) }}</span>
                <div class="slot-card-title">{{ slot.taskGroupTitle || slot.label }}</div>
                <div v-if="slot.componentType === 'task' && slot.taskGroupTitle && slot.taskGroupTitle !== slot.label" class="slot-card-sub">{{ slot.label }}</div>
                <div class="slot-card-sub">{{ slotMeta(slot) }}</div>
              </div>
              <span v-if="!usesMemberService(slot)" class="slot-card-chip" :class="{ full: slotRemaining(slot) === 0 && slot.capacity !== 0 }">
                {{ slotCapacityLabel(slot) }}
              </span>
            </div>

            <div class="slot-card-details">
              <span v-if="slot.requiresAdult || slot.minAge" class="detail-pill">
                <i class="ti ti-id" aria-hidden="true"></i>
                {{ slot.minAge || 18 }}+
              </span>
              <span v-if="slot.kind === 'paid' && slot.price && !usesMemberService(slot)" class="detail-pill">
                <i class="ti ti-credit-card" aria-hidden="true"></i>
                {{ slot.price }} kr
              </span>
              <span v-if="slot.groupMax > 1" class="detail-pill">
                <i class="ti ti-users" aria-hidden="true"></i>
                {{ slot.groupMin === slot.groupMax ? `${slot.groupMax} personer` : `${slot.groupMin}-${slot.groupMax} personer` }}
              </span>
            </div>

            <div v-if="!usesMemberService(slot)" class="signup-list">
              <div v-if="slotSignups(slot.id).length === 0" class="signup-empty">Ingen tilmeldte endnu</div>
              <div v-for="signup in slotSignups(slot.id)" :key="signup.id" class="signup-row" :class="{ waitlist: signup.waitlist }">
                <span class="signup-av">{{ initials(signup.name) }}</span>
                <div class="signup-main">
                  <div class="signup-name">
                    {{ signup.name }}
                    <span v-if="signup.groupSize > 1" class="group-badge">× {{ signup.groupSize }}</span>
                  </div>
                  <div class="signup-sub">
                    {{ signup.waitlist ? 'Venteliste' : 'Bekræftet' }}
                    <span v-if="signup.adult"> · 18+</span>
                    <span v-if="signup.audienceGroupLabel"> · {{ signup.audienceGroupLabel }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="slot-card-actions">
              <button v-if="hasSignupDeadlinePassed(slot)" type="button" class="slot-button" disabled>
                Tilmeldingsfristen er udløbet
              </button>
              <a
                v-else-if="usesMemberService(slot)"
                class="slot-button primary"
                :href="slot.memberServiceUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="ti ti-external-link" aria-hidden="true"></i>
                Tilmeld i Medlemsservice
              </a>
              <button
                v-else
                type="button"
                class="slot-button"
                :class="{ primary: slotRemaining(slot) > 0 || slot.capacity === 0, waitlist: slotRemaining(slot) === 0 && slot.capacity !== 0 }"
                @click="openSignup(slot, slotRemaining(slot) === 0 && slot.capacity !== 0)"
              >
                <i class="ti" :class="slotActionIcon(slot)" aria-hidden="true"></i>
                {{ slotActionLabel(slot) }}
              </button>
            </div>
            </template>
          </article>
          <article v-else class="slot-card slot-card--grouped" :class="{ 'slot-card--task': group.slots[0].componentType === 'task', 'slot-card--shift': group.slots[0].componentType === 'shift' }">
            <div class="slot-card-head">
              <div>
                <span class="component-type-chip" :class="`component-type-chip--${group.slots[0].componentType}`">{{ componentLabel(group.slots[0]) }}</span>
                <div class="slot-card-title">{{ groupTitle(group) }}</div>
                <div class="slot-card-sub">{{ groupMeta(group) }}</div>
              </div>
              <span class="slot-card-chip">{{ group.slots.length }} perioder</span>
            </div>

            <div class="shift-period-list">
              <section v-for="slot in group.slots" :key="slot.id" class="shift-period">
                <div class="shift-period-head">
                  <span class="shift-period-time"><i class="ti" :class="slot.componentType === 'shift' ? 'ti-clock' : 'ti-list-check'" aria-hidden="true"></i>{{ groupSlotLabel(slot) }}</span>
                  <span class="slot-card-chip" :class="{ full: slotRemaining(slot) === 0 && slot.capacity !== 0 }">{{ slotCapacityLabel(slot) }}</span>
                </div>
                <div class="slot-card-details">
                  <span v-if="slot.requiresAdult || slot.minAge" class="detail-pill"><i class="ti ti-id" aria-hidden="true"></i>{{ slot.minAge || 18 }}+</span>
                  <span v-if="slot.kind === 'paid' && slot.price" class="detail-pill"><i class="ti ti-credit-card" aria-hidden="true"></i>{{ slot.price }} kr</span>
                  <span v-if="slot.groupMax > 1" class="detail-pill"><i class="ti ti-users" aria-hidden="true"></i>{{ slot.groupMin === slot.groupMax ? `${slot.groupMax} personer` : `${slot.groupMin}-${slot.groupMax} personer` }}</span>
                </div>
                <div class="signup-list">
                  <div v-if="slotSignups(slot.id).length === 0" class="signup-empty">Ingen tilmeldte endnu</div>
                  <div v-for="signup in slotSignups(slot.id)" :key="signup.id" class="signup-row" :class="{ waitlist: signup.waitlist }">
                    <span class="signup-av">{{ initials(signup.name) }}</span>
                    <div class="signup-main">
                      <div class="signup-name">{{ signup.name }}<span v-if="signup.groupSize > 1" class="group-badge">× {{ signup.groupSize }}</span></div>
                      <div class="signup-sub">{{ signup.waitlist ? 'Venteliste' : 'Bekræftet' }}<span v-if="signup.adult"> · 18+</span><span v-if="signup.audienceGroupLabel"> · {{ signup.audienceGroupLabel }}</span></div>
                    </div>
                  </div>
                </div>
                <div class="slot-card-actions">
                  <button type="button" class="slot-button" :class="{ primary: slotRemaining(slot) > 0 || slot.capacity === 0, waitlist: slotRemaining(slot) === 0 && slot.capacity !== 0 }" @click="openSignup(slot, slotRemaining(slot) === 0 && slot.capacity !== 0)">
                    <i class="ti" :class="slotActionIcon(slot)" aria-hidden="true"></i>{{ slotActionLabel(slot) }}
                  </button>
                </div>
              </section>
            </div>
          </article>
          </template>
        </div>
        <nav v-if="hasLocalSignupFlow(selectedEvent)" class="event-signup-management" aria-label="Administrer tilmeldinger">
          <RouterLink class="manage-signup-link" :to="{ path: '/mine', query: { event: selectedEvent.id } }">
            Har du allerede tilmeldt dig? Se eller afmeld din tilmelding
          </RouterLink>
        </nav>
      </div>
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-state-title">Ingen {{ sectionMeta.title.toLowerCase() }} lige nu</div>
        <div class="empty-state-copy">Der er ikke oprettet noget endnu. Kig forbi igen senere.</div>
      </div>
    </template>

    <template #modal>
      <PublicSignupModal
        :open="modalOpen"
        :title="selectedEvent?.title || ''"
        :subtitle="modalSlot ? `${modalSlot.label}${modalSlot?.sublabel ? ` · ${modalSlot.sublabel}` : ''}` : ''"
        :banner-text="waitlistMode ? 'Denne plads er fuld. Tilmeld dig ventelisten.' : ''"
        banner-icon="ti ti-clock"
        banner-class="warning"
        submit-label="Bekræft tilmelding"
        submitting-label="Tilmelder…"
        :submitting="submitting"
        :general-error="errors.general"
        @close="closeModal"
        @submit="submit"
      >
        <label class="field" :class="{ error: errors.name }">
          <span class="field-label">Navn</span>
          <input v-model="form.name" class="field-input" type="text" autocomplete="name" placeholder="Fulde navn" />
          <span v-if="errors.name" class="field-error" role="alert">{{ errors.name }}</span>
        </label>

        <label v-if="showChildToggle" class="check-row">
          <input v-model="form.childMode" type="checkbox" @change="syncChildMode" />
          <span>Tilmeld et barn</span>
        </label>

        <label v-if="!form.childMode" class="field" :class="{ error: errors.email }">
          <span class="field-label">Mail</span>
          <input v-model="form.email" class="field-input" type="email" autocomplete="email" placeholder="din@mail.dk" />
          <span v-if="errors.email" class="field-error" role="alert">{{ errors.email }}</span>
        </label>

        <label v-if="eligibleGroups.length" class="field" :class="{ error: errors.audienceGroup }">
          <span class="field-label">Klan eller hold</span>
          <select v-model="form.audienceGroupId" class="field-input">
            <option value="">Vælg klan eller hold</option>
            <option v-for="group in eligibleGroups" :key="group.id" :value="group.id">{{ group.label }}</option>
          </select>
          <span v-if="errors.audienceGroup" class="field-error" role="alert">{{ errors.audienceGroup }}</span>
        </label>

        <label v-if="showAdultToggle" class="check-row">
          <input v-model="form.adult" type="checkbox" />
          <span>{{ adultLabel }}</span>
        </label>

        <label v-if="showGroupSize" class="field" :class="{ error: errors.groupSize }">
          <span class="field-label">Antal deltagere</span>
          <input
            v-model.number="form.groupSize"
            class="field-input"
            type="number"
            :min="groupMin"
            :max="groupMax"
            step="1"
            inputmode="numeric"
          />
          <span v-if="errors.groupSize" class="field-error" role="alert">{{ errors.groupSize }}</span>
        </label>

        <div v-if="modalSlot?.kind === 'paid' && modalSlot.price" class="price-banner">
          <i class="ti ti-credit-card" aria-hidden="true"></i>
          Pris: {{ modalSlot.price }} kr. Du bliver sendt til betaling efter tilmelding.
        </div>
      </PublicSignupModal>
    </template>

    <template #toast>
      <div class="toast" :class="{ show: toastVisible }">{{ toastText }}</div>
    </template>
  </PublicLandingPageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';

import PublicLandingPageShell from '@/components/public/PublicLandingPageShell.vue';
import PublicSignupModal from '@/components/public/PublicSignupModal.vue';
import { isValidIsoDate } from '@/features/eventAdmin/eventScheduling';
import { fetchAllAdminEvents, formatSlotDate } from '@/features/eventAdmin/eventAdmin.data';
import EventLeaders from '@/components/public/EventLeaders.vue';
import { calculateSlotDeadline } from '@/features/eventAdmin/eventScheduling';
import type { AdminEvent, EventSlot, EventType, SignupAudienceGroup } from '@/features/eventAdmin/eventAdmin.types';
import { getAppFirestore } from '@/lib/firebase';
import { buildMapsEmbedUrl, buildMapsUrl } from '@/lib/maps';
import HeroMeta from './HeroMeta.vue';
import { submitSignupRequest } from '@/lib/signupApi';

type LandingSection = EventType;

type SignupRow = {
  audienceGroupLabel: string;
  adult: boolean;
  groupSize: number;
  id: string;
  name: string;
  waitlist: boolean;
};

type SlotGroup = {
  id: string;
  slots: EventSlot[];
};

type PublicEvent = {
  responsibleLeaders: AdminEvent['responsibleLeaders'];
  active: boolean;
  dateText: string;
  eventDate?: string;
  description: string;
  id: string;
  imageUrl: string;
  location: string;
  slots: EventSlot[];
  title: string;
  type: LandingSection;
  createdAt?: number;
  updatedAt?: number;
};

const props = defineProps<{ section: LandingSection }>();

const route = useRoute();
const router = useRouter();

const SECTION_META: Record<LandingSection, { badge: string; title: string; description: string; cta: string }> = {
  event: {
    badge: 'Events',
    title: 'Events',
    description: 'Vælg et arrangement og tilmeld dig direkte på den plads, der passer dig.',
    cta: 'Spring til tilmelding',
  },
  task: {
    badge: 'Opgaver',
    title: 'Opgaver',
    description: 'Find en praktisk opgave, og meld dig på uden at lede rundt i admin.',
    cta: 'Spring til opgaver',
  },
  timed: {
    badge: 'Vagtplaner',
    title: 'Vagtplaner',
    description: 'Se vagterne, læs pladserne og skriv dig på den tid, du kan tage.',
    cta: 'Spring til vagter',
  },
};

const KIND_ICON: Record<EventSlot['kind'], string> = {
  volunteer: 'ti-heart-handshake',
  attend: 'ti-users',
  paid: 'ti-ticket',
};

const loading = ref(true);
const loadingSignups = ref(false);
const allEvents = ref<PublicEvent[]>([]);
const selectedEventId = ref('');
const selectedCalendarDate = ref('');
const signupMap = ref<Record<string, SignupRow[]>>({});
const signupSection = ref<HTMLElement | null>(null);
const shiftTabsViewport = ref<HTMLElement | null>(null);
const calendarTabsCanScrollPrev = ref(false);
const calendarTabsCanScrollNext = ref(false);

const modalOpen = ref(false);
const waitlistMode = ref(false);
const modalSlot = ref<EventSlot | null>(null);
const submitting = ref(false);
const toastVisible = ref(false);
const toastText = ref('Du er tilmeldt — tak for hjælpen!');
const adultLabel = ref('Jeg er 18+ år');
const eligibleGroups = computed<SignupAudienceGroup[]>(() => modalSlot.value?.eligibleGroups ?? []);

const form = reactive({
  name: '',
  email: '',
  audienceGroupId: '',
  childMode: false,
  adult: false,
  groupSize: 1,
});

const errors = reactive({
  name: '',
  email: '',
  audienceGroup: '',
  groupSize: '',
  general: '',
});

const sectionMeta = computed(() => SECTION_META[props.section]);

const filteredEvents = computed(() =>
  allEvents.value
    .filter(event => event.type === props.section && event.active)
    .sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0) || a.title.localeCompare(b.title, 'da')),
);

const selectedEvent = computed(() => filteredEvents.value.find(event => event.id === selectedEventId.value) ?? filteredEvents.value[0] ?? null);
const slotGroups = computed<SlotGroup[]>(() => {
  const groups = new Map<string, EventSlot[]>();
  for (const slot of selectedEvent.value?.slots ?? []) {
    const key = slot.componentType === 'shift'
      // A recurring shift template is materialized into concrete slots that
      // share a shiftGroupId. Include the concrete date in the public group
      // key so each occurrence gets its own day while periods on that day
      // remain grouped together.
      ? `${slot.shiftGroupId || slot.label.trim()}\u0000${slot.date || ''}`
      : slot.componentType === 'signup'
        ? `signup\u0000${slot.id}`
        : slot.taskGroupId || `task\u0000${(slot.taskGroupTitle || slot.label).trim()}\u0000${slot.date}`;
    const group = groups.get(key) ?? [];
    group.push(slot);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([id, slots]) => ({ id, slots }));
});
const calendarGroups = computed(() => {
  const groups = new Map<string, SlotGroup>();
  for (const group of slotGroups.value) {
    const date = groupDateKey(group);
    const existing = groups.get(date);
    if (existing) existing.slots.push(...group.slots);
    else groups.set(date, { id: date, slots: [...group.slots] });
  }
  return [...groups.values()].sort((a, b) => {
    const dateA = a.slots[0]?.date || '';
    const dateB = b.slots[0]?.date || '';
    return dateA.localeCompare(dateB);
  });
});
const calendarMonthGroups = computed(() => {
  const groups = new Map<string, { id: string; label: string; days: SlotGroup[] }>();
  for (const day of calendarGroups.value) {
    const parsed = calendarDayDate(day);
    const id = parsed ? `${parsed.getFullYear()}-${parsed.getMonth() + 1}` : 'unknown';
    const label = parsed ? parsed.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' }) : 'Dato ikke angivet';
    const group = groups.get(id);
    if (group) group.days.push(day);
    else groups.set(id, { id, label, days: [day] });
  }
  return [...groups.values()];
});
const visibleSlotGroups = computed(() => {
  const selectedDate = selectedCalendarDate.value || calendarGroups.value[0]?.id;
  return slotGroups.value.filter(group => groupDateKey(group) === selectedDate);
});
const selectedEventAudienceLabels = computed(() => {
  const labels = new Set<string>();
  for (const slot of selectedEvent.value?.slots ?? []) {
    if (slot.componentType !== 'signup') continue;
    for (const group of slot.eligibleGroups) labels.add(group.label);
  }
  return [...labels];
});
const locationMapUrl = computed(() => buildMapsEmbedUrl(selectedEvent.value?.location));

const heroTitle = computed(() => selectedEvent.value?.title || sectionMeta.value.title);
const heroImage = computed(() => selectedEvent.value?.imageUrl || '/og-sankthans.webp');
const heroCopy = computed(() => selectedEvent.value?.description || sectionMeta.value.description);
const backHref = computed(() => {
  const tab = props.section === 'event' ? 'event' : props.section === 'timed' ? 'shift' : 'task';
  return router.resolve({ path: '/', query: { tab } }).href;
});

const showChildToggle = computed(() => modalSlot.value?.kind === 'volunteer');
const showAdultToggle = computed(() => !!modalSlot.value && (modalSlot.value.requiresAdult || modalSlot.value.minAge > 0));
const showGroupSize = computed(() => !!modalSlot.value && (modalSlot.value.groupMax > 1 || modalSlot.value.groupMin > 1));
const groupMin = computed(() => modalSlot.value?.groupMin || 1);
const groupMax = computed(() => modalSlot.value?.groupMax || modalSlot.value?.groupSize || 1);

watch(calendarGroups, groups => {
  if (groups.length && !groups.some(group => group.id === selectedCalendarDate.value)) {
    selectedCalendarDate.value = groups[0].id;
  }
}, { immediate: true });

watch(calendarMonthGroups, () => {
  void nextTick(updateCalendarTabsOverflow);
});

function normalizeLiveEvent(event: AdminEvent): PublicEvent {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    dateText: event.dateText,
    eventDate: event.eventDate,
    location: event.location,
    description: event.description,
    responsibleLeaders: event.responsibleLeaders,
    imageUrl: event.imageUrl || '/og-sankthans.webp',
    slots: event.slots,
    active: event.active,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

async function loadEvents() {
  loading.value = true;
  try {
    const live = (await fetchAllAdminEvents()).filter(event => isValidIsoDate(event.eventDate)).map(normalizeLiveEvent);
    allEvents.value = live.filter(event => event.type === props.section && event.active);
  } catch (error) {
    console.error('[signup-landing] failed to load live events', error);
    allEvents.value = [];
  } finally {
    loading.value = false;
  }
}

function selectEvent(eventId: string) {
  selectedEventId.value = eventId;
  const query = { ...route.query, event: eventId };
  router.replace({ query }).catch(() => undefined);
}

function initialSelection() {
  const eventId = typeof route.query.event === 'string' ? route.query.event : '';
  const next = filteredEvents.value.find(event => event.id === eventId) ?? filteredEvents.value[0];
  if (next && next.id !== selectedEventId.value) {
    selectedEventId.value = next.id;
  }
}

watch(filteredEvents, () => {
  initialSelection();
}, { immediate: true });

watch(selectedEventId, async nextId => {
  const next = filteredEvents.value.find(event => event.id === nextId);
  if (!next) return;
  const routeEvent = typeof route.query.event === 'string' ? route.query.event : '';
  if (routeEvent !== next.id) {
    router.replace({ query: { ...route.query, event: next.id } }).catch(() => undefined);
  }
  await loadSignups(next.id);
}, { immediate: true });

watch(() => route.query.event, nextEventId => {
  if (typeof nextEventId !== 'string' || !nextEventId) return;
  if (nextEventId !== selectedEventId.value && filteredEvents.value.some(event => event.id === nextEventId)) {
    selectedEventId.value = nextEventId;
  }
});

async function loadSignups(eventId: string) {
  const event = filteredEvents.value.find(candidate => candidate.id === eventId);
  if (event && !hasLocalSignupFlow(event)) {
    signupMap.value = {};
    loadingSignups.value = false;
    return;
  }
  loadingSignups.value = true;
  try {
    const db = await getAppFirestore();
    const snap = await getDocs(query(collection(db, 'signups'), where('eventId', '==', eventId)));
    const next: Record<string, SignupRow[]> = {};
    snap.forEach(docSnap => {
      const data = docSnap.data() as Partial<SignupRow> & { slotId?: unknown };
      const slotId = typeof data.slotId === 'string' ? data.slotId : '';
      if (!slotId) return;
      const row: SignupRow = {
        id: docSnap.id,
        name: String(data.name ?? ''),
        adult: !!data.adult,
        groupSize: Number.isFinite(Number(data.groupSize)) ? Number(data.groupSize) : 1,
        waitlist: !!data.waitlist,
        audienceGroupLabel: typeof data.audienceGroupLabel === 'string' ? data.audienceGroupLabel : '',
      };
      if (!next[slotId]) next[slotId] = [];
      next[slotId].push(row);
    });
    Object.values(next).forEach(rows => {
      rows.sort((a, b) => Number(a.waitlist) - Number(b.waitlist) || a.name.localeCompare(b.name, 'da'));
    });
    signupMap.value = next;
  } catch (error) {
    console.error('[signup-landing] failed to load signups', error);
    signupMap.value = {};
  } finally {
    loadingSignups.value = false;
  }
}

function slotSignups(slotId: string) {
  return signupMap.value[slotId] ?? [];
}

function slotConfirmedUnits(slot: EventSlot) {
  return slotSignups(slot.id)
    .filter(signup => !signup.waitlist)
    .reduce((sum, signup) => sum + (signup.groupSize || 1), 0);
}

function slotRemaining(slot: EventSlot) {
  if (slot.capacity === 0) return Infinity;
  return Math.max(0, slot.capacity - slotConfirmedUnits(slot));
}

function slotCapacityLabel(slot: EventSlot) {
  if (slot.capacity === 0) return '∞';
  const remaining = slotRemaining(slot);
  return remaining === 0 ? 'Fuldt' : `${remaining} ledig${remaining === 1 ? '' : 'e'}`;
}

function usesMemberService(slot: EventSlot) {
  return slot.componentType === 'signup' && slot.kind === 'paid' && slot.registrationMode === 'memberService';
}

function hasLocalSignupFlow(event: PublicEvent | null) {
  return !!event?.slots.some(slot => !usesMemberService(slot));
}

function slotMeta(slot: EventSlot) {
  const deadline = signupDeadline(slot);
  const parts = [formatSlotDate(slot.date), slot.componentType === 'task' ? slot.role : '', slot.sublabel, deadline ? `Tilmeld senest ${formatSlotDate(deadline)}` : ''].filter(Boolean);
  return parts.join(' · ') || 'Plads';
}

function signupDeadline(slot: EventSlot) {
  if (slot.componentType !== 'signup') return '';
  return calculateSlotDeadline(selectedEvent.value?.eventDate, slot) || '';
}

function hasSignupDeadlinePassed(slot: EventSlot) {
  const deadline = signupDeadline(slot);
  if (!deadline) return false;
  const today = new Date();
  const localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  return localToday > deadline;
}

function groupMeta(group: SlotGroup) {
  const first = group.slots[0];
  const date = formatSlotDate(first.date) || selectedEvent.value?.dateText || '';
  return [date, first.role].filter(Boolean).join(' · ') || 'Dato ikke angivet';
}

function calendarDayDate(day: SlotGroup) {
  const date = day.slots[0]?.date || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calendarDayWeekday(day: SlotGroup) {
  const parsed = calendarDayDate(day);
  if (!parsed) return '—';
  return parsed.toLocaleDateString('da-DK', { weekday: 'short' }).replace('.', '');
}

function calendarDayNumber(day: SlotGroup) {
  const parsed = calendarDayDate(day);
  return parsed ? String(parsed.getDate()) : '—';
}

function calendarDayMonth(day: SlotGroup) {
  const parsed = calendarDayDate(day);
  if (!parsed) return 'Dato ikke angivet';
  return parsed.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
}

function calendarDayKind(day: SlotGroup) {
  const kinds = new Set(day.slots.map(slot => slot.componentType));
  return [
    kinds.has('task') ? 'Opgaver' : '',
    kinds.has('signup') ? 'Tilmelding' : '',
    kinds.has('shift') ? 'Vagter' : '',
  ].filter(Boolean).join(' + ');
}

function scrollCalendarTabs(direction: number) {
  shiftTabsViewport.value?.scrollBy({ left: direction * Math.max(280, shiftTabsViewport.value.clientWidth * 0.82), behavior: 'smooth' });
}

function updateCalendarTabsOverflow() {
  const viewport = shiftTabsViewport.value;
  if (!viewport) {
    calendarTabsCanScrollPrev.value = false;
    calendarTabsCanScrollNext.value = false;
    return;
  }
  calendarTabsCanScrollPrev.value = viewport.scrollLeft > 1;
  calendarTabsCanScrollNext.value = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1;
}

function calendarDayHasTask(day: SlotGroup) {
  return day.slots.some(slot => slot.componentType === 'task');
}

function calendarDayHasSignup(day: SlotGroup) {
  return day.slots.some(slot => slot.componentType === 'signup');
}

function calendarDayHasShift(day: SlotGroup) {
  return day.slots.some(slot => slot.componentType === 'shift');
}

function calendarDayLabel(day: SlotGroup) {
  const parsed = calendarDayDate(day);
  return parsed ? parsed.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Dato ikke angivet';
}

function groupTitle(group: SlotGroup) {
  const first = group.slots[0];
  return first.componentType === 'task' ? first.taskGroupTitle || first.label : first.label;
}

function groupSlotLabel(slot: EventSlot) {
  return slot.componentType === 'shift' ? slot.sublabel || 'Tidspunkt mangler' : slot.label || 'Opgave uden navn';
}

function groupDateKey(group: SlotGroup) {
  return group.slots[0]?.date || '__arrangement-date__';
}

function shiftGroupIsFull(group: SlotGroup) {
  return group.slots.every(slot => slot.capacity !== 0 && slotRemaining(slot) === 0);
}

function calendarDayIsFull(day: SlotGroup) {
  const capacitySlots = day.slots.filter(slot => slot.capacity !== 0);
  return capacitySlots.length > 0 && capacitySlots.every(slot => slotRemaining(slot) === 0);
}

function componentLabel(slot: EventSlot) {
  if (slot.componentType === 'shift') return 'Vagt';
  if (slot.componentType === 'signup') return 'Tilmelding';
  return 'Opgave';
}

function slotActionLabel(slot: EventSlot) {
  if (hasSignupDeadlinePassed(slot)) return 'Tilmeldingsfristen er udløbet';
  const remaining = slotRemaining(slot);
  if (remaining === 0 && slot.capacity !== 0) return 'Skriv på venteliste';
  if (slot.kind === 'paid' && slot.price) return `Tilmeld og betal ${slot.price} kr`;
  if (slot.kind === 'attend') return 'Tilmeld dig';
  return 'Meld dig på';
}

function slotActionIcon(slot: EventSlot) {
  return slotRemaining(slot) === 0 && slot.capacity !== 0 ? 'ti-clock' : KIND_ICON[slot.kind];
}

function initials(name: string) {
  const chars = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return chars || 'HH';
}

function resetErrors() {
  errors.name = '';
  errors.email = '';
  errors.audienceGroup = '';
  errors.groupSize = '';
  errors.general = '';
}

function openSignup(slot: EventSlot, waitlistPreferred = false) {
  if (hasSignupDeadlinePassed(slot)) return;
  modalSlot.value = slot;
  waitlistMode.value = waitlistPreferred;
  modalOpen.value = true;
  submitting.value = false;
  resetErrors();
  form.childMode = false;
  form.adult = false;
  form.groupSize = slot.groupSize || slot.groupMax || 1;
  form.audienceGroupId = slot.eligibleGroups.length === 1 ? slot.eligibleGroups[0].id : '';
  form.name = '';
  form.email = '';
  adultLabel.value = `Jeg er ${slot.minAge || 18}+ år`;
}

function closeModal() {
  modalOpen.value = false;
  modalSlot.value = null;
  waitlistMode.value = false;
  resetErrors();
}

function syncChildMode() {
  if (form.childMode) {
    form.email = '';
    form.adult = false;
  }
}

function validateForm() {
  resetErrors();
  if (!form.name.trim()) {
    errors.name = 'Udfyld navn.';
  }
  if (!form.childMode && !form.email.trim()) {
    errors.email = 'Udfyld mail.';
  } else if (!form.childMode && !form.email.includes('@')) {
    errors.email = 'Mailadressen ser ikke rigtig ud.';
  }
  if (eligibleGroups.value.length && !eligibleGroups.value.some(group => group.id === form.audienceGroupId)) {
    errors.audienceGroup = 'Vælg den klan eller det hold, du tilmelder.';
  }
  if (showGroupSize.value) {
    const value = Number(form.groupSize);
    if (!Number.isInteger(value) || value < groupMin.value || value > groupMax.value) {
      errors.groupSize = `Vælg et tal mellem ${groupMin.value} og ${groupMax.value}.`;
    }
  }
  if (showAdultToggle.value && !form.childMode && !form.adult) {
    errors.general = `Markér at du er ${modalSlot.value?.minAge || 18}+ år.`;
  }
  return !errors.name && !errors.email && !errors.groupSize && !errors.general;
}

async function submit() {
  const event = selectedEvent.value;
  const slot = modalSlot.value;
  if (!event || !slot) return;
  if (!validateForm()) return;
  submitting.value = true;
  try {
    const response = await submitSignupRequest({
      eventId: event.id,
      slotId: slot.id,
      name: form.name.trim(),
      email: form.childMode ? '' : form.email.trim(),
      adult: form.childMode ? false : form.adult,
      childMode: form.childMode,
      groupSize: showGroupSize.value ? Number(form.groupSize) : 1,
      audienceGroupId: form.audienceGroupId,
      waitlistPreferred: waitlistMode.value,
    });

    await loadSignups(event.id);
    closeModal();

    const slotLabel = slotMeta(slot);
    toastText.value = response.waitlist
      ? `Sat på venteliste: ${slotLabel}`
      : slot.kind === 'paid'
        ? `Tilmeldt: ${slotLabel} — du bliver sendt til betaling`
        : `Tilmeldt: ${slotLabel} — tak for hjælpen!`;
    toastVisible.value = true;
    setTimeout(() => {
      toastVisible.value = false;
    }, 4500);

    if (!response.waitlist && slot.kind === 'paid' && slot.paymentUrl) {
      setTimeout(() => window.open(slot.paymentUrl, '_blank', 'noopener,noreferrer'), 250);
    }
  } catch (error: any) {
    console.error('[signup-landing] signup failed', error);
    errors.general = error?.message || 'Tilmeldingen kunne ikke sendes.';
  } finally {
    submitting.value = false;
  }
}

function scrollToSignup() {
  signupSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copyCurrentLink() {
  if (!selectedEvent.value) return;
  const url = new URL(window.location.href);
  url.searchParams.set('event', selectedEvent.value.id);
  const value = url.toString();
  try {
    await navigator.clipboard.writeText(value);
    toastText.value = 'Linket er kopieret';
    toastVisible.value = true;
    setTimeout(() => { toastVisible.value = false; }, 2200);
  } catch {
    window.prompt('Kopiér linket', value);
  }
}

function shareCurrentOnFacebook() {
  if (!selectedEvent.value) return;
  const url = new URL('https://www.facebook.com/sharer/sharer.php');
  url.searchParams.set('u', `${window.location.origin}${window.location.pathname}?event=${encodeURIComponent(selectedEvent.value.id)}`);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

onMounted(() => {
  void loadEvents();
  window.addEventListener('resize', updateCalendarTabsOverflow);
  void nextTick(updateCalendarTabsOverflow);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCalendarTabsOverflow);
});
</script>

<style scoped>
.signup-landing {
  min-height: 100vh;
  background: #f6f6f6;
  color: var(--text);
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
}

.meta-chip,
.section-chip,
.event-card-pill,
.slot-card-chip,
.detail-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
}

.hero-action,
.modal-button,
.slot-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 11px 14px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s var(--ease-out-quint),
    background 0.15s var(--ease-out-quint),
    border-color 0.15s var(--ease-out-quint),
    opacity 0.15s var(--ease-out-quint);
}

.hero-action:hover,
.slot-button:hover,
.modal-button:hover {
  transform: translateY(-1px);
}

.hero-action:active,
.slot-button:active {
  transform: translateY(0) scale(0.97);
}

.hero-action--primary,
.slot-button.primary,
.modal-button--primary {
  background: var(--navy);
  border-color: var(--navy);
  color: #fff;
}

.chip-link {
  text-decoration: none;
}

.page-section {
  background: #fff;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(9, 38, 68, 0.05);
}

.location-map-wrap {
  margin-bottom: 16px;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 18px;
  overflow: hidden;
  background: #f4f8fb;
}

.location-map {
  display: block;
  width: 100%;
  min-height: 260px;
  border: 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.section-head--compact {
  margin-bottom: 14px;
}

.section-title {
  margin: 0;
  color: var(--navy-dark);
  font-size: 1.3rem;
  font-weight: 800;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.event-card {
  display: grid;
  gap: 0;
  padding: 0;
  text-align: left;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 18px;
  overflow: clip;
  background: #fff;
  color: inherit;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.event-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
}

.event-card.active {
  border-color: var(--navy);
  box-shadow: 0 0 0 3px rgba(15, 65, 114, 0.12);
}

.event-card-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  display: block;
  background: var(--white);
}

.event-card-body {
  display: grid;
  gap: 10px;
  padding: 15px;
}

.event-card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.card-kicker,
.eyebrow {
  margin: 0 0 5px;
  color: var(--navy-mid);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.event-card-title {
  margin: 0;
  color: var(--navy-dark);
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.35;
}

.event-card-pill {
  background: rgba(15, 65, 114, 0.08);
  color: var(--navy);
  flex-shrink: 0;
}

.event-card-copy,
.lead {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.event-summary {
  display: grid;
  gap: 14px;
}

.event-card-meta,
.info-strip,
.slot-card-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.event-card-meta span,
.info-chip,
.detail-pill {
  background: #f4f8fb;
  color: var(--navy-dark);
}

.info-chip i,
.detail-pill i {
  font-size: 1rem;
}

.empty-state {
  padding: 22px;
  border: 1px dashed rgba(216, 225, 234, 0.95);
  border-radius: 18px;
  color: var(--muted);
  background: #fbfcfe;
  display: grid;
  gap: 4px;
}

.empty-state-title {
  color: var(--navy-dark);
  font-weight: 800;
}

.loading-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-weight: 700;
  padding: 12px 0 6px;
}

.slot-list {
  display: grid;
  gap: 14px;
}

.shift-tabs-carousel {
  position: relative;
  min-width: 0;
  max-width: 100%;
  margin: 0 0 14px;
  padding: 0;
}

.shift-tabs-viewport {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.shift-tabs-viewport::-webkit-scrollbar {
  display: none;
}

.shift-tabs {
  display: flex;
  gap: 18px;
  width: max-content;
  padding: 2px;
}

.shift-tabs-month-group {
  display: grid;
  gap: 8px;
  overflow: hidden;
}

.shift-tabs-month-label {
  margin: 0;
  color: var(--navy-dark);
  font-size: 1rem;
  font-weight: 800;
  text-transform: capitalize;
}

.shift-tabs-month-days {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 96px;
  justify-content: start;
  gap: 8px;
}

.shift-tabs-arrow {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #d8e1ea;
  border-radius: 50%;
  background: #fff;
  color: var(--navy);
  box-shadow: 0 4px 12px rgba(9, 38, 68, 0.12);
  cursor: pointer;
  transform: translateY(-50%);
}

.shift-tabs-arrow:hover {
  border-color: var(--navy-mid);
  background: #f4f8fb;
}

.shift-tabs-arrow--prev { left: 8px; }
.shift-tabs-arrow--next { right: 8px; }

.shift-tab {
  display: grid;
  width: 96px;
  min-width: 96px;
  min-height: 74px;
  padding: 5px 4px;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 14px;
  background: #fff;
  color: var(--navy-dark);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s var(--ease-out-quint), box-shadow 0.15s var(--ease-out-quint), transform 0.15s var(--ease-out-quint);
}

.shift-tab:hover {
  transform: translateY(-1px);
  border-color: var(--navy-mid);
}

.shift-tab.active {
  border-color: var(--navy);
  box-shadow: 0 0 0 3px rgba(15, 65, 114, 0.12);
}

.shift-tab.full {
  border-color: #d98686;
  background: #fff4f3;
  color: #9b3030;
}

.shift-tab.full .shift-tab-calendar {
  background: #f8dedd;
  color: #9b3030;
}

.shift-tab.full.active {
  border-color: #a94040;
  box-shadow: 0 0 0 3px rgba(169, 64, 64, 0.16);
}

.shift-tab.task {
  border-color: #e4c86a;
  background: #fffbea;
  color: #765600;
}

.shift-tab.task .shift-tab-calendar {
  background: #fff1b8;
  color: #765600;
}

.shift-tab.task.active {
  border-color: #c79d25;
  box-shadow: 0 0 0 3px rgba(199, 157, 37, 0.18);
}

.shift-tab.signup {
  border-color: var(--teal);
  color: var(--navy);
}

.shift-tab.signup .shift-tab-calendar {
  background: var(--teal-light);
}

.shift-tab.signup.active {
  border-color: var(--teal-deep);
  box-shadow: 0 0 0 3px rgba(20, 110, 136, 0.16);
}

.shift-tab:focus-visible {
  outline: 3px solid rgba(15, 65, 114, 0.35);
  outline-offset: 2px;
}

.shift-tab-name {
  font-weight: 800;
}

.shift-tab-calendar {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 2px;
  min-width: 0;
  padding: 3px 4px;
  background: #f4f8fb;
  border-radius: 10px;
  color: var(--navy);
  line-height: 1;
}

.shift-tab-calendar i {
  margin-bottom: 5px;
  font-size: 1rem;
}

.shift-tab-weekday {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.shift-tab-day {
  margin-top: 2px;
  font-size: 1.2rem;
}

.slot-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 18px;
  background: #fff;
  animation: slot-in 280ms var(--ease-out-quint) backwards;
}

.slot-card--grouped {
  gap: 16px;
}

.slot-card--task {
  border-color: #e4c86a;
  background: #fffdf2;
}

.slot-card--task .component-type-chip {
  background: #fff1b8;
  color: #765600;
}

.slot-card--shift {
  border-color: #b8d0e8;
  background: #f4f9ff;
}

.slot-card--shift .component-type-chip {
  background: #dcecff;
  color: #174d7d;
}

.shift-period-list {
  display: grid;
  gap: 0;
  border-top: 1px solid rgba(216, 225, 234, 0.95);
}

.shift-period {
  display: grid;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(216, 225, 234, 0.95);
}

.shift-period:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.shift-period-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.shift-period-time {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--navy-dark);
  font-size: 1rem;
  font-weight: 800;
}

.slot-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.slot-card-title {
  color: var(--navy-dark);
  font-size: 1rem;
  font-weight: 800;
}

.component-type-chip {
  display: inline-flex;
  margin-bottom: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.component-type-chip--task {
  background: var(--gold-light);
  color: var(--navy);
}

.component-type-chip--shift {
  background: #dcecff;
  color: #174d7d;
}

.slot-card-sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.92rem;
}

.event-audience-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.event-audience-label {
  color: #fff;
  font-weight: 700;
}

.event-audience-chip {
  padding: 6px 11px;
  border-radius: 999px;
  background: #bcebf0;
  color: #064b5a;
  font-size: 0.9rem;
  font-weight: 800;
}

.slot-card-chip {
  background: var(--navy-soft);
  color: var(--navy);
  flex-shrink: 0;
}

.slot-card-chip.full {
  background: #f0f0f0;
  color: var(--muted);
}

.signup-list {
  display: grid;
  gap: 8px;
}

.signup-empty {
  padding: 12px 14px;
  border: 1px dashed rgba(216, 225, 234, 0.95);
  border-radius: 14px;
  color: var(--muted);
  background: #fbfcfe;
}

.signup-row {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  animation: row-in 260ms var(--ease-out-quint) backwards;
}

.signup-row.waitlist {
  background: #fff;
  border-style: dashed;
}

.signup-av {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--teal-deep);
  color: #fff;
  display: inline-grid;
  place-items: center;
  font-size: 0.88rem;
  font-weight: 800;
}

.signup-main {
  min-width: 0;
}

.signup-name {
  font-weight: 800;
  color: var(--navy-dark);
  line-height: 1.35;
}

.signup-sub {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.9rem;
}

.group-badge {
  margin-left: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(15, 65, 114, 0.08);
  color: var(--navy);
  font-size: 0.78rem;
  font-weight: 800;
}

.slot-card-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.manage-signup-link {
  align-self: flex-start;
  color: var(--navy);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.event-signup-management {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.slot-button {
  border-color: var(--navy);
  background: var(--navy);
}

.slot-button.waitlist {
  background: #fff;
  color: var(--navy);
  border-style: dashed;
}

.slot-button:disabled,
.modal-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 34, 71, 0.72);
  display: grid;
  place-items: center;
  padding: 18px;
}

.modal {
  width: min(480px, 100%);
  max-height: calc(100vh - 36px);
  overflow: auto;
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(216, 225, 234, 0.95);
  padding: 18px;
  display: grid;
  gap: 14px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-title {
  color: var(--navy-dark);
  font-size: 1.05rem;
  font-weight: 800;
}

.modal-sub {
  margin-top: 4px;
  color: var(--muted);
  line-height: 1.5;
}

.icon-button {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #fff;
  color: var(--navy);
  cursor: pointer;
}

.waitlist-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--text);
}

.signup-form {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.field-label {
  color: var(--navy-dark);
  font-size: 0.88rem;
  font-weight: 800;
}

.field-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  color: var(--text);
  font: inherit;
}

.field.error .field-input {
  border-color: #c94853;
}

.field-error,
.general-error {
  color: #c94853;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.45;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  color: var(--text);
  font-weight: 700;
}

.check-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--navy);
}

.price-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--warn-bg, #fff8ec);
  border: 1px solid var(--warn-border, #f5d080);
  color: var(--text);
}

.modal-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.modal-button {
  flex: 1;
  border-color: var(--border);
  color: var(--navy);
  background: #fff;
}

.modal-button--primary {
  flex: 1.2;
  background: var(--navy);
  color: #fff;
  border-color: var(--navy);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(120%);
  background: var(--navy);
  color: #fff;
  padding: 12px 18px;
  border-radius: 999px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.28s var(--ease-out-quint);
  z-index: 60;
}

.toast.show {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

/* Arrival motion. The new signup row animates in on mount (peak-end feedback);
   slot cards stagger on first load. Global prefers-reduced-motion disables both. */
@keyframes slot-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

.slot-card:nth-child(2) {
  animation-delay: 45ms;
}

.slot-card:nth-child(3) {
  animation-delay: 90ms;
}

.slot-card:nth-child(n + 4) {
  animation-delay: 135ms;
}

@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (max-width: 640px) {
  :deep(.page-content),
  :deep(.page-section) {
    min-width: 0;
    max-width: 100%;
    overflow-x: hidden;
  }

  .shift-tabs-carousel {
    margin-right: 0;
    margin-left: 0;
    padding-right: 0;
    padding-left: 0;
  }

  .shift-tabs-month-group {
    max-width: 100%;
  }

  .shift-tabs-month-days {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .shift-tabs-month-days::-webkit-scrollbar {
    display: none;
  }

  .shift-tabs-arrow {
    width: 30px;
    height: 30px;
  }

  .hero-actions,
  .modal-actions {
    flex-direction: column;
  }

  .hero-action,
  .modal-button,
  .slot-button {
    width: 100%;
  }

  .slot-card-head,
  .modal-head,
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
