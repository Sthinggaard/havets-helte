import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { attendanceMeetings, attendanceMembers, seedAttendance } from './attendance.data';
import { formatDateLong, formatDateShort, sameDate, toIsoDate } from './attendanceCalendar';
import { publicRosterBranches, rosterBranches } from '../roster/roster.data';
import type { BranchId } from './attendance.types';

export function useAttendancePage() {
  const route = useRoute();
  const attendanceBranches = computed(() => publicRosterBranches.value);
  const visibleBranchIds = computed(() => new Set(attendanceBranches.value.map(branch => branch.id)));
  const requestedDate = computed(() => (typeof route.query.date === 'string' ? route.query.date : ''));
  const fallbackDate = toIsoDate(new Date());
  const selectedDate = computed(() => requestedDate.value || fallbackDate);
  const attendanceMap = ref<Record<string, string[]>>({ ...seedAttendance });
  const searchTerm = ref('');

  const dayMeetings = computed(() =>
    attendanceMeetings
      .filter(meeting => visibleBranchIds.value.has(meeting.branchId))
      .filter(meeting => sameDate(meeting.date, selectedDate.value))
      .sort((a, b) => a.time.localeCompare(b.time, 'da') || a.title.localeCompare(b.title, 'da')),
  );

  const availableBranchIds = computed(() => Array.from(new Set(dayMeetings.value.map(meeting => meeting.branchId))));
  const activeBranchIds = ref<BranchId[]>([]);
  const selectedMeetingId = ref('');

  watch(
    availableBranchIds,
    branchIds => {
      const nextActive = activeBranchIds.value.filter(id => branchIds.includes(id));
      activeBranchIds.value = nextActive.length ? nextActive : [...branchIds];
    },
    { immediate: true },
  );

  watch(
    dayMeetings,
    meetings => {
      if (meetings.some(meeting => meeting.id === selectedMeetingId.value)) return;
      selectedMeetingId.value = meetings[0]?.id ?? '';
    },
    { immediate: true },
  );

  const filteredMeetings = computed(() => dayMeetings.value.filter(meeting => activeBranchIds.value.includes(meeting.branchId)));

  const selectedMeeting = computed(
    () => filteredMeetings.value.find(meeting => meeting.id === selectedMeetingId.value) ?? filteredMeetings.value[0] ?? null,
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
    const arrived = filteredMembers.value.filter(member => isArrived(meeting.id, member.id)).length;
    return {
      arrived,
      waiting: Math.max(filteredMembers.value.length - arrived, 0),
    };
  });

  const hasRequestedDate = computed(() => Boolean(requestedDate.value));
  const currentDateLabel = computed(() => formatDateLong(new Date(`${selectedDate.value}T12:00:00`)));
  const currentDateShortLabel = computed(() => formatDateShort(new Date(`${selectedDate.value}T12:00:00`)));

  function selectMeeting(meetingId: string) {
    selectedMeetingId.value = meetingId;
  }

  function toggleBranch(branchId: BranchId) {
    if (activeBranchIds.value.includes(branchId)) {
      activeBranchIds.value = activeBranchIds.value.filter(id => id !== branchId);
      if (!activeBranchIds.value.length) {
        activeBranchIds.value = [...availableBranchIds.value];
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
    return rosterBranches.find(branch => branch.id === branchId)?.label ?? branchId;
  }

  function isArrived(meetingId: string, memberId: string) {
    return (attendanceMap.value[meetingId] ?? []).includes(memberId);
  }

  return {
    attendanceBranches,
    branchLabel,
    currentDateLabel,
    currentDateShortLabel,
    dayMeetings: filteredMeetings,
    filteredMembers,
    hasRequestedDate,
    isArrived,
    isBranchActive: (branchId: BranchId) => activeBranchIds.value.includes(branchId),
    meetingSummary,
    searchTerm,
    selectedDate,
    selectedMeeting,
    selectMeeting,
    setSearchTerm,
    toggleArrival,
    toggleBranch,
  };
}
