import type { EventItem, EventFilterType } from './events.types';

export const eventFilterOptions: Array<{ id: EventFilterType; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'event', label: 'Events' },
  { id: 'task', label: 'Opgaver' },
  { id: 'shift', label: 'Vagter' },
];

export const eventItems: EventItem[] = [
  {
    id: 'kristihimmelfartstogt',
    type: 'event',
    title: 'Kristihimmelfartstogt',
    dateText: 'Torsdag 21. maj · 16:00–22:00',
    location: 'Havets Helte',
    spots: '1 plads tilbage',
    summary: 'En aften på vandet med fælles ansvar, sejlads og aftensmad.',
    image: '/og-sankthans.png',
  },
  {
    id: 'sankthans-sluseholmen',
    type: 'event',
    title: 'Sankt Hans på Sluseholmen',
    dateText: 'Tirsdag 23. juni · 16:00–22:00',
    location: 'Vandtrappen Sluseholmen',
    spots: '6 vagter',
    summary: 'Bål, drikkevarer og skumfidus-stationer for hele familien.',
    image: '/og-sankthans.png',
  },
  {
    id: 'lejrtur-forberedelse',
    type: 'task',
    title: 'Lejrur — hjælp til forberedelse',
    dateText: 'Løbende frem til 1. august',
    location: 'Havets Helte',
    spots: '3 opgaver',
    summary: 'Pakkeliste, transport og køkkenhjælp fordeles på et samlet opgaveflow.',
    image: '/og-sankthans.png',
  },
  {
    id: 'sommermode-vagt',
    type: 'shift',
    title: 'Sommermøde vagt',
    dateText: 'Torsdag 4. juli · 17:30–19:30',
    location: 'Havets Helte',
    spots: '2 ledige',
    summary: 'Vagtplan til sommermødet med tydelige roller og færre ad hoc-beslutninger.',
    image: '/og-sankthans.png',
  },
];

