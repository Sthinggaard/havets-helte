<template>
  <PublicLandingPageShell
    content-width="70vw"
    :hero-image="heroImage"
    :hero-image-alt="heroTitle"
    hero-badge="Havets Helte"
    :hero-title="heroTitle"
    :hero-copy="heroCopy"
    hero-variant="event"
    section-eyebrow="Vagtplan"
    :section-title="selectedEvent?.title || heroTitle"
    :section-chip="selectedEvent?.dateText || ''"
    :section-lead="selectedEvent?.description || heroCopy"
  >
    <template #hero-meta>
      <div class="hero-date" v-if="selectedEvent">
        <i class="ti ti-calendar" aria-hidden="true"></i>
        {{ selectedEvent.dateText }}
      </div>
    </template>

    <template #hero-actions>
      <RouterLink v-if="props.adminMode && selectedEvent" class="hero-action hero-action--primary" :to="`/vagter/${encodeURIComponent(selectedEvent.id)}/rediger`">
        <i class="ti ti-edit" aria-hidden="true"></i>
        Rediger vagt
      </RouterLink>
      <RouterLink v-if="props.adminMode && selectedEvent" class="hero-action" :to="{ path: '/vagter', query: { event: selectedEvent.id } }">
        <i class="ti ti-arrow-left" aria-hidden="true"></i>
        Tilbage til eventet
      </RouterLink>
      <button type="button" class="hero-action hero-action--primary" @click="scrollToRoleTabs">
        <i class="ti ti-arrow-down" aria-hidden="true"></i>
        Se vagter
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

    <template #info>
      <a
        v-if="selectedEvent?.location"
        class="info-chip chip-link"
        :href="buildMapsUrl(selectedEvent.location)"
        target="_blank"
        rel="noreferrer noopener"
      >
        <i class="ti ti-map-pin" aria-hidden="true"></i>
        {{ selectedEvent.location }}
      </a>
      <span v-else class="info-chip">
        <i class="ti ti-map-pin" aria-hidden="true"></i>
        Havets Helte
      </span>
      <span class="info-chip">
        <i class="ti ti-clock" aria-hidden="true"></i>
        {{ shiftSummary || 'Vagter' }}
      </span>
    </template>

    <template #body>
      <section v-if="selectedEvent" ref="roleTabsSection" class="shift-body">
        <EventLeaders :leaders="selectedEvent.responsibleLeaders" />
        <div v-if="locationMapUrl" class="location-map-wrap">
          <iframe class="location-map" :src="locationMapUrl" loading="lazy" title="Kort over valgt sted"></iframe>
        </div>

        <div class="role-tabs" v-if="roleGroups.length">
          <button
            v-for="group in roleGroups"
            :key="group.label"
            type="button"
            class="role-tab"
            :class="{ active: group.label === selectedRoleLabel }"
            @click="selectRole(group.label)"
          >
            <div class="rt-icon"><i class="ti" :class="roleIcon(group)" aria-hidden="true"></i></div>
            <div class="rt-name">{{ group.label }}</div>
            <div class="rt-sub">{{ roleCapacityLabel(group) }}</div>
          </button>
        </div>

        <div v-if="activeRoleGroup" class="role-note">
          <i class="ti" :class="roleNoteIcon(activeRoleGroup)" aria-hidden="true"></i>
          {{ activeRoleGroup.note }}
        </div>

        <div v-if="loadingSignups" class="loading-row">
          <i class="ti ti-loader spinning" aria-hidden="true"></i>
          Henter tilmeldinger…
        </div>

        <div v-if="!activeRoleGroup" class="empty-state">
          <div class="empty-state-title">Ingen vagter endnu</div>
          <div class="empty-state-copy">Der ligger ikke nogen vagter på dette opslag endnu.</div>
        </div>

        <div v-else class="shift-list">
          <section v-for="slot in activeRoleGroup.slots" :key="slot.id" class="shift-section">
            <div class="shift-header">
              <div class="shift-time">
                <i class="ti ti-clock" aria-hidden="true"></i>
                {{ shiftTimeLabel(slot) }}
              </div>
              <span class="shift-cap" :class="{ 'cap-full': slotRemaining(slot) === 0, 'cap-open': slotRemaining(slot) > 0 }">
                {{ slotCapacityLabel(slot) }}
              </span>
            </div>

            <div class="signups-list">
              <div v-for="signup in slotSignups(slot.id)" :key="signup.id" class="signup-row filled">
                <div class="signup-av filled-av">{{ initials(signup.name) }}</div>
                <div class="signup-name">
                  {{ signup.name }}
                  <span v-if="signup.adult"> · 18+</span>
                  <small v-if="props.adminMode && signup.email">{{ signup.email }}</small>
                  <button v-if="props.adminMode" type="button" class="admin-cancel-btn" @click="adminCancel(signup)">Afmeld</button>
                </div>
              </div>

              <div v-for="index in emptyRows(slot)" :key="`${slot.id}-empty-${index}`" class="signup-row">
                <div class="signup-av">
                  <i class="ti ti-user" aria-hidden="true"></i>
                </div>
                <div class="signup-name">Ledig plads</div>
              </div>
            </div>

            <RouterLink v-if="!props.adminMode" class="manage-signup-link" :to="{ path: '/mine', query: { event: selectedEvent.id } }">
              Har du allerede tilmeldt dig? Se eller afmeld din tilmelding
            </RouterLink>

            <button v-if="!props.adminMode"
              type="button"
              class="join-btn"
              :disabled="slotRemaining(slot) === 0"
              @click="openSignup(slot)"
            >
              {{ slotRemaining(slot) === 0 ? 'Vagten er fyldt' : '+ Meld dig på denne vagt' }}
            </button>
          </section>
        </div>

        <div class="contact-footer">
          Spørgsmål? Skriv til Lærke på <a href="mailto:laerke@havetshelte.dk">laerke@havetshelte.dk</a><br />
          eller ring på <a href="tel:27891435">27 89 14 35</a>
        </div>
      </section>

      <section v-else class="empty-state">
        <div class="empty-state-title">Ingen aktiv vagtplan</div>
        <div class="empty-state-copy">Der ligger ikke et vagtopslag til denne side endnu.</div>
      </section>
    </template>

    <template #modal>
      <PublicSignupModal
        :open="modalOpen"
        :title="selectedEvent?.title || ''"
        :subtitle="modalSlot ? `${modalSlot.label}${modalSlot?.sublabel ? ` · ${modalSlot.sublabel}` : ''}` : ''"
        :banner-text="showAdultToggle ? 'Mindst én hjælper over 18 år pr. vagt i drinksboden.' : ''"
        banner-icon="ti ti-id"
        banner-class="info"
        submit-label="Tilmeld mig"
        submitting-label="Tilmelder…"
        :submitting="submitting"
        :general-error="errors.general"
        @close="closeModal"
        @submit="submit"
      >
        <label class="field" :class="{ error: errors.name }">
          <span class="field-label">Dit navn</span>
          <input v-model="form.name" class="field-input" type="text" autocomplete="name" placeholder="Fornavn Efternavn" />
          <span v-if="errors.name" class="field-error" role="alert">{{ errors.name }}</span>
        </label>

        <label class="field" :class="{ error: errors.email }">
          <span class="field-label">Din mail</span>
          <input v-model="form.email" class="field-input" type="email" autocomplete="email" placeholder="din@mail.dk" />
          <span v-if="errors.email" class="field-error" role="alert">{{ errors.email }}</span>
        </label>

        <label v-if="showAdultToggle" class="check-row">
          <input v-model="form.adult" type="checkbox" />
          <span>Jeg er over 18 år</span>
        </label>
      </PublicSignupModal>
    </template>

    <template #toast>
      <div class="toast" :class="{ show: toastVisible }">{{ toastText }}</div>
    </template>
  </PublicLandingPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';

