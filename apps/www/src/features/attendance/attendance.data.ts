import type { Branch, Meeting, Member } from './attendance.types';

export const attendanceBranches: Branch[] = [
  { id: 'junior', label: 'Junior' },
  { id: 'ulv', label: 'Ulv' },
  { id: 'trop', label: 'Trop' },
  { id: 'soespejder', label: 'Søspejder' },
];

export const attendanceMembers: Member[] = [
  { id: 'm1', name: 'Albert Boye Dohm Overgaard', initials: 'AB', branchId: 'junior', weekday: 'Tirsdag', active: true },
  { id: 'm2', name: 'Aviaja Henriksson Lagoni', initials: 'AH', branchId: 'junior', weekday: 'Tirsdag', active: true },
  { id: 'm3', name: 'Isabella Julie Bæk Jakobsen', initials: 'IJ', branchId: 'junior', weekday: 'Tirsdag', active: true },
  { id: 'm4', name: 'León Haag Montiveros', initials: 'LH', branchId: 'junior', weekday: 'Tirsdag', active: true },
  { id: 'm5', name: 'Noah Skovgaard', initials: 'NS', branchId: 'ulv', weekday: 'Mandag', active: true },
  { id: 'm6', name: 'Maja Bennedsen', initials: 'MB', branchId: 'ulv', weekday: 'Mandag', active: true },
  { id: 'm7', name: 'Freja Lund', initials: 'FL', branchId: 'trop', weekday: 'Onsdag', active: true },
  { id: 'm8', name: 'Emil Østergaard', initials: 'EO', branchId: 'trop', weekday: 'Onsdag', active: true },
  { id: 'm9', name: 'Sofie Hartvig', initials: 'SH', branchId: 'soespejder', weekday: 'Torsdag', active: true },
  { id: 'm10', name: 'Mikael Jørgensen', initials: 'MJ', branchId: 'soespejder', weekday: 'Torsdag', active: true },
];

export const attendanceMeetings: Meeting[] = [
  {
    id: 'meet-junior-2026-06-23',
    date: '2026-06-23',
    time: '17.00–18.30',
    title: 'Junior',
    branchId: 'junior',
    weekday: 'Tirsdag',
    location: 'Havets Helte',
    capacity: 7,
    summary: 'Junior aften med klargøring og check-in.',
  },
  {
    id: 'meet-junior-2026-06-30',
    date: '2026-06-30',
    time: '17.00–18.30',
    title: 'Junior',
    branchId: 'junior',
    weekday: 'Tirsdag',
    location: 'Havets Helte',
    capacity: 7,
    summary: 'Sommersamling med værkstedsopgaver.',
  },
  {
    id: 'meet-ulv-2026-06-22',
    date: '2026-06-22',
    time: '16.30–18.00',
    title: 'Ulv',
    branchId: 'ulv',
    weekday: 'Mandag',
    location: 'Klubhuset',
    capacity: 8,
    summary: 'Mandagshold med lejrbål og forløb.',
  },
  {
    id: 'meet-trop-2026-06-25',
    date: '2026-06-25',
    time: '18.00–20.00',
    title: 'Trop',
    branchId: 'trop',
    weekday: 'Onsdag',
    location: 'Møllekajen',
    capacity: 12,
    summary: 'Tropmøde med sejlads og planlægning.',
  },
  {
    id: 'meet-soespejder-2026-06-26',
    date: '2026-06-26',
    time: '17.30–19.30',
    title: 'Søspejder',
    branchId: 'soespejder',
    weekday: 'Torsdag',
    location: 'Sluseholmen',
    capacity: 9,
    summary: 'Søspejdermøde med fremmøde og havnelære.',
  },
  {
    id: 'meet-soespejder-2026-07-04',
    date: '2026-07-04',
    time: '17.30–19.30',
    title: 'Søspejder',
    branchId: 'soespejder',
    weekday: 'Torsdag',
    location: 'Sluseholmen',
    capacity: 9,
    summary: 'Sommermøde med fartøjsforberedelse.',
  },
];

export const seedAttendance: Record<string, string[]> = {
  'meet-junior-2026-06-23': ['m1', 'm2'],
  'meet-junior-2026-06-30': ['m1'],
  'meet-ulv-2026-06-22': ['m5', 'm6'],
  'meet-trop-2026-06-25': ['m7'],
  'meet-soespejder-2026-06-26': ['m9', 'm10'],
  'meet-soespejder-2026-07-04': ['m9'],
};

