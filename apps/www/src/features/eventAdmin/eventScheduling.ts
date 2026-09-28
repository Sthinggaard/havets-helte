import type { EventSlot } from './eventAdmin.types';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Returns the effective calendar date for a slot.
 *
 * Dates are treated as date-only values. UTC-backed calendar arithmetic keeps
 * daylight-saving changes from moving a Copenhagen date to its neighbour.
 */
export function calculateSlotDate(eventDate: string | undefined, slot: Pick<EventSlot, 'date' | 'scheduleMode' | 'offsetDays'>): string | undefined {
  if (isValidIsoDate(slot.date)) return slot.date;
  if (slot.scheduleMode !== 'relative' || !isValidIsoDate(eventDate)) return undefined;

  const offsetDays = slot.offsetDays ?? 0;
  if (!Number.isInteger(offsetDays)) return undefined;

  const [year, month, day] = eventDate.split('-').map(Number);
  const calculated = new Date(Date.UTC(year, month - 1, day + offsetDays));
  if (Number.isNaN(calculated.getTime())) return undefined;

  return [
    calculated.getUTCFullYear(),
    String(calculated.getUTCMonth() + 1).padStart(2, '0'),
    String(calculated.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function calculateSlotDeadline(eventDate: string | undefined, slot: Pick<EventSlot, 'deadlineDate' | 'deadlineScheduleMode' | 'deadlineOffsetDays'>): string | undefined {
  return calculateSlotDate(eventDate, {
    date: slot.deadlineDate ?? '',
    scheduleMode: slot.deadlineScheduleMode,
    offsetDays: slot.deadlineOffsetDays,
  });
}

export function isValidIsoDate(value: string | undefined): value is string {
  if (!value) return false;
  const match = value.match(ISO_DATE_PATTERN);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function calculateRecurringDates(slot: Pick<EventSlot, 'scheduleMode' | 'recurrenceWeekday' | 'recurrenceStartDate' | 'recurrenceEndDate'>): string[] {
  if (slot.scheduleMode !== 'weekly' && slot.scheduleMode !== 'biweekly') return [];
  if (!isValidIsoDate(slot.recurrenceStartDate) || !isValidIsoDate(slot.recurrenceEndDate)) return [];
  const weekday = slot.recurrenceWeekday;
  if (typeof weekday !== 'number' || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) return [];

  const start = toUtcDate(slot.recurrenceStartDate);
  const end = toUtcDate(slot.recurrenceEndDate);
  const first = new Date(start);
  const daysUntilWeekday = (weekday - first.getUTCDay() + 7) % 7;
  first.setUTCDate(first.getUTCDate() + daysUntilWeekday);
  const stepDays = slot.scheduleMode === 'biweekly' ? 14 : 7;
  const dates: string[] = [];
  for (const cursor = first; cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + stepDays)) {
    dates.push(toIsoDate(cursor));
  }
  return dates;
}

function toUtcDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(value: Date): string {
  return [value.getUTCFullYear(), String(value.getUTCMonth() + 1).padStart(2, '0'), String(value.getUTCDate()).padStart(2, '0')].join('-');
}
