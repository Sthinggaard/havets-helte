import { reactive } from 'vue';

import type { Branch, Member } from './roster.types';

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

export const rosterMembers: Member[] = reactive([
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
]);

export function branchLabel(branchId: string) {
  return rosterBranches.find(branch => branch.id === branchId)?.label ?? branchId;
}