import PublicLandingPageShell from '@/components/public/PublicLandingPageShell.vue';
import PublicSignupModal from '@/components/public/PublicSignupModal.vue';
import EventLeaders from '@/components/public/EventLeaders.vue';
import { fetchAllAdminEvents, formatSlotDate } from '@/features/eventAdmin/eventAdmin.data';
import type { AdminEvent, EventSlot, EventType } from '@/features/eventAdmin/eventAdmin.types';
import { getAppFirestore } from '@/lib/firebase';
import { buildMapsEmbedUrl, buildMapsUrl } from '@/lib/maps';
import { submitSignupRequest } from '@/lib/signupApi';

type LandingSection = EventType;

type SignupRow = {
  adult: boolean;
  groupSize: number;
  id: string;
  name: string;
  email?: string;
  waitlist: boolean;
};

type PublicEvent = {
  responsibleLeaders: AdminEvent['responsibleLeaders'];
  active: boolean;
  dateText: string;
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

type RoleGroup = {
  adultRequired: boolean;
  capacity: number;
  icon: string;
  label: string;
  note: string;
  slots: EventSlot[];
};

const route = useRoute();
const router = useRouter();
const props = defineProps<{ adminMode?: boolean }>();

const loading = ref(true);
const loadingSignups = ref(false);
const allEvents = ref<PublicEvent[]>([]);
const selectedEventId = ref('');
const selectedRoleLabel = ref('');
const signupMap = ref<Record<string, SignupRow[]>>({});
const roleTabsSection = ref<HTMLElement | null>(null);

const modalOpen = ref(false);
const modalSlot = ref<EventSlot | null>(null);
const submitting = ref(false);
const toastVisible = ref(false);
const toastText = ref('Du er tilmeldt — tak for hjælpen!');

const form = reactive({
  name: '',
  email: '',
  adult: false,
});

const errors = reactive({
  name: '',
  email: '',
  general: '',
});

const backHref = computed(() => router.resolve({ path: '/', query: { tab: 'shift' } }).href);

const selectedEvent = computed(() => timedEvents.value.find(event => event.id === selectedEventId.value) ?? timedEvents.value[0] ?? null);
const locationMapUrl = computed(() => buildMapsEmbedUrl(selectedEvent.value?.location));
const heroTitle = computed(() => selectedEvent.value?.title || 'Vagter');
const heroImage = computed(() => selectedEvent.value?.imageUrl || '/og-sankthans.webp');
const heroCopy = computed(() => selectedEvent.value?.description || 'Vælg den vagt, der passer dig, og meld dig på direkte i den faste vagtplan.');

const timedEvents = computed(() =>
  allEvents.value
    .filter(event => event.type === 'timed' && event.active)
    .sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0) || a.title.localeCompare(b.title, 'da')),
);

