import { eventItems } from '../events/events.data';
import type { EventFilterType } from '../events/events.types';
import type { HomeFeedItem, HomeSignupItem, HomeTabId } from './home.types';

export const homeTabs: Array<{ id: HomeTabId; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'task', label: 'Opgaver' },
  { id: 'shift', label: 'Vagter' },
  { id: 'event', label: 'Events' },
  { id: 'mine', label: 'Min tilmeldinger' },
];

export const homeMineTabs: Array<{ id: HomeTabId; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'task', label: 'Opgaver' },
  { id: 'shift', label: 'Vagter' },
  { id: 'event', label: 'Events' },
  { id: 'mine', label: 'Min tilmeldinger' },
];

export const homeHero = {
  badge: 'Havets Helte',
  title: 'Forældrehelte',
  description: 'Vores forening lever af forældre der giver en hånd.',
} as const;

function toCtaLabel(type: EventFilterType) {
  if (type === 'event') return 'Se event';
  if (type === 'shift') return 'Find en vagt';
  return 'Se opgaver';
}

export const homeFeedItems: HomeFeedItem[] = eventItems.map(item => ({
  ...item,
  ctaLabel: toCtaLabel(item.type),
  ctaRoute: item.type === 'event' ? '/events' : item.type === 'shift' ? '/vagter' : '/opgaver',
}));

export const homeSignups: HomeSignupItem[] = [
  {
    id: 'signup-1',
    eventId: 'kristihimmelfartstogt',
    title: 'Kristihimmelfartstogt',
    subtitle: 'Deltager',
    type: 'event',
    actionLabel: 'Afmeld',
  },
  {
    id: 'signup-2',
    eventId: 'lejrtur-forberedelse',
    title: 'Lejrtur — hjælp til forberedelse',
    subtitle: 'Transport af udstyr',
    type: 'task',
    actionLabel: 'Afmeld',
  },
  {
    id: 'signup-3',
    eventId: 'sommermode-vagt',
    title: 'Sommermøde vagt',
    subtitle: 'Vagtplan',
    type: 'shift',
    actionLabel: 'Afmeld',
  },
] as const;
