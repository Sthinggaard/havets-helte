import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { isValidIsoDate } from '../eventAdmin/eventScheduling';
import { fetchAllAdminEvents } from '../eventAdmin/eventAdmin.data';
import { calendarEventOccurrences, type CalendarEvent } from './attendance.events';

import { rosterBranches, rosterMembers, rosterTeams } from '../roster/roster.data';
import { attendanceRecords } from './attendance.records';
import { getAttendanceMeetings } from './attendance.data';
import type { Meeting } from './attendance.types';
import { addDays, getStartOfWeek, isoWeekNumber, fromIsoDate, formatDateLong, formatDateShort, monthLabel, makeCalendarCells, toIsoDate } from './attendanceCalendar';

export function useAttendanceSetupPage(fetchEvents = fetchAllAdminEvents) {
  const router = useRouter();
  const todayIso = toIsoDate(new Date());
  const selectedDate = ref(todayIso);
  const currentYear = ref(fromIsoDate(selectedDate.value).getFullYear());
  const currentMonthIndex = ref(fromIsoDate(selectedDate.value).getMonth());

  const calendarView = ref<'month' | 'week' | 'day'>('month');
  const calendarEvents = ref<CalendarEvent[]>([]);
  const eventsLoading = ref(false);
  const eventsError = ref('');
  let eventsLoaded = false;

  async function loadCalendarEvents() {
    if (eventsLoaded || eventsLoading.value) return;
    eventsLoading.value = true;
    eventsError.value = '';
    try {
      calendarEvents.value = calendarEventOccurrences((await fetchEvents()).filter(event => isValidIsoDate(event.eventDate)));
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

  const visibleCalendarCells = computed(() => {
    if (calendarView.value === 'month') return currentMonthCells.value;
    const date = fromIsoDate(selectedDate.value);
    const start = calendarView.value === 'week' ? getStartOfWeek(date) : date;
    return Array.from({ length: calendarView.value === 'week' ? 7 : 1 }, (_, index) => {
      const day = addDays(start, index);
      return { date: day, isoDate: toIsoDate(day), inMonth: true };
    });
  });
  const calendarPeriodLabel = computed(() => {
    if (calendarView.value === 'month') return currentMonthLabel.value;
    if (calendarView.value === 'day') return currentDateLabel.value;
    const cells = visibleCalendarCells.value;
    const first = cells[0].date;
    const last = cells[6].date;
    return `Uge ${isoWeekNumber(first)} · ${formatDateShort(first)} ${first.getFullYear()} – ${formatDateShort(last)} ${last.getFullYear()}`;
  });
  const periodUnit = computed(() => calendarView.value === 'month' ? 'måned' : calendarView.value === 'week' ? 'uge' : 'dag');
  function setCalendarView(value: 'month' | 'week' | 'day') {
    calendarView.value = value;
    selectDate(selectedDate.value);
  }
  function shiftPeriod(direction: number) {
    if (calendarView.value !== 'month') {
      selectDate(toIsoDate(addDays(fromIsoDate(selectedDate.value), direction * (calendarView.value === 'week' ? 7 : 1))));
      return;
    }
    const oldDay = fromIsoDate(selectedDate.value).getDate();
    shiftMonth(direction);
    const lastDay = new Date(currentYear.value, currentMonthIndex.value + 1, 0).getDate();
    selectDate(toIsoDate(new Date(currentYear.value, currentMonthIndex.value, Math.min(oldDay, lastDay))));
  }

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
    const cells = visibleCalendarCells.value;
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

  const calendarSummary = computed(() => {
    const dates = visibleCalendarCells.value.filter(cell => cell.inMonth);
    return {
      members: rosterMembers.filter(member => member.active).length,
      teams: rosterTeams.filter(team => team.active && rosterBranches.some(branch => branch.id === team.branchId && branch.active)).length,
      events: new Set(calendarEvents.value.filter(event => event.date >= dates[0].isoDate && event.date <= dates[dates.length - 1].isoDate).map(event => event.id)).size,
    };
  });
  const calendarActivitiesByDate = computed(() => new Map(visibleCalendarCells.value.map(cell => [cell.isoDate, [
    ...(meetingsByDate.value.get(cell.isoDate) ?? []).map(meeting => ({
      id: meeting.id, kind: 'team', title: meeting.title,
      label: [rosterBranches.find(branch => branch.id === meeting.branchId)?.label ?? meeting.title, meeting.time.split('–')[0]].filter(Boolean).join(' '),
    })),
    ...(eventsByDate.value.get(cell.isoDate) ?? []).map(event => ({ id: `event:${event.id}`, kind: 'event', title: event.title, label: event.title })),
  ]])));
  const nextEvent = computed(() => calendarEvents.value.find(event => event.date >= todayIso) ?? null);
  const recentRecords = computed(() => attendanceRecords.slice().sort((a, b) => b.meeting.date.localeCompare(a.meeting.date)
    || (b.completedAt ?? '').localeCompare(a.completedAt ?? '')).slice(0, 5));

  const selectedEntryId = ref('');
  function entriesForDate(date: string) {
    return [
    ...(meetingsByDate.value.get(date) ?? []).map(meeting => ({
      id: meeting.id, title: meeting.title,
      detail: [meeting.time, meeting.location].filter(Boolean).join(' · '),
      badge: `${meeting.capacity} medlemmer`,
      query: { date: meeting.date, meeting: meeting.id } as Record<string, string> | null,
    })),
    ...(eventsByDate.value.get(date) ?? []).flatMap(event => event.signups.length ? event.signups.map(slot => ({
      id: JSON.stringify([event.id, slot.id]), title: `${event.title} · ${slot.label}`,
      detail: slot.external ? 'Tilmeldinger håndteres i Medlemsservice.' : [slot.time, event.location].filter(Boolean).join(' · '),
      badge: 'Tilmeldte',
      query: slot.external ? null : { date: event.date, event: event.id, slot: slot.id } as Record<string, string>,
    })) : [{ id: event.id, title: event.title, detail: [event.times.join(' · '), event.location].filter(Boolean).join(' · '), badge: 'Arrangement', query: null }]),
    ];
  }
  const dayEntries = computed(() => entriesForDate(selectedDate.value));
  const weekEntriesByDate = computed(() => new Map(visibleCalendarCells.value.map(cell => [cell.isoDate, entriesForDate(cell.isoDate)])));
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
    calendarSummary,
    calendarActivitiesByDate,
    nextEvent,
    recentRecords,
    calendarView,
    setCalendarView,
    calendarPeriodLabel,
    periodUnit,
    shiftPeriod,
    visibleCalendarCells,
    weekEntriesByDate,
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
