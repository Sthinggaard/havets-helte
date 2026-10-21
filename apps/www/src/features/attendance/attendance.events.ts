import type { AdminEvent, EventSlot } from '../eventAdmin/eventAdmin.types';
import { calculateRecurringDates, calculateSlotDate, isValidIsoDate } from '../eventAdmin/eventScheduling';

export interface CalendarSignup {
  id: string;
  label: string;
  time: string;
  external: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  location: string;
  times: string[];
  signups: CalendarSignup[];
}

function occurrenceDates(event: AdminEvent, slot: EventSlot): string[] {
  const slotDate = calculateSlotDate(event.eventDate, slot);
  if (!slot.recurrenceMaterialized && (slot.scheduleMode === 'weekly' || slot.scheduleMode === 'biweekly')) return calculateRecurringDates(slot);
  if (slotDate) return [slotDate];
  // Undated signup sections inherit the arrangement date, just like public registration.
  return slot.componentType === 'signup' && isValidIsoDate(event.eventDate) ? [event.eventDate] : [];
}

/** One arrangement per day, even when several shifts/signups share that day. */
export function calendarEventOccurrences(events: AdminEvent[]): CalendarEvent[] {
  const occurrences: CalendarEvent[] = [];
  for (const event of events) {
    if (!event.active) continue;
    const dates = new Map<string, { times: Set<string>; signups: CalendarSignup[] }>();
    if (isValidIsoDate(event.eventDate)) dates.set(event.eventDate, { times: new Set(), signups: [] });
    for (const slot of event.slots) {
      // Preparation tasks and deadlines are not days of the arrangement itself.
      if (slot.componentType === 'task') continue;
      for (const date of occurrenceDates(event, slot)) {
        const day = dates.get(date) ?? { times: new Set<string>(), signups: [] };
        const time = [slot.startTime, slot.endTime].filter(Boolean).join('–');
        if (slot.startTime) day.times.add(time);
        if (slot.componentType === 'signup') day.signups.push({ id: slot.id, label: slot.label || 'Tilmelding', time, external: slot.registrationMode === 'memberService' });
        dates.set(date, day);
      }
    }
    for (const [date, day] of dates) {
      occurrences.push({ id: event.id, date, title: event.title, location: event.location, times: [...day.times].sort(), signups: day.signups });
    }
  }
  return occurrences.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'da'));
}
