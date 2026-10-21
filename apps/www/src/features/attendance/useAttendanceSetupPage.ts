import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchAllAdminEvents } from '../eventAdmin/eventAdmin.data';
import { calendarEventOccurrences, type CalendarEvent } from './attendance.events';

import { getAttendanceMeetings } from './attendance.data';
import type { Meeting } from './attendance.types';
import { fromIsoDate, formatDateLong, monthLabel, makeCalendarCells, toIsoDate } from './attendanceCalendar';

export function useAttendanceSetupPage(fetchEvents = fetchAllAdminEvents) {
  const router = useRouter();
  const todayIso = toIsoDate(new Date());
  const selectedDate = ref(todayIso);
  const currentYear = ref(fromIsoDate(selectedDate.value).getFullYear());
  const currentMonthIndex = ref(fromIsoDate(selectedDate.value).getMonth());

  const calendarEvents = ref<CalendarEvent[]>([]);
  const eventsLoading = ref(false);
  const eventsError = ref('');
  let eventsLoaded = false;

  async function loadCalendarEvents() {
    if (eventsLoaded || eventsLoading.value) return;
    eventsLoading.value = true;
    eventsError.value = '';
    try {
      calendarEvents.value = calendarEventOccurrences(await fetchEvents());
      eventsLoaded = true;
    } catch {
      eventsError.value = 'Arrangementerne kunne ikke hentes.';
    } finally {
      eventsLoading.value = false;
    }
  }

  const currentMonthLabel = computed(() => `${monthLabel(currentMonthIndex.value)} ${currentYear.value}`);
  const currentDateLabel = computed(() => formatDateLong(fromIsoDate(selectedDate.value)));
  const currentMonthCells = computed(() => makeCalendarCells(currentYear.value, currentMonthIndex.value));

  const eventsByDate = computed(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of calendarEvents.value) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  });
  const selectedDateEvents = computed(() => eventsByDate.value.get(selectedDate.value) ?? []);

  const meetingsByDate = computed(() => {
    const cells = currentMonthCells.value;
    const map = new Map<string, Meeting[]>();
    for (const meeting of getAttendanceMeetings(cells[0].isoDate, cells[cells.length - 1].isoDate)) {
      const list = map.get(meeting.date) ?? [];
      list.push(meeting);
      map.set(meeting.date, list);
    }
    return map;
  });

  const selectedDateMeetings = computed(() =>
    getAttendanceMeetings(selectedDate.value)
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time, 'da') || a.title.localeCompare(b.title, 'da')),
  );

  const selectedEntryId = ref('');
  const dayEntries = computed(() => [
    ...selectedDateMeetings.value.map(meeting => ({
      id: meeting.id, title: meeting.title,
      detail: [meeting.time, meeting.location].filter(Boolean).join(' · '),
      badge: `${meeting.capacity} medlemmer`,
      query: { date: meeting.date, meeting: meeting.id } as Record<string, string> | null,
    })),
    ...selectedDateEvents.value.flatMap(event => event.signups.length ? event.signups.map(slot => ({
      id: JSON.stringify([event.id, slot.id]), title: `${event.title} · ${slot.label}`,
      detail: slot.external ? 'Tilmeldinger håndteres i Medlemsservice.' : [slot.time, event.location].filter(Boolean).join(' · '),
      badge: 'Tilmeldte',
      query: slot.external ? null : { date: event.date, event: event.id, slot: slot.id } as Record<string, string>,
    })) : [{ id: event.id, title: event.title, detail: [event.times.join(' · '), event.location].filter(Boolean).join(' · '), badge: 'Arrangement', query: null }]),
  ]);
  const selectedEntry = computed(() => dayEntries.value.find(entry => entry.id === selectedEntryId.value && entry.query)
    ?? dayEntries.value.find(entry => entry.query));
  const canOpenAttendance = computed(() => !!selectedEntry.value);
  function selectEntry(id: string) { selectedEntryId.value = id; }

  function selectDate(isoDate: string) {
    selectedDate.value = isoDate;
    const date = fromIsoDate(isoDate);
    currentYear.value = date.getFullYear();
    currentMonthIndex.value = date.getMonth();
  }

  function shiftMonth(direction: number) {
    const date = new Date(currentYear.value, currentMonthIndex.value, 1);
    date.setMonth(date.getMonth() + direction);
    currentYear.value = date.getFullYear();
    currentMonthIndex.value = date.getMonth();
  }

  function openAttendance() {
    if (!selectedEntry.value?.query) return;
    return router.push({ path: '/attendance', query: selectedEntry.value.query });
  }

  return {
    dayEntries,
    selectedEntry,
    selectEntry,
    canOpenAttendance,
    eventsByDate,
    eventsError,
    eventsLoading,
    loadCalendarEvents,
    selectedDateEvents,
    currentDateLabel,
    currentMonthCells,
    currentMonthLabel,
    meetingsByDate,
    openAttendance,
    selectedDate,
    selectedDateMeetings,
    selectDate,
    shiftMonth,
    todayIso,
  };
}
