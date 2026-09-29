import { collection, getDocs } from 'firebase/firestore';

import { getAppFirestore } from '@/lib/firebase';
import { calculateRecurringDates } from './eventScheduling';
import type { AdminEvent, EventSection, EventSlot, EventType, EventTypeConfig, SlotComponentType, SlotKind, SlotScheduleMode, SlotRelativeTo } from './eventAdmin.types';

export const EVENTS_COLLECTION = 'events';

// Reads every event (any type) from the live collection. `events` is publicly
// readable, so this works without auth — used by the public events page as well
// as the admin form loader.
export async function fetchAllAdminEvents(options: { collapseRecurring?: boolean } = {}): Promise<AdminEvent[]> {
  const db = await getAppFirestore();
  const snap = await getDocs(collection(db, EVENTS_COLLECTION));
  return snap.docs.map(docSnap => createAdminEventFromRecord({ id: docSnap.id, ...docSnap.data() }, options));
}

export const SLOT_ROLES = ['', 'Vagt', 'Hjælper', 'Ansvarlig', 'Koordinator', 'Leder'] as const;

// Port of legacy admin.html EVENT_TYPES, plus the per-type form-behaviour flags
// that were previously inferred from `fType` inside addSlotRow.
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

export function timeAfter(start: string, durationMinutes: number): string {
  const match = start.match(/^(\d{2}):(\d{2})$/);
  if (!match) return '';
  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const totalMinutes = (startMinutes + durationMinutes) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function durationBetween(start: string, end: string): number | undefined {
  const startMatch = start.match(/^(\d{2}):(\d{2})$/);
  const endMatch = end.match(/^(\d{2}):(\d{2})$/);
  if (!startMatch || !endMatch) return undefined;
  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
  const duration = (endMinutes - startMinutes + 24 * 60) % (24 * 60);
  return duration || undefined;
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
  const id = partial?.id ?? createSlotId();
  const componentType = partial?.componentType ?? 'task';
  const groupSize = partial?.groupSize ?? partial?.groupMax ?? 1;
  const legacyRange = parseTimeRange(partial?.sublabel);
  const startTime = partial?.startTime ?? legacyRange.start;
  const endTime = partial?.endTime ?? legacyRange.end;
  const shiftDurationMinutes = partial?.shiftDurationMinutes ?? durationBetween(startTime, endTime) ?? 60;
  return {
    id,
    componentType,
    shiftGroupId: partial?.shiftGroupId ?? (componentType === 'shift' ? id : ''),
    taskGroupId: partial?.taskGroupId ?? (componentType === 'task' ? id : ''),
    taskGroupTitle: partial?.taskGroupTitle ?? (componentType === 'task' ? partial?.label ?? '' : ''),
    label: partial?.label ?? '',
    role: partial?.role ?? '',
    sublabel: partial?.sublabel ?? '',
    startTime,
    endTime,
    shiftDurationMinutes,
    date: partial?.date ?? '',
    scheduleMode: partial?.scheduleMode,
    relativeTo: partial?.relativeTo,
    offsetDays: partial?.offsetDays,
    deadlineDate: partial?.deadlineDate,
    deadlineScheduleMode: partial?.deadlineScheduleMode,
    deadlineOffsetDays: partial?.deadlineOffsetDays,
    recurrenceWeekdays: partial?.recurrenceWeekdays ? [...partial.recurrenceWeekdays] : undefined,
    recurrenceWeekday: partial?.recurrenceWeekday,
    recurrenceStartDate: partial?.recurrenceStartDate,
    recurrenceEndDate: partial?.recurrenceEndDate,
    recurrenceMaterialized: partial?.recurrenceMaterialized,
    capacity: partial?.capacity ?? 3,
    kind: partial?.kind ?? (componentType === 'signup' ? 'attend' : 'volunteer'),
    price: partial?.price ?? 0,
    paymentUrl: partial?.paymentUrl ?? '',
    cancelDeadlineDays: partial?.cancelDeadlineDays ?? 0,
    registrationMode: partial?.registrationMode ?? 'local',
    memberServiceUrl: partial?.memberServiceUrl ?? '',
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

export function createAdminEventFromRecord(record: { id: string; [key: string]: unknown }, options: { collapseRecurring?: boolean } = {}): AdminEvent {
  const rawSlots = Array.isArray(record.slots) ? (record.slots as Array<Record<string, unknown>>) : [];
  const eventType = (record.type as EventType) ?? 'timed';
  const legacyComponentType: SlotComponentType = eventType === 'timed' ? 'shift' : 'task';
  // Existing arrangements stored one link on the parent event. Read that
  // legacy value into each paid signup until the event is next saved.
  const legacyPaymentUrl = String(record.paymentUrl ?? '');
  const legacyCancelDeadlineDays = typeof record.cancelDeadlineDays === 'number' ? record.cancelDeadlineDays : 0;
  return {
    id: record.id,
    title: String(record.title ?? ''),
    description: String(record.description ?? ''),
    dateText: String(record.dateText ?? ''),
    eventDate: typeof record.eventDate === 'string' ? record.eventDate : undefined,
    planYear: typeof record.planYear === 'number' ? record.planYear : undefined,
    location: String(record.location ?? ''),
    locationLat: typeof record.locationLat === 'number' ? record.locationLat : null,
    locationLng: typeof record.locationLng === 'number' ? record.locationLng : null,
    type: eventType,
    active: record.active !== false,
    imageUrl: String(record.imageUrl ?? record.url ?? ''),
    slots: (options.collapseRecurring ? collapseMaterializedShiftSlots : (slots: EventSlot[]) => slots)(rawSlots.map(slot =>
      createSlot({
        id: typeof slot.id === 'string' ? slot.id : undefined,
        componentType: slot.componentType === 'shift' || slot.componentType === 'signup' ? slot.componentType : legacyComponentType,
        shiftGroupId: typeof slot.shiftGroupId === 'string' ? slot.shiftGroupId : undefined,
        taskGroupId: typeof slot.taskGroupId === 'string' ? slot.taskGroupId : '',
        taskGroupTitle: typeof slot.taskGroupTitle === 'string' ? slot.taskGroupTitle : (typeof slot.label === 'string' ? slot.label : ''),
        label: typeof slot.label === 'string' ? slot.label : '',
        role: typeof slot.role === 'string' ? slot.role : '',
        sublabel: typeof slot.sublabel === 'string' ? slot.sublabel : '',
        startTime: typeof slot.startTime === 'string' ? slot.startTime : undefined,
        endTime: typeof slot.endTime === 'string' ? slot.endTime : undefined,
        shiftDurationMinutes: typeof slot.shiftDurationMinutes === 'number' ? slot.shiftDurationMinutes : undefined,
        date: typeof slot.date === 'string' ? slot.date : '',
        scheduleMode: slot.scheduleMode === 'relative' || slot.scheduleMode === 'weekly' || slot.scheduleMode === 'biweekly' ? slot.scheduleMode : slot.scheduleMode === 'fixed' ? 'fixed' : undefined,
        relativeTo: slot.relativeTo === 'event' ? 'event' : undefined,
        offsetDays: typeof slot.offsetDays === 'number' ? slot.offsetDays : undefined,
        deadlineDate: typeof slot.deadlineDate === 'string' ? slot.deadlineDate : undefined,
        deadlineScheduleMode: slot.deadlineScheduleMode === 'relative' ? 'relative' : slot.deadlineScheduleMode === 'fixed' ? 'fixed' : undefined,
        deadlineOffsetDays: typeof slot.deadlineOffsetDays === 'number' ? slot.deadlineOffsetDays : undefined,
        recurrenceWeekdays: Array.isArray(slot.recurrenceWeekdays)
          ? slot.recurrenceWeekdays.filter((weekday): weekday is number => typeof weekday === 'number' && Number.isInteger(weekday) && weekday >= 0 && weekday <= 6)
          : undefined,
        recurrenceWeekday: typeof slot.recurrenceWeekday === 'number' ? slot.recurrenceWeekday : undefined,
        recurrenceStartDate: typeof slot.recurrenceStartDate === 'string' ? slot.recurrenceStartDate : undefined,
        recurrenceEndDate: typeof slot.recurrenceEndDate === 'string' ? slot.recurrenceEndDate : undefined,
        recurrenceMaterialized: slot.recurrenceMaterialized === true,
        capacity: typeof slot.capacity === 'number' ? slot.capacity : 1,
        kind: (slot.kind as SlotKind) ?? 'volunteer',
        price: typeof slot.price === 'number' ? slot.price : 0,
        paymentUrl: typeof slot.paymentUrl === 'string'
          ? slot.paymentUrl
          : slot.kind === 'paid' ? legacyPaymentUrl : '',
        cancelDeadlineDays: typeof slot.cancelDeadlineDays === 'number'
          ? slot.cancelDeadlineDays
          : slot.kind === 'paid' ? legacyCancelDeadlineDays : 0,
        registrationMode: slot.registrationMode === 'memberService' ? 'memberService' : 'local',
        memberServiceUrl: typeof slot.memberServiceUrl === 'string' ? slot.memberServiceUrl : '',
        groupSize: typeof slot.groupSize === 'number' ? slot.groupSize : undefined,
        groupMin: typeof slot.groupMin === 'number' ? slot.groupMin : undefined,
        groupMax: typeof slot.groupMax === 'number' ? slot.groupMax : undefined,
        minAge: typeof slot.minAge === 'number' ? slot.minAge : 0,
        requiresAdult: typeof slot.requiresAdult === 'boolean' ? slot.requiresAdult : undefined,
      }),
      )),
    createdAt: toMillis(record.created ?? record.createdAt),
    updatedAt: toMillis(record.updated ?? record.updatedAt),
  };
}

/**
 * Public signup needs one concrete slot per recurring occurrence. The admin
 * editor, however, should edit the recurrence template rather than every
 * generated occurrence. Collapse materialized occurrences back to one slot
 * per period when loading an event for editing.
 */
function collapseMaterializedShiftSlots(slots: EventSlot[]): EventSlot[] {
  const seen = new Set<string>();
  return slots.filter(slot => {
    if (slot.componentType !== 'shift' || !slot.recurrenceMaterialized) return true;
    const key = [
      slot.shiftGroupId || slot.label,
      slot.label,
      slot.startTime,
      slot.endTime,
      slot.recurrenceWeekdays?.length ? [...slot.recurrenceWeekdays].sort((a, b) => a - b).join(',') : slot.recurrenceWeekday,
      slot.recurrenceStartDate,
      slot.recurrenceEndDate,
    ].join('\u0000');
    if (seen.has(key)) return false;
    seen.add(key);
    // Materialized ids are generated as `${templateId}-${YYYY-MM-DD}`.
    // Restore the template id so saving an unchanged recurrence keeps stable
    // signup slot ids instead of appending another date suffix.
    slot.id = slot.id.replace(/-\d{4}-\d{2}-\d{2}$/, '');
    slot.date = '';
    slot.recurrenceMaterialized = false;
    return true;
  });
}

// The Firestore write payload (sans server timestamps / createdBy, which the
// caller adds). Payment settings stay on each paid signup group, so separate
// groups can use separate payment links.
export function toEventRecord(event: AdminEvent) {
  const derivedPlanYear = event.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(event.eventDate)
    ? Number(event.eventDate.slice(0, 4))
    : event.planYear;
  return {
    title: event.title.trim(),
    description: event.description.trim(),
    dateText: event.dateText.trim(),
    ...(event.eventDate ? { eventDate: event.eventDate } : {}),
    ...(typeof derivedPlanYear === 'number' ? { planYear: derivedPlanYear } : {}),
    location: event.location.trim(),
    locationLat: event.locationLat,
    locationLng: event.locationLng,
    type: event.type,
    active: event.active,
    imageUrl: event.imageUrl.trim(),
    slots: materializeShiftSlots(event.slots).map(slot => ({
      // A shift is always an individual voluntary duty. The admin UI keeps
      // task-only participation options out of the shift flow, and the
      // persisted record follows the same constraint on save.
      ...(slot.componentType === 'shift'
        ? { kind: 'volunteer' as const, price: 0, paymentUrl: '', cancelDeadlineDays: 0, groupSize: 1, groupMin: 1, groupMax: 1 }
        : {
            kind: slot.kind,
            price: slot.kind === 'paid' && slot.registrationMode !== 'memberService' ? slot.price : 0,
            paymentUrl: slot.kind === 'paid' && slot.registrationMode !== 'memberService' ? slot.paymentUrl.trim() : '',
            cancelDeadlineDays: slot.kind === 'paid' && slot.registrationMode !== 'memberService' ? slot.cancelDeadlineDays || 0 : 0,
            groupSize: slot.groupSize,
            groupMin: slot.groupSize,
            groupMax: slot.groupSize,
          }),
      id: slot.id,
      componentType: slot.componentType,
      shiftGroupId: slot.shiftGroupId,
      taskGroupId: slot.componentType === 'task'
        ? slot.taskGroupId || (slot.taskGroupTitle.trim() ? `task-${slot.taskGroupTitle.trim().toLowerCase()}` : slot.id)
        : '',
      taskGroupTitle: slot.componentType === 'task' ? slot.taskGroupTitle.trim() : '',
      label: slot.label.trim(),
      role: slot.role,
      sublabel: slot.componentType === 'shift' ? formatTimeRange(slot.startTime, slot.endTime) : slot.sublabel,
      startTime: slot.componentType === 'shift' ? slot.startTime : '',
      endTime: slot.componentType === 'shift' ? slot.endTime : '',
      shiftDurationMinutes: slot.componentType === 'shift' ? slot.shiftDurationMinutes : 0,
      date: slot.date,
      ...(slot.scheduleMode ? { scheduleMode: slot.scheduleMode as SlotScheduleMode } : {}),
      ...(slot.relativeTo ? { relativeTo: slot.relativeTo as SlotRelativeTo } : {}),
      ...(typeof slot.offsetDays === 'number' ? { offsetDays: slot.offsetDays } : {}),
      ...(slot.deadlineDate ? { deadlineDate: slot.deadlineDate } : {}),
      ...(slot.deadlineScheduleMode ? { deadlineScheduleMode: slot.deadlineScheduleMode as SlotScheduleMode } : {}),
      ...(typeof slot.deadlineOffsetDays === 'number' ? { deadlineOffsetDays: slot.deadlineOffsetDays } : {}),
      ...(slot.recurrenceWeekdays?.length ? { recurrenceWeekdays: slot.recurrenceWeekdays } : {}),
      ...(typeof slot.recurrenceWeekday === 'number' ? { recurrenceWeekday: slot.recurrenceWeekday } : {}),
      ...(slot.recurrenceStartDate ? { recurrenceStartDate: slot.recurrenceStartDate } : {}),
      ...(slot.recurrenceEndDate ? { recurrenceEndDate: slot.recurrenceEndDate } : {}),
      ...(slot.recurrenceMaterialized ? { recurrenceMaterialized: true } : {}),
      capacity: slot.capacity,
      minAge: slot.requiresAdult ? 18 : 0,
      requiresAdult: slot.requiresAdult,
      ...(slot.componentType === 'signup' && slot.kind === 'paid' && slot.registrationMode === 'memberService'
        ? { registrationMode: 'memberService' as const, memberServiceUrl: slot.memberServiceUrl.trim() }
        : {}),
    })),
  };
}

export function isValidMemberServiceUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function materializeShiftSlots(slots: EventSlot[]): EventSlot[] {
  return slots.flatMap(slot => {
    const recurring = slot.componentType === 'shift'
      && (slot.scheduleMode === 'weekly' || slot.scheduleMode === 'biweekly')
      && !slot.recurrenceMaterialized
      && !slot.date;
    if (!recurring) return [slot];
    const dates = calculateRecurringDates(slot);
    if (!dates.length) return [slot];
    return dates.map(date => createSlot({
      ...slot,
      id: `${slot.id}-${date}`,
      date,
      recurrenceMaterialized: true,
    }));
  });
}
