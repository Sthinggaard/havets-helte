import { computed, ref } from 'vue';

import { createBranchId, formatBranchAgeRange, rosterBranches, rosterMembers, saveRosterBranches } from '../roster/roster.data';
import type { Branch, BranchId } from '../roster/roster.types';
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
  const draftMeetingDays = ref('');
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
    draftMeetingDays.value = branch?.meetingDays.join(', ') ?? '';
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
    const meetingDays = draftMeetingDays.value
      .split(',')
      .map(day => day.trim())
      .filter(Boolean);

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
      };
      rosterBranches.unshift(branch);
      selectedBranchId.value = branch.id;
      editingBranchId.value = branch.id;
    }

    saveRosterBranches();
    draftError.value = '';
    fillDraft(rosterBranches.find(branch => branch.id === selectedBranchId.value) ?? null);
    return true;
  }

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
  };
}
