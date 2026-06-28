<template>
  <div class="signup-landing">
    <section class="hero">
      <img v-if="heroImage" class="hero-image" :src="heroImage" :alt="heroTitle" />
      <div class="hero-scrim" aria-hidden="true" />

      <div class="hero-inner">
        <div class="hero-kicker">
          <span class="hero-badge">{{ sectionMeta.badge }}</span>
          <span class="hero-count">1 aktiv</span>
        </div>

        <h1 class="hero-title">{{ sectionMeta.title }}</h1>
        <p class="hero-copy">{{ sectionMeta.description }}</p>

        <div class="hero-actions">
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
        </div>

        <div class="hero-meta" v-if="selectedEvent">
          <span class="meta-chip">
            <i class="ti ti-calendar" aria-hidden="true"></i>
            {{ selectedEvent.dateText }}
          </span>
          <span class="meta-chip" v-if="selectedEvent.location">
            <i class="ti ti-map-pin" aria-hidden="true"></i>
            {{ selectedEvent.location }}
          </span>
          <span class="meta-chip">
            <i class="ti ti-list" aria-hidden="true"></i>
            {{ selectedEvent.slots.length }} pladser
          </span>
        </div>
      </div>
    </section>

    <main class="page-shell">
      <section class="page-section">
        <div v-if="loading" class="loading-row">
          <i class="ti ti-loader spinning" aria-hidden="true"></i>
          Henter tilmeldinger…
        </div>

        <div v-else-if="selectedEvent" class="event-summary">
          <p v-if="selectedEvent.description" class="lead event-lead">{{ selectedEvent.description }}</p>
          <div class="info-strip">
            <span class="info-chip" v-if="selectedEvent.location">
              <i class="ti ti-map-pin" aria-hidden="true"></i>
              {{ selectedEvent.location }}
            </span>
            <span class="info-chip">
              <i class="ti ti-list" aria-hidden="true"></i>
              {{ selectedEvent.slots.length }} slots
            </span>
            <span class="info-chip" v-if="selectedEvent.paymentUrl">
              <i class="ti ti-credit-card" aria-hidden="true"></i>
              Betaling via MobilePay
            </span>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-title">Ingen aktiv tilmelding</div>
          <div class="empty-state-copy">Der ligger ikke et opslag til denne landing-side endnu.</div>
        </div>
      </section>

      <section v-if="selectedEvent" ref="signupSection" class="page-section">
        <div class="section-head section-head--compact">
          <div>
            <p class="eyebrow">Tilmelding</p>
            <h2 class="section-title">{{ selectedEvent.title }}</h2>
          </div>
          <div class="section-chip" v-if="selectedEvent.dateText">{{ selectedEvent.dateText }}</div>
        </div>

        <div class="info-strip">
          <span class="info-chip" v-if="selectedEvent.location">
            <i class="ti ti-map-pin" aria-hidden="true"></i>
            {{ selectedEvent.location }}
          </span>
          <span class="info-chip">
            <i class="ti ti-list" aria-hidden="true"></i>
            {{ selectedEvent.slots.length }} slots
          </span>
          <span class="info-chip" v-if="selectedEvent.paymentUrl">
            <i class="ti ti-credit-card" aria-hidden="true"></i>
            Betaling via MobilePay
          </span>
        </div>

        <p v-if="selectedEvent.description" class="lead event-lead">{{ selectedEvent.description }}</p>

        <div v-if="loadingSignups" class="loading-row">
          <i class="ti ti-loader spinning" aria-hidden="true"></i>
          Henter tilmeldinger…
        </div>

        <div v-if="!selectedEvent.slots.length" class="empty-state">
          <div class="empty-state-title">Ingen pladser endnu</div>
          <div class="empty-state-copy">Der ligger stadig ikke nogen tilmeldingspladser på dette opslag.</div>
        </div>

        <div v-else class="slot-list">
          <article v-for="slot in selectedEvent.slots" :key="slot.id" class="slot-card">
            <div class="slot-card-head">
              <div>
                <div class="slot-card-title">{{ slot.label }}</div>
                <div class="slot-card-sub">{{ slotMeta(slot) }}</div>
              </div>
              <span class="slot-card-chip" :class="{ full: slotRemaining(slot) === 0 && slot.capacity !== 0 }">
                {{ slotCapacityLabel(slot) }}
              </span>
            </div>

            <div class="slot-card-details">
              <span v-if="slot.requiresAdult || slot.minAge" class="detail-pill">
                <i class="ti ti-id" aria-hidden="true"></i>
                {{ slot.minAge || 18 }}+
              </span>
              <span v-if="slot.kind === 'paid' && slot.price" class="detail-pill">
                <i class="ti ti-credit-card" aria-hidden="true"></i>
                {{ slot.price }} kr
              </span>
              <span v-if="slot.groupMax > 1" class="detail-pill">
                <i class="ti ti-users" aria-hidden="true"></i>
                {{ slot.groupMin === slot.groupMax ? `${slot.groupMax} personer` : `${slot.groupMin}-${slot.groupMax} personer` }}
              </span>
            </div>

            <div class="signup-list">
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
                  </div>
                </div>
              </div>
            </div>

            <div class="slot-card-actions">
              <button
                type="button"
                class="slot-button"
                :class="{ primary: slotRemaining(slot) > 0 || slot.capacity === 0, waitlist: slotRemaining(slot) === 0 && slot.capacity !== 0 }"
                @click="openSignup(slot, slotRemaining(slot) === 0 && slot.capacity !== 0)"
              >
                <i class="ti" :class="slotActionIcon(slot)" aria-hidden="true"></i>
                {{ slotActionLabel(slot) }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <div>
            <div class="modal-title">{{ selectedEvent?.title }}</div>
            <div class="modal-sub">{{ modalSlot ? modalSlot.label : '' }}<span v-if="modalSlot?.sublabel"> · {{ modalSlot.sublabel }}</span></div>
          </div>
          <button type="button" class="icon-button" @click="closeModal">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <div v-if="waitlistMode" class="waitlist-banner">
          <i class="ti ti-clock" aria-hidden="true"></i>
          Denne plads er fuld. Tilmeld dig ventelisten.
        </div>

        <form class="signup-form" @submit.prevent="submit">
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

          <p v-if="errors.general" class="general-error" role="alert">{{ errors.general }}</p>

          <div class="modal-actions">
            <button type="button" class="modal-button" @click="closeModal">Annullér</button>
            <button type="submit" class="modal-button modal-button--primary" :disabled="submitting">
              {{ submitting ? 'Tilmelder…' : confirmLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast" :class="{ show: toastVisible }">{{ toastText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { eventItems } from '@/features/events/events.data';
import type { EventItem } from '@/features/events/events.types';
import { fetchAllAdminEvents } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent, EventSlot, EventType } from '@/features/eventAdmin/eventAdmin.types';
import { getAppFirestore } from '@/lib/firebase';
import { submitSignupRequest } from '@/lib/signupApi';

type LandingSection = EventType;

type SignupRow = {
  adult: boolean;
  groupSize: number;
  id: string;
  name: string;
  waitlist: boolean;
};

type PublicEvent = {
  active: boolean;
  dateText: string;
  description: string;
  id: string;
  imageUrl: string;
  location: string;
  paymentUrl: string;
  slots: EventSlot[];
  title: string;
  type: LandingSection;
  source: 'live' | 'fallback';
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
    cta: 'Se arrangementer',
  },
  task: {
    badge: 'Opgaver',
    title: 'Opgaver',
    description: 'Find en praktisk opgave, og meld dig på uden at lede rundt i admin.',
    cta: 'Se opgaver',
  },
  timed: {
    badge: 'Vagtplaner',
    title: 'Vagtplaner',
    description: 'Se vagterne, læs pladserne og skriv dig på den tid, du kan tage.',
    cta: 'Se vagter',
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
const signupMap = ref<Record<string, SignupRow[]>>({});
const signupSection = ref<HTMLElement | null>(null);

const modalOpen = ref(false);
const waitlistMode = ref(false);
const modalSlot = ref<EventSlot | null>(null);
const submitting = ref(false);
const toastVisible = ref(false);
const toastText = ref('Du er tilmeldt — tak for hjælpen!');
const adultLabel = ref('Jeg er 18+ år');

const form = reactive({
  name: '',
  email: '',
  childMode: false,
  adult: false,
  groupSize: 1,
});

const errors = reactive({
  name: '',
  email: '',
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

const heroTitle = computed(() => selectedEvent.value?.title || sectionMeta.value.title);
const heroImage = computed(() => selectedEvent.value?.imageUrl || fallbackImage(props.section));
const typeLabel = computed(() => sectionMeta.value.badge);
const backHref = computed(() => {
  const tab = props.section === 'event' ? 'event' : props.section === 'timed' ? 'shift' : 'task';
  return router.resolve({ path: '/', query: { tab } }).href;
});
const confirmLabel = computed(() => {
  if (!modalSlot.value) return 'Bekræft tilmelding';
  if (waitlistMode.value) return 'Bekræft venteliste';
  if (modalSlot.value.kind === 'paid' && modalSlot.value.price) return 'Gå til betaling';
  return 'Bekræft tilmelding';
});

const showChildToggle = computed(() => modalSlot.value?.kind === 'volunteer');
const showAdultToggle = computed(() => !!modalSlot.value && (modalSlot.value.requiresAdult || modalSlot.value.minAge > 0));
const showGroupSize = computed(() => !!modalSlot.value && (modalSlot.value.groupMax > 1 || modalSlot.value.groupMin > 1));
const groupMin = computed(() => modalSlot.value?.groupMin || 1);
const groupMax = computed(() => modalSlot.value?.groupMax || modalSlot.value?.groupSize || 1);

function fallbackImage(section: LandingSection) {
  const legacyType = section === 'timed' ? 'shift' : section;
  const fallback = eventItems.find(item => item.type === legacyType);
  return fallback?.image || '/og-sankthans.png';
}

function toLandingType(type: EventItem['type']): LandingSection {
  return type === 'shift' ? 'timed' : type;
}

function normalizeLiveEvent(event: AdminEvent): PublicEvent {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    dateText: event.dateText,
    location: event.location,
    description: event.description,
    paymentUrl: event.paymentUrl,
    imageUrl: event.imageUrl || '/og-sankthans.png',
    slots: event.slots,
    active: event.active,
    source: 'live',
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function fallbackEvent(section: LandingSection): PublicEvent | null {
  const item = eventItems.find(candidate => candidate.type === section);
  if (!item) return null;
  return {
    id: item.id,
    type: toLandingType(item.type),
    title: item.title,
    dateText: item.dateText,
    location: item.location,
    description: item.summary,
    paymentUrl: '',
    imageUrl: item.image,
    slots: [],
    active: true,
    source: 'fallback',
  };
}

async function loadEvents() {
  loading.value = true;
  try {
    const live = (await fetchAllAdminEvents()).map(normalizeLiveEvent);
    const filteredLive = live.filter(event => event.type === props.section && event.active);
    const fallback = fallbackEvent(props.section);
    allEvents.value = filteredLive.length ? filteredLive : fallback ? [fallback] : [];
  } catch (error) {
    console.error('[signup-landing] failed to load live events', error);
    const fallback = fallbackEvent(props.section);
    allEvents.value = fallback ? [fallback] : [];
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

function slotMeta(slot: EventSlot) {
  const parts = [slot.role, slot.sublabel].filter(Boolean);
  return parts.join(' · ') || 'Plads';
}

function slotActionLabel(slot: EventSlot) {
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
  errors.groupSize = '';
  errors.general = '';
}

function openSignup(slot: EventSlot, waitlistPreferred = false) {
  modalSlot.value = slot;
  waitlistMode.value = waitlistPreferred;
  modalOpen.value = true;
  submitting.value = false;
  resetErrors();
  form.childMode = false;
  form.adult = false;
  form.groupSize = slot.groupSize || slot.groupMax || 1;
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

    if (!response.waitlist && slot.kind === 'paid' && event.paymentUrl) {
      setTimeout(() => window.open(event.paymentUrl || '', '_blank', 'noopener,noreferrer'), 250);
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

onMounted(loadEvents);
</script>

<style scoped>
.signup-landing {
  min-height: 100vh;
  background: #f6f6f6;
  color: var(--text);
}

.hero {
  position: relative;
  min-height: 56vh;
  padding: 40px 20px 48px;
  display: grid;
  align-items: end;
  overflow: clip;
  background: var(--navy);
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  opacity: 0.58;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 34, 71, 0.16) 0%, rgba(0, 34, 71, 0.32) 42%, rgba(0, 34, 71, 0.88) 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: min(1100px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 16px;
  color: #fff;
}

.hero-kicker,
.hero-meta,
.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-badge,
.hero-count,
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

.hero-badge,
.hero-count {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
}

.hero-title {
  margin: 0;
  max-width: 760px;
  font-size: clamp(2.4rem, 5vw, 4.6rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.hero-copy {
  margin: 0;
  max-width: 720px;
  font-size: 1.02rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
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
  transition: transform 0.15s, background 0.15s, border-color 0.15s, opacity 0.15s;
}

.hero-action:hover,
.slot-button:hover,
.modal-button:hover {
  transform: translateY(-1px);
}

.hero-action--primary,
.slot-button.primary,
.modal-button--primary {
  background: var(--navy);
  border-color: var(--navy);
  color: #fff;
}

.page-shell {
  width: min(1100px, calc(100% - 32px));
  margin: -42px auto 48px;
  display: grid;
  gap: 18px;
}

.page-section {
  background: #fff;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(9, 38, 68, 0.05);
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

.slot-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 18px;
  background: #fff;
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

.slot-card-sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.92rem;
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
  justify-content: flex-end;
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
  transition: transform 0.25s ease;
  z-index: 60;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 840px) {
  .hero {
    min-height: 48vh;
  }

  .page-shell {
    width: min(100%, calc(100% - 20px));
    margin-top: -30px;
  }
}

@media (max-width: 640px) {
  .hero {
    min-height: 40vh;
    padding: 28px 16px 36px;
  }

  .hero-title {
    font-size: clamp(2rem, 12vw, 3.4rem);
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
