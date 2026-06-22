import { computed, ref } from 'vue';

import {
  attendanceBranches,
  attendanceMeetings,
  attendanceMembers,
  seedAttendance,
} from './attendance.data';
import type { AttendanceViewMode, BranchId, Meeting } from './attendance.types';

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

function sameDate(a: string, b: string) {
  return a === b;
}

function formatDateLong(date: Date) {
  return date.toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString('da-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function monthLabel(monthIndex: number) {
  return new Date(2026, monthIndex, 1)
    .toLocaleDateString('da-DK', { month: 'long' })
    .replace(/^./, char => char.toUpperCase());
}

function makeCalendarCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const start = getStartOfWeek(first);
  const last = new Date(year, monthIndex + 1, 0);
  const end = addDays(getStartOfWeek(last), 6);
  const cells: Array<{ date: Date; isoDate: string; inMonth: boolean }> = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    cells.push({
      date: new Date(cursor),
      isoDate: toIsoDate(cursor),
      inMonth: cursor.getMonth() === monthIndex,
    });
  }
  return cells;
}

function makeWeekCells(anchorDate: Date) {
  const start = getStartOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      isoDate: toIsoDate(date),
    };
  });
}

function makeMonthCards(year: number) {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const cells = makeCalendarCells(year, monthIndex);
    return {
      monthIndex,
      title: monthLabel(monthIndex),
      cells,
    };
  });
}

