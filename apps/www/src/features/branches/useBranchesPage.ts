import { computed, ref } from 'vue';

import { rosterBranches, rosterMembers } from '../roster/roster.data';
import type { BranchId } from '../roster/roster.types';
import type { BranchCard } from './branches.types';

export function useBranchesPage() {
  const selectedBranchId = ref<BranchId>(rosterBranches[0]?.id ?? 'junior');

  const branchCards = computed<BranchCard[]>(() =>
    rosterBranches.map(branch => ({
      ...branch,
      memberCount: rosterMembers.filter(member => member.branchId === branch.id).length,
    })),
  );

  const selectedBranch = computed(() => branchCards.value.find(branch => branch.id === selectedBranchId.value) ?? branchCards.value[0] ?? null);

  const branchMembers = computed(() =>
    rosterMembers
      .filter(member => member.branchId === selectedBranchId.value)
      .sort((a, b) => a.weekday.localeCompare(b.weekday, 'da') || a.name.localeCompare(b.name, 'da')),
  );

  function selectBranch(branchId: BranchId) {
    selectedBranchId.value = branchId;
  }

  return {
    branchCards,
    branchMembers,
    selectedBranch,
    selectBranch,
    selectedBranchId,
  };
}
