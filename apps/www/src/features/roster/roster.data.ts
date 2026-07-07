import { computed, reactive } from 'vue';

import type { Branch, Member, BranchId } from './roster.types';

const rosterBranchStorageKey = 'sankthans.rosterBranches.v1';
const rosterStorageKey = 'sankthans.rosterMembers.v1';

const defaultRosterBranches: Branch[] = [
  {
    id: 'junior',
    label: 'Junior',
    active: true,
    minAge: 8,
    maxAge: 11,
    focus: 'Færdigheder, lege og små ture',
    meetingDays: ['Tirsdag'],
  },
  {
    id: 'ulv',
    label: 'Ulv',
    active: true,
    minAge: 7,
    maxAge: 9,
    focus: 'Tryg ramme, leg og gode vaner',
    meetingDays: ['Mandag'],
  },
  {
    id: 'trop',
    label: 'Trop',
    active: true,
    minAge: 12,
    maxAge: 15,
    focus: 'Mere ansvar, projekt og sejlsport',
    meetingDays: ['Onsdag'],
  },
  {
    id: 'soespejder',
    label: 'Søspejder',
    active: true,
    minAge: 16,
    maxAge: 18,
    focus: 'Båd, træning og ledelse ombord',
    meetingDays: ['Torsdag'],
  },
];

const defaultRosterMembers: Member[] = [
  { id: 'm1', name: 'Albert Boye Dohm Overgaard', initials: 'AB', branchId: 'junior', weekday: 'Tirsdag', active: true, birthYear: 2015, team: 'Tirsdagshold' },
  { id: 'm2', name: 'Aviaja Henriksson Lagoni', initials: 'AH', branchId: 'junior', weekday: 'Tirsdag', active: true, birthYear: 2015, team: 'Tirsdagshold' },
  { id: 'm3', name: 'Isabella Julie Bæk Jakobsen', initials: 'IJ', branchId: 'junior', weekday: 'Tirsdag', active: true, birthYear: 2014, team: 'Tirsdagshold' },
  { id: 'm4', name: 'León Haag Montiveros', initials: 'LH', branchId: 'junior', weekday: 'Tirsdag', active: true, birthYear: 2014, team: 'Tirsdagshold' },
  { id: 'm5', name: 'Noah Skovgaard', initials: 'NS', branchId: 'ulv', weekday: 'Mandag', active: true, birthYear: 2016, team: 'Mandagshold' },
  { id: 'm6', name: 'Maja Bennedsen', initials: 'MB', branchId: 'ulv', weekday: 'Mandag', active: true, birthYear: 2016, team: 'Mandagshold' },
  { id: 'm7', name: 'Freja Lund', initials: 'FL', branchId: 'trop', weekday: 'Onsdag', active: true, birthYear: 2012, team: 'Onsdagshold' },
  { id: 'm8', name: 'Emil Østergaard', initials: 'EO', branchId: 'trop', weekday: 'Onsdag', active: true, birthYear: 2011, team: 'Onsdagshold' },
  { id: 'm9', name: 'Sofie Hartvig', initials: 'SH', branchId: 'soespejder', weekday: 'Torsdag', active: true, birthYear: 2008, team: 'Torsdagshold' },
  { id: 'm10', name: 'Mikael Jørgensen', initials: 'MJ', branchId: 'soespejder', weekday: 'Torsdag', active: true, birthYear: 2007, team: 'Torsdagshold' },
];

function isBranchId(value: unknown, branches: Branch[]): value is BranchId {
  return typeof value === 'string' && branches.some(branch => branch.id === value);
}

function memberInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return letters || 'MH';
}

function memberTeam(weekday: string) {
  return `${weekday}shold`;
}

function cloneDefaults(): Member[] {
  return defaultRosterMembers.map(member => ({ ...member }));
}

function cloneDefaultBranches(): Branch[] {
  return defaultRosterBranches.map(branch => ({ ...branch, meetingDays: [...branch.meetingDays] }));
}

function parseLegacyAgeRange(ageRange: string) {
  const trimmed = ageRange.trim();
  const intervalMatch = trimmed.match(/(\d+)\s*-\s*(\d+)/);
  if (intervalMatch) {
    const minAge = Number(intervalMatch[1]);
    const maxAge = Number(intervalMatch[2]);
    if (Number.isFinite(minAge) && Number.isFinite(maxAge)) {
      return { minAge, maxAge: Math.max(minAge, maxAge) };
    }
  }

  const plusMatch = trimmed.match(/(\d+)\s*\+/);
  if (plusMatch) {
    const minAge = Number(plusMatch[1]);
    if (Number.isFinite(minAge)) {
      return { minAge, maxAge: Math.max(minAge, 18) };
    }
  }

  return null;
}

