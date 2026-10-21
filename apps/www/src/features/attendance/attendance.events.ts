import type { AdminEvent } from '../eventAdmin/eventAdmin.types';
import { calculateRecurringDates, calculateSlotDate, isValidIsoDate } from '../eventAdmin/eventScheduling';

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  location: string;
  times: string[];
}

/** One arrangement per day, even when several shifts/signups share that day. */
export function calendarEventOccurrences(events: AdminEvent[]): CalendarEvent[] {
  const occurrences: CalendarEvent[] = [];
  for (const event of events) {
    if (!event.active) continue;
    const dates = new Map<string, Set<string>>();
    if (isValidIsoDate(event.eventDate)) dates.set(event.eventDate, new Set());
    for (const slot of event.slots) {
      // Preparation tasks and deadlines are not days of the arrangement itself.
      if (slot.componentType === 'task') continue;
      const slotDate = calculateSlotDate(event.eventDate, slot);
      const slotDates = slot.recurrenceMaterialized ? (slotDate ? [slotDate] : [])
        : slot.scheduleMode === 'weekly' || slot.scheduleMode === 'biweekly'
          ? calculateRecurringDates(slot) : slotDate ? [slotDate] : [];
      for (const date of slotDates) {
        const times = dates.get(date) ?? new Set<string>();
        if (slot.startTime) times.add([slot.startTime, slot.endTime].filter(Boolean).join('–'));
        dates.set(date, times);
      }
    }
    for (const [date, times] of dates) {
      occurrences.push({ id: event.id, date, title: event.title, location: event.location, times: [...times].sort() });
    }
  }
  return occurrences.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'da'));
}
