import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { computed, reactive, ref } from 'vue';

import { getAppAuth, getAppFirestore, waitForAppAuthReady } from '@/lib/firebase';
import {
  EVENTS_COLLECTION,
  EVENT_TYPES,
  createSlot,
  fetchAllAdminEvents,
  formatTimeRange,
  parseTimeRange,
  toEventRecord,
} from './eventAdmin.data';
import type { AdminEvent, EventSection, EventSlot } from './eventAdmin.types';

type FormMode = 'list' | 'form';

function emptyDraft(type: AdminEvent['type']): AdminEvent {
  return {
    id: '',
    title: '',
    description: '',
    dateText: '',
    location: '',
    locationLat: null,
    locationLng: null,
    type,
    active: true,
    paymentUrl: '',
    cancelDeadlineDays: 0,
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

  // Validation surface: title + slot-level errors, mirroring the legacy
  // has-error / aria-invalid flags but expressed declaratively.
  const titleError = ref(false);
  const slotsError = ref(false);
  const invalidSlotIds = ref<Set<string>>(new Set());

  function applyDraft(source: AdminEvent) {
    draft.id = source.id;
    draft.title = source.title;
    draft.description = source.description;
    draft.dateText = source.dateText;
    draft.location = source.location;
    draft.locationLat = source.locationLat;
    draft.locationLng = source.locationLng;
    draft.type = source.type;
    draft.active = source.active;
    draft.paymentUrl = source.paymentUrl;
    draft.cancelDeadlineDays = source.cancelDeadlineDays;
    draft.imageUrl = source.imageUrl;
    draft.slots = source.slots.map(slot => createSlot(slot));
  }

  function clearErrors() {
    titleError.value = false;
    slotsError.value = false;
    invalidSlotIds.value = new Set();
    saveError.value = '';
  }

  async function load() {
    loading.value = true;
    loadError.value = '';
    try {
      await waitForAppAuthReady();
      const all = await fetchAllAdminEvents();
      events.value = all
        .filter(event => event.type === config.type)
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
    if (!draft.slots.length) addSlot();
    mode.value = 'form';
  }

  function startEdit(eventId: string) {
    const target = events.value.find(event => event.id === eventId);
    if (!target) return;
    clearErrors();
    applyDraft(target);
    editingId.value = eventId;
    mode.value = 'form';
  }

  function cancel() {
    clearErrors();
    mode.value = 'list';
    editingId.value = '';
  }

  function addSlot() {
    draft.slots.push(createSlot());
    slotsError.value = false;
  }

  function removeSlot(slotId: string) {
    draft.slots = draft.slots.filter(slot => slot.id !== slotId);
  }

  // Time-range editing for timed (vagt) slots: the editor binds two time
  // inputs and writes them back as the slot's "HH:MM–HH:MM" sublabel.
  function slotTimeRange(slot: EventSlot) {
    return parseTimeRange(slot.sublabel);
  }

  function setSlotTime(slot: EventSlot, part: 'start' | 'end', value: string) {
    const range = parseTimeRange(slot.sublabel);
    range[part] = value;
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

    if (draft.slots.length === 0) {
      slotsError.value = true;
      valid = false;
    }

    const invalid = new Set<string>();
    for (const slot of draft.slots) {
      if (!slot.label.trim()) {
        invalid.add(slot.id);
        valid = false;
      }
    }
    invalidSlotIds.value = invalid;

    return valid;
  }

  async function save(): Promise<boolean> {
    if (!validate()) return false;
    saving.value = true;
    saveError.value = '';
    try {
      const db = await getAppFirestore();
      const record = toEventRecord(draft);
      if (editingId.value) {
        await updateDoc(doc(db, EVENTS_COLLECTION, editingId.value), {
          ...record,
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
      saveError.value = 'Gemning fejlede — tjek din forbindelse og prøv igen.';
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
    remove,
  };
}