function normalizeBranch(record: Partial<Branch> & { id?: unknown }): Branch | null {
  if (typeof record.id !== 'string' || !record.id.trim()) return null;
  if (typeof record.label !== 'string' || !record.label.trim()) return null;
  if (typeof record.focus !== 'string' || !record.focus.trim()) return null;
  if (!Array.isArray(record.meetingDays)) return null;
  const active = typeof record.active === 'boolean' ? record.active : true;

  const meetingDays = record.meetingDays
    .map(day => (typeof day === 'string' ? day.trim() : ''))
    .filter(Boolean);

  if (!meetingDays.length) return null;

  let minAge =
    typeof record.minAge === 'number' && Number.isFinite(record.minAge)
      ? Math.round(record.minAge)
      : Number.NaN;
  let maxAge =
    typeof record.maxAge === 'number' && Number.isFinite(record.maxAge)
      ? Math.round(record.maxAge)
      : Number.NaN;

  if (!Number.isFinite(minAge) || !Number.isFinite(maxAge)) {
    const legacyAgeRange =
      typeof (record as Partial<{ ageRange: unknown }>).ageRange === 'string'
        ? parseLegacyAgeRange((record as Partial<{ ageRange: string }>).ageRange ?? '')
        : null;
    minAge = legacyAgeRange?.minAge ?? Number.NaN;
    maxAge = legacyAgeRange?.maxAge ?? Number.NaN;
  }

  if (!Number.isFinite(minAge) || !Number.isFinite(maxAge)) return null;
  minAge = Math.max(0, minAge);
  maxAge = Math.max(minAge, maxAge);

  return {
    id: record.id.trim(),
    label: record.label.trim(),
    active,
    minAge,
    maxAge,
    focus: record.focus.trim(),
    meetingDays,
  };
}

function loadRosterBranches(): Branch[] {
  if (typeof window === 'undefined') {
    return cloneDefaultBranches();
  }

  try {
    const raw = window.localStorage.getItem(rosterBranchStorageKey);
    if (!raw) return cloneDefaultBranches();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneDefaultBranches();
    const branches = parsed.map(normalizeBranch).filter((branch): branch is Branch => branch !== null);
    return branches.length ? branches : cloneDefaultBranches();
  } catch {
    return cloneDefaultBranches();
  }
}

function normalizeMember(record: Partial<Member> & { id?: unknown }): Member | null {
  if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.initials !== 'string') {
    return null;
  }
  if (!isBranchId(record.branchId, rosterBranches)) {
    return null;
  }

  const weekday = typeof record.weekday === 'string' && record.weekday.trim() ? record.weekday.trim() : rosterBranches.find(branch => branch.id === record.branchId)?.meetingDays[0] ?? 'Mandag';
  const active = typeof record.active === 'boolean' ? record.active : true;
  const birthYear = Number.isFinite(Number(record.birthYear)) ? Number(record.birthYear) : 2000;
  const team = typeof record.team === 'string' && record.team.trim() ? record.team.trim() : memberTeam(weekday);

  return {
    id: record.id,
    name: record.name,
    initials: record.initials,
    imageUrl: typeof record.imageUrl === 'string' && record.imageUrl.trim() ? record.imageUrl : undefined,
    branchId: record.branchId,
    weekday,
    active,
    birthYear,
    team,
  };
}

function loadRosterMembers(): Member[] {
  if (typeof window === 'undefined') {
    return cloneDefaults();
  }

  try {
    const raw = window.localStorage.getItem(rosterStorageKey);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneDefaults();
    const members = parsed.map(normalizeMember).filter((member): member is Member => member !== null);
    return members.length ? members : cloneDefaults();
  } catch {
    return cloneDefaults();
  }
}

export function createRosterMemberId() {
  return `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBranchId(label: string, branches: Branch[] = rosterBranches) {
  const base = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'gren';

  let candidate = base;
  let suffix = 2;
  while (branches.some(branch => branch.id === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function formatBranchAgeRange(branch: Pick<Branch, 'minAge' | 'maxAge'>) {
  return branch.minAge === branch.maxAge ? `${branch.minAge} år` : `${branch.minAge}-${branch.maxAge} år`;
}

export function buildMemberInitials(name: string) {
  return memberInitials(name);
}

export function buildMemberTeam(weekday: string) {
  return memberTeam(weekday);
}

export const rosterBranches: Branch[] = reactive(loadRosterBranches());
export const rosterMembers: Member[] = reactive(loadRosterMembers());
export const publicRosterBranches = computed(() => rosterBranches.filter(branch => branch.active));

export function saveRosterBranches(branches: Branch[] = rosterBranches) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(rosterBranchStorageKey, JSON.stringify(branches));
}

export function saveRosterMembers(members: Member[] = rosterMembers) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(rosterStorageKey, JSON.stringify(members));
}

export function branchLabel(branchId: string) {
  return rosterBranches.find(branch => branch.id === branchId)?.label ?? branchId;
}
