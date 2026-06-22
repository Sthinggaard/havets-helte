import { computed, ref } from 'vue';

import { rosterBranches, rosterMembers } from '../roster/roster.data';
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

  const branchOptions = computed(() => rosterBranches);

  const filteredMembers = computed(() => {
    const term = searchTerm.value.trim().toLowerCase();
    return rosterMembers
      .filter(member => statusFilter.value === 'all' || (statusFilter.value === 'active' ? member.active : !member.active))
      .filter(member => branchFilter.value === 'all' || member.branchId === branchFilter.value)
      .filter(member => !term || member.name.toLowerCase().includes(term))
      .map(toMemberProfile)
      .sort((a, b) => a.branchLabel.localeCompare(b.branchLabel, 'da') || a.name.localeCompare(b.name, 'da'));
  });

  const selectedMember = computed(() => filteredMembers.value.find(member => member.id === selectedMemberId.value) ?? filteredMembers.value[0] ?? null);

  const counts = computed(() => ({
    total: rosterMembers.length,
    active: rosterMembers.filter(member => member.active).length,
    inactive: rosterMembers.filter(member => !member.active).length,
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
    branchFilter.value = branchId;
  }

  return {
    branchFilter,
    branchOptions,
    counts,
    filteredMembers,
    searchTerm,
    selectedMember,
    selectedMemberId,
    selectMember,
    setBranchFilter,
    setStatusFilter,
    statusFilter,
    timeline,
  };
}
