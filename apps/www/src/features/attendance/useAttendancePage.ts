import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { getAttendanceMeetings } from './attendance.data';
import { attendanceRecords, membersForMeeting, toggleRecordedArrival } from './attendance.records';
import { formatDateLong, formatDateShort, sameDate, toIsoDate } from './attendanceCalendar';
import { buildMemberInitials, publicRosterBranches, rosterBranches } from '../roster/roster.data';
import type { BranchId } from './attendance.types';

export function useAttendancePage() {
  const route = useRoute();
  const attendanceBranches = computed(() => publicRosterBranches.value);
  const visibleBranchIds = computed(() => new Set(attendanceBranches.value.map(branch => branch.id)));
  const requestedDate = computed(() => (typeof route.query.date === 'string' ? route.query.date : ''));
  const fallbackDate = toIsoDate(new Date());
  const selectedDate = computed(() => requestedDate.value || fallbackDate);
  const saveError = ref('');
  const searchTerm = ref('');

  const dayMeetings = computed(() =>
    getAttendanceMeetings(selectedDate.value)
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
    return membersForMeeting(meeting)
      .filter(member => !term || member.name.toLowerCase().includes(term))
      .map(member => ({ ...member, initials: buildMemberInitials(member.name) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  });

  const meetingSummary = computed(() => {
    const meeting = selectedMeeting.value;
    if (!meeting) return { arrived: 0, waiting: 0, total: 0 };
    const members = membersForMeeting(meeting);
    const arrived = members.filter(member => isArrived(meeting.id, member.id)).length;
    return {
      arrived,
      total: members.length,
      waiting: Math.max(members.length - arrived, 0),
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
    const meeting = getAttendanceMeetings(selectedDate.value).find(item => item.id === meetingId);
    if (!meeting) return;
    saveError.value = '';
    try { toggleRecordedArrival(meeting, memberId); }
    catch (error) { saveError.value = error instanceof Error ? error.message : 'Fremmødet kunne ikke gemmes.'; }
  }

  function branchLabel(branchId: BranchId) {
    return rosterBranches.find(branch => branch.id === branchId)?.label ?? branchId;
  }

  function isArrived(meetingId: string, memberId: string) {
    return attendanceRecords.find(record => record.meeting.id === meetingId)?.presentMemberIds.includes(memberId) ?? false;
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
    saveError,
    meetingCompleted: computed(() => !!attendanceRecords.find(record => record.meeting.id === selectedMeeting.value?.id)?.completedAt),
    searchTerm,
    selectedDate,
    selectedMeeting,
    selectMeeting,
    setSearchTerm,
    toggleArrival,
    toggleBranch,
  };
}
