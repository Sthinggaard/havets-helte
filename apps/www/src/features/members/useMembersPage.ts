import { computed, ref, watch } from 'vue';

import {
  buildMemberInitials,
  buildMemberTeam,
  createRosterMemberId,
  publicRosterBranches,
  rosterBranches,
  rosterMembers,
  saveRosterMembers,
} from '../roster/roster.data';
import type { BranchId } from '../roster/roster.types';
import type { MemberProfile, MemberStatusFilter } from './members.types';

function toMemberProfile(member: (typeof rosterMembers)[number]): MemberProfile {
  return {
    ...member,
    branchLabel: rosterBranches.find(branch => branch.id === member.branchId)?.label ?? member.branchId,
  };
}

export function useMembersPage() {
  const statusFilter = ref<MemberStatusFilter>('all');
  const branchFilter = ref<BranchId | 'all'>('all');
  const searchTerm = ref('');
  const selectedMemberId = ref(rosterMembers[0]?.id ?? '');
  const memberName = ref('');
  const memberBranchId = ref<BranchId>(publicRosterBranches.value[0]?.id ?? rosterBranches[0]?.id ?? 'junior');
  const memberWeekday = ref(publicRosterBranches.value[0]?.meetingDays[0] ?? rosterBranches[0]?.meetingDays[0] ?? 'Mandag');
  const memberBirthYear = ref(2015);
  const memberActive = ref(true);
  const memberError = ref('');

  const branchOptions = computed(() => publicRosterBranches.value);
  const memberWeekdayOptions = computed(() => branchOptions.value.find(branch => branch.id === memberBranchId.value)?.meetingDays ?? []);
  const visibleBranchIds = computed(() => new Set(branchOptions.value.map(branch => branch.id)));

  watch(
    memberBranchId,
    nextBranchId => {
      const nextWeekdays = branchOptions.value.find(branch => branch.id === nextBranchId)?.meetingDays ?? [];
      memberWeekday.value = nextWeekdays[0] ?? 'Mandag';
    },
    { immediate: true },
  );

  watch(
    branchOptions,
    branches => {
      if (!branches.length) return;

      if (!branches.some(branch => branch.id === memberBranchId.value)) {
        memberBranchId.value = branches[0].id;
      }

      if (branchFilter.value !== 'all' && !branches.some(branch => branch.id === branchFilter.value)) {
        branchFilter.value = 'all';
      }
    },
    { immediate: true },
  );

  watch(
    rosterMembers,
    members => {
      saveRosterMembers(members);
    },
    { deep: true },
  );

  const filteredMembers = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    return rosterMembers
      .filter(member => visibleBranchIds.value.has(member.branchId))
      .filter(member => statusFilter.value === 'all' || (statusFilter.value === 'active' ? member.active : !member.active))
      .filter(member => branchFilter.value === 'all' || member.branchId === branchFilter.value)
      .filter(member => !term || member.name.toLowerCase().includes(term))
      .map(toMemberProfile)
      .sort((a, b) => a.branchLabel.localeCompare(b.branchLabel, 'da') || a.name.localeCompare(b.name, 'da'));
  });

  const selectedMember = computed(() => filteredMembers.value.find(member => member.id === selectedMemberId.value) ?? filteredMembers.value[0] ?? null);

  const counts = computed(() => ({
    total: rosterMembers.filter(member => visibleBranchIds.value.has(member.branchId)).length,
    active: rosterMembers.filter(member => visibleBranchIds.value.has(member.branchId) && member.active).length,
    inactive: rosterMembers.filter(member => visibleBranchIds.value.has(member.branchId) && !member.active).length,
  }));

  const timeline = computed(() => [
    { label: 'Fødselsår', value: selectedMember.value ? String(selectedMember.value.birthYear) : 'Vælg et medlem' },
    { label: 'Gren', value: selectedMember.value?.branchLabel ?? 'Vælg et medlem' },
    { label: 'Hold', value: selectedMember.value?.team ?? 'Vælg et medlem' },
    { label: 'Mødedag', value: selectedMember.value?.weekday ?? 'Vælg et medlem' },
  ]);

  function selectMember(memberId: string) {
    selectedMemberId.value = memberId;
  }

  function setStatusFilter(filter: MemberStatusFilter) {
    statusFilter.value = filter;
  }

  function setBranchFilter(branchId: BranchId | 'all') {
    branchFilter.value = branchId === 'all' || visibleBranchIds.value.has(branchId) ? branchId : 'all';
  }

  function setMemberImage(memberId: string, imageUrl: string) {
    const member = rosterMembers.find(candidate => candidate.id === memberId);
    if (member) member.imageUrl = imageUrl;
  }

  function clearMemberImage(memberId: string) {
    const member = rosterMembers.find(candidate => candidate.id === memberId);
    if (member) member.imageUrl = undefined;
  }

  function resetMemberDraft() {
    memberName.value = '';
    memberActive.value = true;
    memberBirthYear.value = new Date().getFullYear() - 10;
    memberError.value = '';

    const nextWeekdays = branchOptions.value.find(branch => branch.id === memberBranchId.value)?.meetingDays ?? [];
    memberWeekday.value = nextWeekdays[0] ?? 'Mandag';
  }

  function createMember() {
    const name = memberName.value.trim();
    const branch = branchOptions.value.find(option => option.id === memberBranchId.value);
    const weekday = memberWeekday.value.trim();
    const birthYear = Number(memberBirthYear.value);

    if (!name) {
      memberError.value = 'Skriv et navn på medlemmet.';
      return false;
    }
    if (!branch) {
      memberError.value = 'Vælg en gren.';
      return false;
    }
    if (!weekday) {
      memberError.value = 'Vælg en mødedag.';
      return false;
    }
    if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > new Date().getFullYear()) {
      memberError.value = 'Angiv et gyldigt fødselsår.';
      return false;
    }

    const member = {
      id: createRosterMemberId(),
      name,
      initials: buildMemberInitials(name),
      imageUrl: undefined,
      branchId: branch.id,
      weekday,
      active: memberActive.value,
      birthYear,
      team: buildMemberTeam(weekday),
    };

    rosterMembers.unshift(member);
    selectedMemberId.value = member.id;
    branchFilter.value = branch.id;
    statusFilter.value = 'all';
    searchTerm.value = '';
    memberError.value = '';
    resetMemberDraft();
    return true;
  }

  return {
    branchFilter,
    branchOptions,
    clearMemberImage,
    createMember,
    counts,
    filteredMembers,
    memberActive,
    memberBirthYear,
    memberBranchId,
    memberError,
    memberName,
    memberWeekday,
    memberWeekdayOptions,
    searchTerm,
    selectedMember,
    selectedMemberId,
    selectMember,
    setBranchFilter,
    setMemberImage,
    setStatusFilter,
    statusFilter,
    timeline,
  };
}
