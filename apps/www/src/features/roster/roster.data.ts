import { reactive } from 'vue';

import type { Branch, Member, BranchId } from './roster.types';

const rosterStorageKey = 'sankthans.rosterMembers.v1';

export const rosterBranches: Branch[] = [
  {
    id: 'junior',
    label: 'Junior',
    ageRange: '8-11 år',
    focus: 'Færdigheder, lege og små ture',
    meetingDays: ['Tirsdag'],
  },
  {
    id: 'ulv',
    label: 'Ulv',
    ageRange: '7-9 år',
    focus: 'Tryg ramme, leg og gode vaner',
    meetingDays: ['Mandag'],
  },
  {
    id: 'trop',
    label: 'Trop',
    ageRange: '12-15 år',
    focus: 'Mere ansvar, projekt og sejlsport',
    meetingDays: ['Onsdag'],
  },
  {
    id: 'soespejder',
    label: 'Søspejder',
    ageRange: '16+ år',
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

function isBranchId(value: unknown): value is BranchId {
  return rosterBranches.some(branch => branch.id === value);
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

function normalizeMember(record: Partial<Member> & { id?: unknown }): Member | null {
  if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.initials !== 'string') {
    return null;
  }
  if (!isBranchId(record.branchId)) {
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

export function buildMemberInitials(name: string) {
  return memberInitials(name);
}

export function buildMemberTeam(weekday: string) {
  return memberTeam(weekday);
}

export const rosterMembers: Member[] = reactive(loadRosterMembers());

export function saveRosterMembers(members: Member[] = rosterMembers) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(rosterStorageKey, JSON.stringify(members));
}

export function branchLabel(branchId: string) {
  return rosterBranches.find(branch => branch.id === branchId)?.label ?? branchId;
}