export function useAttendancePage() {
  const viewMode = ref<AttendanceViewMode>('day');
  const todayIso = toIsoDate(new Date());
  const selectedDate = ref(
    attendanceMeetings.find(meeting => sameDate(meeting.date, todayIso))?.date
      ?? attendanceMeetings[0]?.date
      ?? todayIso,
  );
  const activeBranchIds = ref<BranchId[]>(attendanceBranches.map(branch => branch.id));
  const searchTerm = ref('');
  const selectedMeetingId = ref(
    attendanceMeetings.find(meeting => sameDate(meeting.date, selectedDate.value))?.id
      ?? attendanceMeetings[0]?.id
      ?? '',
  );
  const currentYear = ref(fromIsoDate(selectedDate.value).getFullYear());
  const currentMonthIndex = ref(fromIsoDate(selectedDate.value).getMonth());
  const attendanceMap = ref<Record<string, string[]>>({ ...seedAttendance });

  const selectedDateMeetings = computed(() =>
    attendanceMeetings
      .filter(meeting => sameDate(meeting.date, selectedDate.value))
      .filter(meeting => activeBranchIds.value.includes(meeting.branchId))
      .sort((a, b) => a.time.localeCompare(b.time, 'da') || a.title.localeCompare(b.title, 'da')),
  );

  const selectedMeeting = computed(
    () =>
      selectedDateMeetings.value.find(meeting => meeting.id === selectedMeetingId.value)
      ?? selectedDateMeetings.value[0]
      ?? null,
  );

  const selectedMeetingArrivedIds = computed(
    () => new Set(attendanceMap.value[selectedMeeting.value?.id ?? ''] ?? []),
  );

  const filteredMembers = computed(() => {
    const meeting = selectedMeeting.value;
    if (!meeting) return [];
    const term = searchTerm.value.trim().toLowerCase();
    return attendanceMembers
      .filter(member => member.active)
      .filter(member => member.branchId === meeting.branchId)
      .filter(member => !term || member.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  });

  const meetingSummary = computed(() => {
    const meeting = selectedMeeting.value;
    if (!meeting) return { arrived: 0, waiting: 0 };
    const arrived = filteredMembers.value.filter(member => selectedMeetingArrivedIds.value.has(member.id)).length;
    return {
      arrived,
      waiting: Math.max(filteredMembers.value.length - arrived, 0),
    };
  });

  const currentDateLabel = computed(() => formatDateLong(fromIsoDate(selectedDate.value)));
  const currentDateShortLabel = computed(() => formatDateShort(fromIsoDate(selectedDate.value)));
  const currentMonthLabel = computed(() => `${monthLabel(currentMonthIndex.value)} ${currentYear.value}`);
  const currentWeekCells = computed(() => makeWeekCells(fromIsoDate(selectedDate.value)));
  const currentMonthCells = computed(() => makeCalendarCells(currentYear.value, currentMonthIndex.value));
  const yearCards = computed(() => makeMonthCards(currentYear.value));

  const meetingsByDate = computed(() => {
    const map = new Map<string, Meeting[]>();
    for (const meeting of attendanceMeetings) {
      const list = map.get(meeting.date) ?? [];
      list.push(meeting);
      map.set(meeting.date, list);
    }
    return map;
  });

  function setViewMode(mode: AttendanceViewMode) {
    viewMode.value = mode;
  }

  function selectDate(isoDate: string) {
    selectedDate.value = isoDate;
    const firstMeeting = attendanceMeetings.find(meeting => sameDate(meeting.date, isoDate));
    if (firstMeeting) {
      selectedMeetingId.value = firstMeeting.id;
    }
    const date = fromIsoDate(isoDate);
    currentYear.value = date.getFullYear();
    currentMonthIndex.value = date.getMonth();
  }

  function selectMeeting(meetingId: string) {
    selectedMeetingId.value = meetingId;
  }

  function shiftSelection(direction: number) {
    const date = fromIsoDate(selectedDate.value);
    if (viewMode.value === 'year') {
      currentYear.value += direction;
      return;
    }
    if (viewMode.value === 'month') {
      date.setMonth(date.getMonth() + direction);
    } else if (viewMode.value === 'week') {
      date.setDate(date.getDate() + direction * 7);
    } else {
      date.setDate(date.getDate() + direction);
    }
    selectDate(toIsoDate(date));
  }

  function toggleBranch(branchId: BranchId) {
    if (activeBranchIds.value.includes(branchId)) {
      activeBranchIds.value = activeBranchIds.value.filter(id => id !== branchId);
      if (!activeBranchIds.value.length) {
        activeBranchIds.value = attendanceBranches.map(branch => branch.id);
      }
      return;
    }
    activeBranchIds.value = [...activeBranchIds.value, branchId];
  }

  function setSearchTerm(value: string) {
    searchTerm.value = value;
  }

  function toggleArrival(meetingId: string, memberId: string) {
    const current = attendanceMap.value[meetingId] ?? [];
    attendanceMap.value = {
      ...attendanceMap.value,
      [meetingId]: current.includes(memberId)
        ? current.filter(id => id !== memberId)
        : [...current, memberId],
    };
  }

  function branchLabel(branchId: BranchId) {
    return attendanceBranches.find(branch => branch.id === branchId)?.label ?? branchId;
  }

  function meetingMembers(meetingId: string) {
    const meeting = attendanceMeetings.find(item => item.id === meetingId);
    if (!meeting) return [];
    const arrived = new Set(attendanceMap.value[meetingId] ?? []);
    const term = searchTerm.value.trim().toLowerCase();
    return attendanceMembers
      .filter(member => member.active)
      .filter(member => member.branchId === meeting.branchId)
      .filter(member => !term || member.name.toLowerCase().includes(term))
      .map(member => ({
        ...member,
        arrived: arrived.has(member.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  }

  return {
    attendanceBranches,
    activeBranchIds,
    currentDateLabel,
    currentDateShortLabel,
    currentMonthCells,
    currentMonthLabel,
    currentWeekCells,
    currentYear,
    dayMeetings: selectedDateMeetings,
    filteredMembers,
    meetingMembers,
    meetingSummary,
    meetingsByDate,
    selectedDate,
    selectedMeeting,
    selectedMeetingId,
    selectDate,
    selectMeeting,
    searchTerm,
    setSearchTerm,
    setViewMode,
    shiftSelection,
    toggleArrival,
    toggleBranch,
    isBranchActive: (branchId: BranchId) => activeBranchIds.value.includes(branchId),
    viewMode,
    yearCards,
    branchLabel,
  };
}