const roleGroups = computed<RoleGroup[]>(() => {
  const slots = selectedEvent.value?.slots ?? [];
  const groups = new Map<string, EventSlot[]>();
  slots.forEach(slot => {
    const key = slot.label.trim() || slot.role.trim() || slot.sublabel.trim() || slot.id;
    const current = groups.get(key) ?? [];
    current.push(slot);
    groups.set(key, current);
  });

  return [...groups.entries()].map(([label, groupSlots]) => {
    const adultRequired = groupSlots.some(slot => slot.requiresAdult || slot.minAge > 0);
    return {
      adultRequired,
      capacity: groupSlots[0]?.capacity ?? 0,
      icon: roleIconForLabel(label),
      label,
      note: roleNoteForLabel(label, adultRequired),
      slots: groupSlots,
    };
  });
});

const activeRoleGroup = computed(() => roleGroups.value.find(group => group.label === selectedRoleLabel.value) ?? roleGroups.value[0] ?? null);
const showAdultToggle = computed(() => !!modalSlot.value && (modalSlot.value.requiresAdult || modalSlot.value.minAge > 0 || activeRoleGroup.value?.adultRequired));
const shiftSummary = computed(() => {
  if (!selectedEvent.value) return '';
  const times = selectedEvent.value.slots.map(slot => slot.sublabel).filter(Boolean);
  return times.length ? times.join(' · ') : selectedEvent.value.dateText;
});

function normalizeLiveEvent(event: AdminEvent): PublicEvent {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    dateText: event.dateText,
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
    const live = (await fetchAllAdminEvents()).map(normalizeLiveEvent);
    allEvents.value = live.filter(event => event.type === 'timed' && event.active);
  } catch (error) {
    console.error('[vagter-legacy] failed to load live events', error);
    allEvents.value = [];
  } finally {
    loading.value = false;
  }
}

