import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { fetchSignupAttendance } from './attendance.signups';
import { getAttendanceMeetings } from './attendance.data';
import { attendanceRecords, membersForMeeting, toggleRecordedArrival } from './attendance.records';
import { formatDateLong, formatDateShort, sameDate, toIsoDate } from './attendanceCalendar';
import { buildMemberInitials, publicRosterBranches, rosterBranches } from '../roster/roster.data';
import type { AttendanceRecord, BranchId, Meeting } from './attendance.types';

export function useAttendancePage(loadSignupAttendance = fetchSignupAttendance) {
  const route = useRoute();
  const attendanceBranches = computed(() => publicRosterBranches.value);
  const visibleBranchIds = computed(() => new Set(attendanceBranches.value.map(branch => branch.id)));
  const requestedDate = computed(() => (typeof route.query.date === 'string' ? route.query.date : ''));
  const fallbackDate = toIsoDate(new Date());
  const selectedDate = computed(() => requestedDate.value || fallbackDate);
  const saveError = ref('');
  const searchTerm = ref('');
  const requestedEvent = computed(() => typeof route.query.event === 'string' ? route.query.event : '');
  const requestedSlot = computed(() => typeof route.query.slot === 'string' ? route.query.slot : '');
  const isSignupAttendance = computed(() => Boolean(requestedEvent.value || requestedSlot.value));
  const signupTarget = ref<{meeting: Meeting; expectedMembers: AttendanceRecord['expectedMembers']} | null>(null);
  const loading = ref(false);
  const loadError = ref('');
  const loadVersion = ref(0);
  function retryLoad() { loadVersion.value++; }
  watch([requestedEvent, requestedSlot, selectedDate, loadVersion], async ([eventId, slotId, date], _, onCleanup) => {
    let stale = false;
    onCleanup(() => { stale = true; });
    signupTarget.value = null;
    loadError.value = '';
    saveError.value = '';
    searchTerm.value = '';
    loading.value = false;
    if (!isSignupAttendance.value) return;
    loading.value = true;
    try {
      const target = await loadSignupAttendance(String(eventId), String(slotId), String(date));
      if (!stale) signupTarget.value = target;
    } catch (error) {
      if (!stale) loadError.value = error instanceof Error ? error.message : 'De tilmeldte kunne ikke hentes. Prøv igen.';
    } finally { if (!stale) loading.value = false; }
  }, { immediate: true });

  function meetingMembers(meeting: Meeting) {
    if (meeting.source !== 'signup') return membersForMeeting(meeting);
    const saved = attendanceRecords.find(record => record.meeting.id === meeting.id);
    return saved?.completedAt ? saved.expectedMembers : signupTarget.value?.expectedMembers ?? [];
  }

  const dayMeetings = computed(() => isSignupAttendance.value
    ? signupTarget.value ? [signupTarget.value.meeting] : []
    : getAttendanceMeetings(selectedDate.value)
      .filter(meeting => visibleBranchIds.value.has(meeting.branchId))
      .filter(meeting => sameDate(meeting.date, selectedDate.value))
      .sort((a, b) => a.time.localeCompare(b.time, 'da') || a.title.localeCompare(b.title, 'da')),
  );

  const availableBranchIds = computed(() => Array.from(new Set(dayMeetings.value.map(meeting => meeting.branchId))));
  const activeBranchIds = ref<BranchId[]>([]);
  const selectedMeetingId = ref(typeof route.query.meeting === 'string' ? route.query.meeting : '');

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
    return meetingMembers(meeting)
      .filter(member => !term || member.name.toLowerCase().includes(term))
      .map(member => ({ ...member, initials: buildMemberInitials(member.name) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  });

  const meetingSummary = computed(() => {
    const meeting = selectedMeeting.value;
    if (!meeting) return { arrived: 0, waiting: 0, total: 0 };
    const members = meetingMembers(meeting);
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
    const meeting = dayMeetings.value.find(item => item.id === meetingId);
    if (!meeting) return;
    saveError.value = '';
    try { toggleRecordedArrival(meeting, memberId, meeting.source === 'signup' ? meetingMembers(meeting) : undefined); }
    catch (error) { saveError.value = error instanceof Error ? error.message : 'Fremmødet kunne ikke gemmes.'; }
  }

  function branchLabel(branchId: BranchId) {
    return rosterBranches.find(branch => branch.id === branchId)?.label ?? branchId;
  }

  function isArrived(meetingId: string, memberId: string) {
    return attendanceRecords.find(record => record.meeting.id === meetingId)?.presentMemberIds.includes(memberId) ?? false;
  }

  return {
    isSignupAttendance,
    loading,
    loadError,
    retryLoad,
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
