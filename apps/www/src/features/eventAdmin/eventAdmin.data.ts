import { collection, getDocs } from 'firebase/firestore';

import { getAppFirestore } from '@/lib/firebase';
import type { AdminEvent, EventSection, EventSlot, EventType, EventTypeConfig, SlotKind } from './eventAdmin.types';

export const EVENTS_COLLECTION = 'events';

// Reads every event (any type) from the live collection. `events` is publicly
// readable, so this works without auth — used by the public events page as well
// as the admin form loader.
export async function fetchAllAdminEvents(): Promise<AdminEvent[]> {
  const db = await getAppFirestore();
  const snap = await getDocs(collection(db, EVENTS_COLLECTION));
  return snap.docs.map(docSnap => createAdminEventFromRecord({ id: docSnap.id, ...docSnap.data() }));
}

export const SLOT_ROLES = ['', 'Vagt', 'Hjælper', 'Ansvarlig', 'Koordinator', 'Leder'] as const;

// Port of legacy admin.html EVENT_TYPES, plus the per-type form-behaviour flags
// that were previously inferred from `fType` inside addSlotRow/refreshPayment.
export const EVENT_TYPES: Record<EventSection, EventTypeConfig> = {
  vagter: {
    section: 'vagter',
    type: 'timed',
    title: 'Vagter',
    newLabel: 'Ny vagt',
    formNew: 'Ny vagt',
    formEdit: 'Rediger vagt',
    saveLabel: 'Gem vagt',
    empty: 'Ingen vagter endnu. Opret en ny ovenfor.',
    titleError: 'Udfyld vagtens titel.',
    timedSlots: true,
    showKindPicker: false,
    showPayment: false,
  },
  opgaver: {
    section: 'opgaver',
    type: 'task',
    title: 'Opgaver',
    newLabel: 'Ny opgave',
    formNew: 'Ny opgave',
    formEdit: 'Rediger opgave',
    saveLabel: 'Gem opgave',
    empty: 'Ingen opgaver endnu. Opret en ny ovenfor.',
    titleError: 'Udfyld opgavens titel.',
    timedSlots: false,
    showKindPicker: false,
    showPayment: false,
  },
  arrangementer: {
    section: 'arrangementer',
    type: 'event',
    title: 'Arrangementer',
    newLabel: 'Nyt arrangement',
    formNew: 'Nyt arrangement',
    formEdit: 'Rediger arrangement',
    saveLabel: 'Gem arrangement',
    empty: 'Ingen arrangementer endnu. Opret en ny ovenfor.',
    titleError: 'Udfyld arrangementets titel.',
    timedSlots: false,
    showKindPicker: true,
    showPayment: true,
  },
};

export function sectionForType(type: EventType): EventSection {
  return (Object.keys(EVENT_TYPES) as EventSection[]).find(section => EVENT_TYPES[section].type === type) ?? 'vagter';
}

let slotCounter = 0;
export function createSlotId(): string {
  slotCounter += 1;
  return `s${Date.now()}${slotCounter}`;
}

// Legacy stores a slot's time span as "HH:MM–HH:MM" in `sublabel`; the form
// edits it as two <input type="time"> values.
export function parseTimeRange(sublabel: string | undefined): { start: string; end: string } {
  if (!sublabel) return { start: '', end: '' };
  const match = sublabel.match(/^(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})$/);
  if (!match) return { start: '', end: '' };
  return { start: normalizeTimeInputValue(match[1]), end: normalizeTimeInputValue(match[2]) };
}

export function formatTimeRange(start: string, end: string): string {
  return start && end ? `${start}–${end}` : '';
}

// Formats a slot's ISO "YYYY-MM-DD" date for display, e.g. "21. maj".
// Parsed with an explicit local time to avoid UTC day-shift on parse.
export function formatSlotDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' });
}

function normalizeTimeInputValue(value: string): string {
  const [hour = '', minute = ''] = value.split(':');
  return `${hour.padStart(2, '0')}:${minute}`;
}