function initialSelection() {
  const eventId = props.adminMode && typeof route.params.eventId === 'string'
    ? route.params.eventId
    : typeof route.query.event === 'string' ? route.query.event : '';
  const next = timedEvents.value.find(event => event.id === eventId) ?? timedEvents.value[0];
  if (next && next.id !== selectedEventId.value) {
    selectedEventId.value = next.id;
  }
}

watch(timedEvents, () => {
  initialSelection();
  if (!selectedRoleLabel.value || !roleGroups.value.some(group => group.label === selectedRoleLabel.value)) {
    selectedRoleLabel.value = roleGroups.value[0]?.label ?? '';
  }
}, { immediate: true });

watch(selectedEventId, async nextId => {
  const next = timedEvents.value.find(event => event.id === nextId);
  if (!next) return;
  await loadSignups(next.id);
}, { immediate: true });

watch(() => route.query.event, nextEventId => {
  if (typeof nextEventId !== 'string' || !nextEventId) return;
  if (nextEventId !== selectedEventId.value && timedEvents.value.some(event => event.id === nextEventId)) {
    selectedEventId.value = nextEventId;
  }
});

function selectRole(label: string) {
  selectedRoleLabel.value = label;
}

function roleIcon(group: RoleGroup) {
  return group.icon;
}

function roleIconForLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('drink')) return 'ti-glass-full';
  if (lower.includes('skum')) return 'ti-flame';
  return 'ti-list';
}

function roleNoteIcon(group: RoleGroup) {
  return group.adultRequired ? 'ti-id' : 'ti-flame';
}

function roleCapacityLabel(group: RoleGroup) {
  return `${group.capacity} pr. vagt`;
}

function roleNoteForLabel(label: string, adultRequired: boolean) {
  const lower = label.toLowerCase();
  if (lower.includes('drink')) {
    return 'Mindst én hjælper over 18 år pr. vagt i drinksboden. Sæt kryds når du tilmelder dig, hvis du er over 18.';
  }
  if (lower.includes('skum')) {
    return 'Skumfidus-stationen har tre bålfade og pinde til børnene i området. Ingen alderskrav — alle kan hjælpe.';
  }
  return adultRequired ? 'Mindst én hjælper over 18 år pr. vagt.' : 'Meld dig på den vagt, du kan tage.';
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

function emptyRows(slot: EventSlot) {
  const remaining = slotRemaining(slot);
  if (!Number.isFinite(remaining) || remaining === Infinity) return 0;
  return remaining;
}

function shiftTimeLabel(slot: EventSlot) {
  const parts = [formatSlotDate(slot.date), slot.sublabel || slot.label].filter(Boolean);
  return parts.join(' · ');
}

function slotCapacityLabel(slot: EventSlot) {
  if (slot.capacity === 0) return '∞';
  const remaining = slotRemaining(slot);
  return remaining === 0 ? 'Fuldt' : `${remaining} ledig${remaining === 1 ? '' : 'e'}`;
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
  errors.general = '';
}

function openSignup(slot: EventSlot) {
  if (slotRemaining(slot) === 0) return;
  modalSlot.value = slot;
  modalOpen.value = true;
  submitting.value = false;
  resetErrors();
  form.name = '';
  form.email = '';
  form.adult = false;
}

function closeModal() {
  modalOpen.value = false;
  modalSlot.value = null;
  resetErrors();
}

function validateForm() {
  resetErrors();
  if (!form.name.trim()) {
    errors.name = 'Udfyld navn.';
  }
  if (!form.email.trim()) {
    errors.email = 'Udfyld mail.';
  } else if (!form.email.includes('@')) {
    errors.email = 'Mailadressen ser ikke rigtig ud.';
  }
  if (showAdultToggle.value && !form.adult) {
    errors.general = 'Markér at du er 18+ år.';
  }
  return !errors.name && !errors.email && !errors.general;
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
      email: form.email.trim(),
      adult: form.adult,
      childMode: false,
      groupSize: 1,
      waitlistPreferred: false,
    });

    await loadSignups(event.id);
    closeModal();

    toastText.value = response.waitlist
      ? 'Sat på venteliste — der var ikke flere pladser.'
      : 'Du er tilmeldt — tak for hjælpen!';
    toastVisible.value = true;
    setTimeout(() => {
      toastVisible.value = false;
    }, 3500);
  } catch (error: any) {
    console.error('[vagter-legacy] signup failed', error);
    errors.general = error?.message || 'Tilmeldingen kunne ikke sendes.';
  } finally {
    submitting.value = false;
  }
}

