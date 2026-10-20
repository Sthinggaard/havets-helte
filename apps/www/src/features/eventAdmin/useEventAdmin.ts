import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { computed, reactive, ref } from 'vue';

import { getAppAuth, getAppFirestore, waitForAppAuthReady } from '@/lib/firebase';
import {
  EVENTS_COLLECTION,
  EVENT_TYPES,
  createSlot,
  fetchAllAdminEvents,
  formatTimeRange,
  isValidMemberServiceUrl,
  parseTimeRange,
  toEventRecord,
} from './eventAdmin.data';
import type { AdminEvent, EventSection, EventSlot, SlotComponentType } from './eventAdmin.types';
import { normalizeEventLeaders, saveEventLeaderName } from './eventLeaders';

type FormMode = 'list' | 'form';

function emptyDraft(type: AdminEvent['type']): AdminEvent {
  return {
    id: '',
    title: '',
    description: '',
    responsibleLeaders: [],
    dateText: '',
    eventDate: '',
    planYear: new Date().getFullYear(),
    location: '',
    locationLat: null,
    locationLng: null,
    type,
    active: true,
    imageUrl: '',
    slots: [],
  };
}

export function useEventAdmin(section: EventSection) {
  const config = EVENT_TYPES[section];

  const events = ref<AdminEvent[]>([]);
  const loading = ref(true);
  const loadError = ref('');
  const saving = ref(false);
  const saveError = ref('');

  const mode = ref<FormMode>('list');
  const editingId = ref('');
  const draft = reactive<AdminEvent>(emptyDraft(config.type));
  const changedLeaderNames = new Set<string>();

  // Validation surface: title + slot-level errors, mirroring the legacy
  // has-error / aria-invalid flags but expressed declaratively.
  const titleError = ref(false);
  const slotsError = ref(false);
  const invalidSlotIds = ref<Set<string>>(new Set());
  const invalidSlotTimeIds = ref<Set<string>>(new Set());
  const invalidMemberServiceUrlIds = ref<Set<string>>(new Set());

  function applyDraft(source: AdminEvent) {
    changedLeaderNames.clear();
    draft.id = source.id;
    draft.title = source.title;
    draft.description = source.description;
    draft.responsibleLeaders = normalizeEventLeaders(source.responsibleLeaders);
    draft.dateText = source.dateText;
    draft.eventDate = source.eventDate ?? '';
    draft.planYear = source.planYear;
    draft.location = source.location;
    draft.locationLat = source.locationLat;
    draft.locationLng = source.locationLng;
    draft.type = source.type;
    draft.active = source.active;
    draft.imageUrl = source.imageUrl;
    draft.slots = source.slots.map(slot => createSlot(slot));
  }

  function clearErrors() {
    titleError.value = false;
    slotsError.value = false;
    invalidSlotIds.value = new Set();
    invalidSlotTimeIds.value = new Set();
    invalidMemberServiceUrlIds.value = new Set();
    saveError.value = '';
  }

  async function load() {
    loading.value = true;
    loadError.value = '';
    try {
      await waitForAppAuthReady();
      const all = await fetchAllAdminEvents({ collapseRecurring: true });
      events.value = all
        // The arrangements view is the new home for legacy task and shift
        // records as well. They are promoted to an arrangement only when a
        // leader explicitly saves the edited record, preserving its id and
        // existing signups during the transition.
        .filter(event => config.type === 'event' || event.type === config.type)
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.title.localeCompare(b.title, 'da'));
    } catch (error) {
      console.error('[event-admin] load failed', error);
      loadError.value = 'Kunne ikke hente listen — tjek din forbindelse og prøv igen.';
      events.value = [];
    } finally {
      loading.value = false;
    }
  }

  // `prefill` lets the public events page hand off a placeholder/static event
  // so "Rediger" opens a populated form that persists as a new doc on save.
  function startCreate(prefill?: Partial<AdminEvent>) {
    clearErrors();
    applyDraft({ ...emptyDraft(config.type), ...prefill, type: config.type });
    editingId.value = '';
    mode.value = 'form';
  }

  function startEdit(eventId: string) {
    const target = events.value.find(event => event.id === eventId);
    if (!target) return;
    clearErrors();
    applyDraft(target);
    if (config.type === 'event') draft.type = 'event';
    editingId.value = eventId;
    mode.value = 'form';
  }

  function cancel() {
    changedLeaderNames.clear();
    clearErrors();
    mode.value = 'list';
    editingId.value = '';
  }

  function addSlot(componentType: SlotComponentType = config.timedSlots ? 'shift' : 'task') {
    draft.slots.push(createSlot({ componentType }));
    slotsError.value = false;
  }

  function removeSlot(slotId: string) {
    draft.slots = draft.slots.filter(slot => slot.id !== slotId);
  }

  // Time-range editing for timed (vagt) slots: the editor binds two time
  // inputs and writes them back as the slot's "HH:MM–HH:MM" sublabel.
  function slotTimeRange(slot: EventSlot) {
    const legacyRange = parseTimeRange(slot.sublabel);
    return { start: slot.startTime || legacyRange.start, end: slot.endTime || legacyRange.end };
  }

  function setSlotTime(slot: EventSlot, part: 'start' | 'end', value: string) {
    const range = slotTimeRange(slot);
    range[part] = value;
    slot.startTime = range.start;
    slot.endTime = range.end;
    slot.sublabel = formatTimeRange(range.start, range.end);
  }

  function toggleSlotUnlimited(slot: EventSlot, unlimited: boolean) {
    slot.capacity = unlimited ? 0 : 3;
  }

  function validate(): boolean {
    clearErrors();
    let valid = true;

    if (!draft.title.trim()) {
      titleError.value = true;
      valid = false;
    }

    if (draft.responsibleLeaders.some(leader => !leader.name.trim() || leader.name.trim().length > 120)) {
      saveError.value = 'Skriv lederens navn på højst 120 tegn.';
      valid = false;
    }

    if (draft.slots.length === 0) {
      slotsError.value = true;
      valid = false;
    }

    const invalid = new Set<string>();
    const invalidTimes = new Set<string>();
    const invalidMemberServiceUrls = new Set<string>();
    for (const slot of draft.slots) {
      if (!slot.label.trim()) {
        invalid.add(slot.id);
        valid = false;
      }
      if (slot.componentType === 'task' && !slot.taskGroupTitle.trim()) {
        invalid.add(slot.id);
        valid = false;
      }
      if (slot.componentType === 'shift') {
        const range = slotTimeRange(slot);
        if (!range.start || !range.end) {
          invalidTimes.add(slot.id);
          valid = false;
        }
      }
      if (slot.componentType === 'signup' && slot.kind === 'paid' && slot.registrationMode === 'memberService' && !isValidMemberServiceUrl(slot.memberServiceUrl)) {
        invalidMemberServiceUrls.add(slot.id);
        valid = false;
      }
    }
    invalidSlotIds.value = invalid;
    invalidSlotTimeIds.value = invalidTimes;
    invalidMemberServiceUrlIds.value = invalidMemberServiceUrls;

    return valid;
  }

  async function save(): Promise<boolean> {
    if (saving.value) return false;
    if (!validate()) return false;
    saving.value = true;
    saveError.value = '';
    let savingLeaderNames = false;
    try {
      const db = await getAppFirestore();
      const record = toEventRecord(draft);
      savingLeaderNames = true;
      for (const leader of record.responsibleLeaders) {
        if (!changedLeaderNames.has(leader.id)) continue;
        const savedLeader = await saveEventLeaderName(leader.id, leader.name);
        leader.name = savedLeader.name;
      }
      savingLeaderNames = false;
      if (editingId.value) {
        await updateDoc(doc(db, EVENTS_COLLECTION, editingId.value), {
          ...record,
          // Clean up the old event-wide fields once their values have been
          // migrated into the paid signup groups above.
          paymentUrl: deleteField(),
          cancelDeadlineDays: deleteField(),
          updated: serverTimestamp(),
        });
      } else {
        const auth = await getAppAuth();
        await addDoc(collection(db, EVENTS_COLLECTION), {
          ...record,
          createdBy: auth.currentUser?.uid ?? '',
          created: serverTimestamp(),
          updated: serverTimestamp(),
        });
      }
      await load();
      cancel();
      return true;
    } catch (error) {
      console.error('[event-admin] save failed', error);
      saveError.value = savingLeaderNames
        ? 'Lederens navn kunne ikke gemmes. Arrangementet er ikke gemt. Prøv igen.'
        : 'Gemning fejlede — tjek din forbindelse og prøv igen.';
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function remove(eventId: string): Promise<boolean> {
    try {
      const db = await getAppFirestore();
      await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
      await load();
      return true;
    } catch (error) {
      console.error('[event-admin] delete failed', error);
      loadError.value = 'Sletning fejlede — prøv igen.';
      return false;
    }
  }

  const formTitle = computed(() => (editingId.value ? config.formEdit : config.formNew));

  function markLeaderNameChanged(id: string) {
    changedLeaderNames.add(id);
  }

  return {
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
    slotTimeRange,
    setSlotTime,
    toggleSlotUnlimited,
    save,
    markLeaderNameChanged,
    remove,
  };
}