export function createSlot(partial?: Partial<EventSlot>): EventSlot {
  const groupSize = partial?.groupSize ?? partial?.groupMax ?? 1;
  return {
    id: partial?.id ?? createSlotId(),
    label: partial?.label ?? '',
    role: partial?.role ?? '',
    sublabel: partial?.sublabel ?? '',
    date: partial?.date ?? '',
    capacity: partial?.capacity ?? 3,
    kind: partial?.kind ?? 'volunteer',
    price: partial?.price ?? 0,
    groupSize,
    groupMin: partial?.groupMin ?? groupSize,
    groupMax: partial?.groupMax ?? groupSize,
    minAge: partial?.minAge ?? 0,
    requiresAdult: partial?.requiresAdult ?? (typeof partial?.minAge === 'number' && partial.minAge >= 18),
  };
}

function toMillis(value: unknown): number | undefined {
  if (!value) return undefined;
  if (typeof value === 'number') return value;
  const maybe = value as { toMillis?: () => number; seconds?: number };
  if (typeof maybe.toMillis === 'function') return maybe.toMillis();
  if (typeof maybe.seconds === 'number') return maybe.seconds * 1000;
  return undefined;
}

export function createAdminEventFromRecord(record: { id: string; [key: string]: unknown }): AdminEvent {
  const rawSlots = Array.isArray(record.slots) ? (record.slots as Array<Record<string, unknown>>) : [];
  return {
    id: record.id,
    title: String(record.title ?? ''),
    description: String(record.description ?? ''),
    dateText: String(record.dateText ?? ''),
    location: String(record.location ?? ''),
    locationLat: typeof record.locationLat === 'number' ? record.locationLat : null,
    locationLng: typeof record.locationLng === 'number' ? record.locationLng : null,
    type: (record.type as EventType) ?? 'timed',
    active: record.active !== false,
    paymentUrl: String(record.paymentUrl ?? ''),
    cancelDeadlineDays: typeof record.cancelDeadlineDays === 'number' ? record.cancelDeadlineDays : 0,
    imageUrl: String(record.imageUrl ?? record.url ?? ''),
    slots: rawSlots.map(slot =>
      createSlot({
        id: typeof slot.id === 'string' ? slot.id : undefined,
        label: typeof slot.label === 'string' ? slot.label : '',
        role: typeof slot.role === 'string' ? slot.role : '',
        sublabel: typeof slot.sublabel === 'string' ? slot.sublabel : '',
        date: typeof slot.date === 'string' ? slot.date : '',
        capacity: typeof slot.capacity === 'number' ? slot.capacity : 1,
        kind: (slot.kind as SlotKind) ?? 'volunteer',
        price: typeof slot.price === 'number' ? slot.price : 0,
        groupSize: typeof slot.groupSize === 'number' ? slot.groupSize : undefined,
        groupMin: typeof slot.groupMin === 'number' ? slot.groupMin : undefined,
        groupMax: typeof slot.groupMax === 'number' ? slot.groupMax : undefined,
        minAge: typeof slot.minAge === 'number' ? slot.minAge : 0,
        requiresAdult: typeof slot.requiresAdult === 'boolean' ? slot.requiresAdult : undefined,
      }),
    ),
    createdAt: toMillis(record.created ?? record.createdAt),
    updatedAt: toMillis(record.updated ?? record.updatedAt),
  };
}

// The Firestore write payload (sans server timestamps / createdBy, which the
// caller adds), matching the legacy saveEvent shape so the data stays
// interoperable with public/admin.html.
export function toEventRecord(event: AdminEvent) {
  return {
    title: event.title.trim(),
    description: event.description.trim(),
    dateText: event.dateText.trim(),
    location: event.location.trim(),
    locationLat: event.locationLat,
    locationLng: event.locationLng,
    type: event.type,
    active: event.active,
    paymentUrl: event.paymentUrl.trim(),
    cancelDeadlineDays: event.cancelDeadlineDays || 0,
    imageUrl: event.imageUrl.trim(),
    slots: event.slots.map(slot => ({
      id: slot.id,
      label: slot.label.trim(),
      role: slot.role,
      sublabel: slot.sublabel,
      date: slot.date,
      capacity: slot.capacity,
      kind: slot.kind,
      price: slot.kind === 'paid' ? slot.price : 0,
      groupSize: slot.groupSize,
      groupMin: slot.groupSize,
      groupMax: slot.groupSize,
      minAge: slot.requiresAdult ? 18 : 0,
      requiresAdult: slot.requiresAdult,
    })),
  };
}