async function loadSignups(eventId: string) {
  loadingSignups.value = true;
  try {
    const db = await getAppFirestore();
    const [snap, contactSnap] = await Promise.all([
      getDocs(query(collection(db, 'signups'), where('eventId', '==', eventId))),
      getDocs(query(collection(db, 'signupContacts'), where('eventId', '==', eventId))),
    ]);
    const contacts = new Map(contactSnap.docs.map(item => [item.id, item.data()]));
    const next: Record<string, SignupRow[]> = {};
    snap.forEach(docSnap => {
      const data = docSnap.data() as Partial<SignupRow> & { slotId?: unknown };
      const slotId = typeof data.slotId === 'string' ? data.slotId : '';
      if (!slotId) return;
      const row: SignupRow = {
        id: docSnap.id,
        name: String(data.name ?? ''),
        email: String(contacts.get(docSnap.id)?.email ?? ''),
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
    console.error('[vagter-legacy] failed to load signups', error);
    signupMap.value = {};
  } finally {
    loadingSignups.value = false;
  }
}

async function adminCancel(signup: SignupRow) {
  if (!props.adminMode || !window.confirm(`Afmeld ${signup.name}?`)) return;
  try {
    const db = await getAppFirestore();
    await Promise.all([
      deleteDoc(doc(db, 'signups', signup.id)),
      deleteDoc(doc(db, 'signupContacts', signup.id)),
    ]);
    if (selectedEvent.value) await loadSignups(selectedEvent.value.id);
  } catch (error) {
    console.error('[admin-signups] failed to cancel signup', error);
  }
}

function scrollToRoleTabs() {
  roleTabsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyCurrentLink() {
  if (!selectedEvent.value) return;
  const url = new URL(window.location.href);
  url.searchParams.set('event', selectedEvent.value.id);
  const value = url.toString();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).catch(() => undefined);
  } else {
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
.legacy-shifts-page {
  min-height: 100vh;
  background: #f6f9fc;
  color: var(--text);
}

.hero {
  position: relative;
  z-index: 0;
  min-height: 60vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0b4378 0%, #0f467b 100%);
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  opacity: 0.55;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 51, 102, 0.02) 0%, rgba(0, 51, 102, 0.08) 42%, rgba(0, 51, 102, 0.82) 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 48px 20px 56px;
  display: grid;
  gap: 12px;
  color: #fff;
}

.hero-brand {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.hero-logo {
  display: block;
  width: min(184px, 52vw);
  height: auto;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.18));
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #b7e0ef;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 4.6rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.hero-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #d4e5f6;
  font-size: 0.95rem;
  font-weight: 700;
}

.hero-desc {
  max-width: 760px;
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-action,
.join-btn,
.modal-button {
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
}

.hero-action--primary {
  background: #0b1f3a;
  border-color: #0b1f3a;
}

.chip-link {
  text-decoration: none;
}

.content-shell {
  position: relative;
  z-index: 2;
  width: min(560px, calc(100% - 32px));
  margin: -72px auto 48px;
  display: grid;
  gap: 16px;
}

.page-section {
  background: #fff;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 24px;
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

.info-strip,
.role-tabs,
.modal-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.info-chip {
  flex: 1 1 170px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f4f8fb;
  color: var(--muted);
  line-height: 1.5;
  font-size: 13px;
}

.info-chip strong {
  display: block;
  margin-bottom: 2px;
  color: var(--text);
  font-size: 13px;
}

.role-tabs {
  margin: 18px 0 14px;
}

.role-tab {
  flex: 1 1 0;
  padding: 12px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  text-align: center;
  cursor: pointer;
}

.role-tab.active {
  border-color: #0b1f3a;
  background: #0b1f3a;
}

.rt-icon {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 20px;
}

.role-tab.active .rt-icon {
  color: #e8a020;
}

.rt-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.role-tab.active .rt-name,
.role-tab.active .rt-sub {
  color: #fff;
}

.rt-sub {
  margin-top: 1px;
  font-size: 11px;
  color: var(--muted);
}

.role-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-bottom: 18px;
  padding: 9px 12px;
  border: 1px solid #f5d080;
  border-radius: 8px;
  background: #fff8ec;
  color: var(--text);
  line-height: 1.5;
  font-size: 12px;
}

.loading-row,
.empty-state {
  padding: 14px 0;
}

.empty-state {
  display: grid;
  gap: 4px;
  color: var(--muted);
}

.empty-state-title {
  color: var(--text);
  font-weight: 800;
}

.shift-list {
  display: grid;
  gap: 14px;
}

.shift-section {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.shift-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.shift-time {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}

.shift-cap {
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1px solid var(--success-border);
  border-radius: 999px;
  background: var(--success-bg);
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
}

.cap-full {
  background: #fff;
  color: var(--muted);
}

.signups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.signup-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 10px 13px;
  border-radius: 10px;
  background: #f3f5f8;
  color: var(--muted);
  font-size: 13px;
}

.signup-row.filled {
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--text);
  font-weight: 700;
}

.signup-av {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #d0d0d0;
  display: grid;
  place-items: center;
  color: #7a7a7a;
  font-size: 12px;
  font-weight: 700;
}

.filled-av {
  background: #c2e0ce;
  color: var(--success);
}

.signup-name {
  min-width: 0;
  line-height: 1.35;
}

.signup-name small {
  display: block;
  color: var(--muted);
  font-weight: 500;
}

.admin-cancel-btn {
  float: right;
  margin-left: 14px;
  padding: 7px 12px;
  border: 1px solid #ff7474;
  border-radius: 8px;
  background: #fff;
  color: #e85d68;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.manage-signup-link {
  display: inline-block;
  margin: 12px 0;
  color: var(--navy);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.join-btn {
  width: 100%;
  border-color: var(--border);
  background: #fff;
  color: #0b1f3a;
}

.join-btn:disabled {
  background: #f7f7f7;
  color: var(--muted);
  cursor: not-allowed;
}

.contact-footer {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.contact-footer a {
  color: #0b1f3a;
  font-weight: 700;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(11, 31, 58, 0.55);
  z-index: 50;
  padding: 0;
}

.modal {
  width: 100%;
  max-width: 560px;
  padding: 24px 20px 32px;
  border-radius: 18px 18px 0 0;
  background: #fff;
}

.modal-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 800;
}

.modal-sub {
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 13px;
}

.modal-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-bottom: 14px;
  padding: 9px 12px;
  border: 1px solid #f5d080;
  border-radius: 8px;
  background: #fff8ec;
  color: var(--text);
  font-size: 12px;
  line-height: 1.5;
}

.signup-form {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 5px;
}

.field-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.field-input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 9px;
  font: inherit;
  color: var(--text);
  background: #f8f9fb;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  color: var(--text);
  font-size: 13px;
}

.check-row input {
  width: 17px;
  height: 17px;
  accent-color: #0b1f3a;
}

.field.error .field-input {
  border-color: #c94a4a;
}

.field-error,
.general-error {
  color: #b74040;
  font-size: 12px;
}

.modal-actions {
  margin-top: 4px;
}

.modal-button {
  flex: 1;
  border-color: var(--border);
  background: #f3f5f8;
  color: var(--muted);
}

.modal-button--primary {
  flex: 2;
  background: #0b1f3a;
  border-color: #0b1f3a;
  color: #fff;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  z-index: 60;
  padding: 12px 20px;
  border-radius: 24px;
  background: #0b1f3a;
  color: #fff;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.25s ease;
}

.toast.show {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 640px) {
  .hero-inner {
    padding: 34px 16px 46px;
  }

  .content-shell {
    width: min(100%, calc(100% - 24px));
    margin-top: -40px;
  }

  .shift-time {
    font-size: 16px;
  }

  .role-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .role-tab {
    min-width: 150px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none !important;
    animation: none !important;
  }
}
</style>
