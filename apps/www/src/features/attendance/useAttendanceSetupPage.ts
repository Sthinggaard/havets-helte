import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getAttendanceMeetings } from './attendance.data';
import type { Meeting } from './attendance.types';
import { fromIsoDate, formatDateLong, monthLabel, makeCalendarCells, toIsoDate } from './attendanceCalendar';

export function useAttendanceSetupPage() {
  const router = useRouter();
  const todayIso = toIsoDate(new Date());
  const selectedDate = ref(todayIso);
  const currentYear = ref(fromIsoDate(selectedDate.value).getFullYear());
  const currentMonthIndex = ref(fromIsoDate(selectedDate.value).getMonth());

  const currentMonthLabel = computed(() => `${monthLabel(currentMonthIndex.value)} ${currentYear.value}`);
  const currentDateLabel = computed(() => formatDateLong(fromIsoDate(selectedDate.value)));
  const currentMonthCells = computed(() => makeCalendarCells(currentYear.value, currentMonthIndex.value));

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
    return router.push({
      path: '/attendance',
      query: { date: selectedDate.value },
    });
  }

  return {
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
