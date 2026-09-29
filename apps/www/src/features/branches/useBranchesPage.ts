import { computed, ref } from 'vue';

import { createBranchId, createRosterTeamId, formatBranchAgeRange, rosterBranches, rosterMembers, rosterTeams, saveRosterBranches, saveRosterMembers, saveRosterTeams } from '../roster/roster.data';
import type { Branch, BranchId, BranchMeetingDay } from '../roster/roster.types';
import type { BranchCard } from './branches.types';

const AGE_MIN = 0;
const AGE_MAX = 18;

export function useBranchesPage() {
  const mode = ref<'list' | 'form'>('list');
  const selectedBranchId = ref<BranchId>(rosterBranches[0]?.id ?? '');
  const draftLabel = ref('');
  const draftActive = ref(true);
  const draftMinAge = ref(8);
  const draftMaxAge = ref(11);
  const draftFocus = ref('');
  const draftMeetingSchedules = ref<BranchMeetingDay[]>([]);
  const draftSeasonStartDate = ref('');
  const draftSeasonEndDate = ref('');
  const draftError = ref('');
  const editingBranchId = ref<BranchId | null>(null);

  const branchCards = computed<BranchCard[]>(() =>
    rosterBranches.map(branch => ({
      ...branch,
      ageRangeLabel: formatBranchAgeRange(branch),
      memberCount: rosterMembers.filter(member => member.branchId === branch.id).length,
      statusLabel: branch.active ? 'Aktiv' : 'Skjult',
    })),
  );

  const selectedBranch = computed(() => branchCards.value.find(branch => branch.id === selectedBranchId.value) ?? branchCards.value[0] ?? null);
  const isEditing = computed(() => editingBranchId.value !== null);
  const isCreating = computed(() => mode.value === 'form' && editingBranchId.value === null);
  const formBranch = computed(() => {
    if (!editingBranchId.value) return null;
    return branchCards.value.find(branch => branch.id === editingBranchId.value) ?? null;
  });
  const draftLowerAge = computed(() => Math.min(draftMinAge.value, draftMaxAge.value));
  const draftUpperAge = computed(() => Math.max(draftMinAge.value, draftMaxAge.value));
  const draftMeetingDays = computed(() => draftMeetingSchedules.value.map(day => day.weekday).join(', '));
  const draftMinAgePercent = computed(() => ((draftLowerAge.value - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100);
  const draftMaxAgePercent = computed(() => ((draftUpperAge.value - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100);

  const branchMembers = computed(() =>
    rosterMembers
      .filter(member => member.branchId === selectedBranchId.value)
      .sort((a, b) => a.weekday.localeCompare(b.weekday, 'da') || a.name.localeCompare(b.name, 'da')),
  );

  function selectBranch(branchId: BranchId) {
    selectedBranchId.value = branchId;
  }

  function fillDraft(branch?: Branch | null) {
    draftLabel.value = branch?.label ?? '';
    draftActive.value = branch?.active ?? true;
    draftMinAge.value = Math.min(Math.max(branch?.minAge ?? 8, AGE_MIN), AGE_MAX);
    draftMaxAge.value = Math.min(Math.max(branch?.maxAge ?? 11, AGE_MIN), AGE_MAX);
    draftFocus.value = branch?.focus ?? '';
    draftMeetingSchedules.value = (branch?.meetingSchedules ?? branch?.meetingDays.map(weekday => ({ weekday, startTime: '', endTime: '' })) ?? []).map(day => ({ ...day }));
    draftSeasonStartDate.value = branch?.seasonStartDate ?? '';
    draftSeasonEndDate.value = branch?.seasonEndDate ?? '';
    draftError.value = '';
  }

  function startCreateBranch() {
    mode.value = 'form';
    editingBranchId.value = null;
    fillDraft();
  }

  function startEditBranch(branchId = selectedBranch.value?.id ?? '') {
    const branch = rosterBranches.find(item => item.id === branchId) ?? null;
    if (!branch) return;
    mode.value = 'form';
    editingBranchId.value = branch.id;
    selectedBranchId.value = branch.id;
    fillDraft(branch);
  }

  function cancelBranchEditing() {
    mode.value = 'list';
    editingBranchId.value = null;
    fillDraft(selectedBranch.value);
  }

  function saveBranch() {
    const label = draftLabel.value.trim();
    const active = draftActive.value;
    const minAge = Math.round(Math.min(Math.max(draftLowerAge.value, AGE_MIN), AGE_MAX));
    const maxAge = Math.round(Math.min(Math.max(draftUpperAge.value, AGE_MIN), AGE_MAX));
    const focus = draftFocus.value.trim();
    const meetingSchedules = draftMeetingSchedules.value.map(day => ({ weekday: day.weekday.trim(), startTime: day.startTime, endTime: day.endTime })).filter(day => day.weekday);
    const meetingDays = meetingSchedules.map(day => day.weekday);

    if (!label) {
      draftError.value = 'Skriv et navn på grenen.';
      return false;
    }
    if (!Number.isFinite(minAge) || !Number.isFinite(maxAge)) {
      draftError.value = 'Vælg et gyldigt aldersinterval.';
      return false;
    }
    if (!focus) {
      draftError.value = 'Skriv grenens fokus.';
      return false;
    }
    if (!meetingDays.length) {
      draftError.value = 'Tilføj mindst én mødedag.';
      return false;
    }
    if (new Set(meetingDays).size !== meetingDays.length) { draftError.value = 'En mødedag kan kun tilføjes én gang.'; return false; }
    if (meetingSchedules.some(day => !day.startTime || !day.endTime || day.endTime <= day.startTime)) { draftError.value = 'Vælg start- og sluttid for hver mødedag.'; return false; }
    if (!draftSeasonStartDate.value || !draftSeasonEndDate.value || draftSeasonEndDate.value < draftSeasonStartDate.value) { draftError.value = 'Vælg sæsonens start- og slutdato.'; return false; }

    if (editingBranchId.value) {
      const branch = rosterBranches.find(item => item.id === editingBranchId.value);
      if (!branch) {
        draftError.value = 'Grenen findes ikke længere.';
        return false;
      }
      branch.label = label;
      branch.active = active;
      branch.minAge = minAge;
      branch.maxAge = maxAge;
      branch.focus = focus;
      branch.meetingDays = meetingDays;
      branch.meetingSchedules = meetingSchedules;
      branch.seasonStartDate = draftSeasonStartDate.value;
      branch.seasonEndDate = draftSeasonEndDate.value;
      selectedBranchId.value = branch.id;
    } else {
      const branch: Branch = {
        id: createBranchId(label),
        label,
        active,
        minAge,
        maxAge,
        focus,
        meetingDays,
        meetingSchedules,
        seasonStartDate: draftSeasonStartDate.value,
        seasonEndDate: draftSeasonEndDate.value,
      };
      rosterBranches.unshift(branch);
      selectedBranchId.value = branch.id;
      editingBranchId.value = branch.id;
    }

    const branchId = selectedBranchId.value;
    const existingBranchTeams = rosterTeams.filter(team => team.branchId === branchId);
    for (const team of existingBranchTeams) {
      const matchingDay = meetingSchedules.find(day => day.weekday === team.weekday);
      if (!matchingDay) team.active = false;
    }
    for (const day of meetingSchedules) {
      const label = `${day.weekday}shold`;
      const team = rosterTeams.find(item => item.branchId === branchId && item.weekday === day.weekday)
        ?? rosterTeams.find(item => item.branchId === branchId && item.label.toLocaleLowerCase('da') === label.toLocaleLowerCase('da'));
      if (team) {
        const previousLabel = team.label;
        team.label = label;
        team.weekday = day.weekday;
        team.startTime = day.startTime;
        team.endTime = day.endTime;
        team.seasonStartDate = draftSeasonStartDate.value;
        team.seasonEndDate = draftSeasonEndDate.value;
        team.active = active;
        rosterMembers.forEach(member => {
          if (member.branchId === branchId && (member.team === previousLabel || member.weekday === day.weekday)) member.team = label;
        });
      } else {
        rosterTeams.push({
          id: createRosterTeamId(branchId, label), branchId, label, weekday: day.weekday,
          startTime: day.startTime, endTime: day.endTime,
          seasonStartDate: draftSeasonStartDate.value, seasonEndDate: draftSeasonEndDate.value, active,
        });
      }
    }
    saveRosterBranches();
    saveRosterTeams();
    saveRosterMembers();
    draftError.value = '';
    fillDraft(rosterBranches.find(branch => branch.id === selectedBranchId.value) ?? null);
    return true;
  }

  function addMeetingDay() {
    const weekdays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    const weekday = weekdays.find(day => !draftMeetingSchedules.value.some(item => item.weekday === day));
    if (weekday) draftMeetingSchedules.value.push({ weekday, startTime: '', endTime: '' });
  }
  function removeMeetingDay(index: number) { draftMeetingSchedules.value.splice(index, 1); }
  if (selectedBranch.value) {
    fillDraft(selectedBranch.value);
  }

  function setDraftMinAge(value: number) {
    if (!Number.isFinite(value)) return;
    draftMinAge.value = Math.min(Math.max(Math.round(value), AGE_MIN), AGE_MAX);
  }

  function setDraftMaxAge(value: number) {
    if (!Number.isFinite(value)) return;
    draftMaxAge.value = Math.min(Math.max(Math.round(value), AGE_MIN), AGE_MAX);
  }

  return {
    branchCards,
    branchMembers,
    cancelBranchEditing,
    draftActive,
    draftError,
    draftFocus,
    draftLabel,
    draftLowerAge,
    draftMaxAgePercent,
    draftMaxAge,
    draftMeetingDays,
    draftMeetingSchedules,
    draftSeasonStartDate,
    draftSeasonEndDate,
    draftMinAgePercent,
    draftMinAge,
    draftUpperAge,
    formBranch,
    isCreating,
    isEditing,
    mode,
    setDraftMaxAge,
    setDraftMinAge,
    sliderMaxAge: AGE_MAX,
    sliderMinAge: AGE_MIN,
    saveBranch,
    selectedBranch,
    selectBranch,
    selectedBranchId,
    startCreateBranch,
    startEditBranch,
    addMeetingDay,
    removeMeetingDay,
  };
}
