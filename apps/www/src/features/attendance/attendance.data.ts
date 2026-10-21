import type { Meeting } from './attendance.types';
import { computed } from 'vue';
import { attendanceRecords } from './attendance.records';

const sampleMeetings: Meeting[] = [
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

export const attendanceMeetings = computed(() => {
  const meetings = new Map(sampleMeetings.map(meeting => [meeting.id, meeting]));
  for (const record of attendanceRecords) meetings.set(record.meeting.id, record.meeting);
  return [...meetings.values()];
});
