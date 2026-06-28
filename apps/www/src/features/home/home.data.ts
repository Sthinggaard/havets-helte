import type { AdminEvent, EventType } from '../eventAdmin/eventAdmin.types';
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
  if (type === 'event') return 'Meld dig på';
  if (type === 'shift') return 'Se vagter';
  return 'Se opgaver';
}

function toFeedType(type: EventType): Exclude<EventFilterType, 'all'> {
  if (type === 'task') return 'task';
  if (type === 'event') return 'event';
  return 'shift';
}

function toCtaRoute(type: EventType) {
  if (type === 'event') return '/events';
  if (type === 'timed') return '/vagter';
  return '/opgaver';
}

function spotsLabel(event: AdminEvent): string {
  if (!event.slots.length) return 'Ingen pladser';
  if (event.slots.some(slot => slot.capacity === 0)) return 'Ubegrænset';
  const total = event.slots.reduce((sum, slot) => sum + slot.capacity, 0);
  return `${total} ${total === 1 ? 'plads' : 'pladser'}`;
}

export function toHomeFeedItem(event: AdminEvent): HomeFeedItem {
  const feedType = toFeedType(event.type);
  const fallbackImage = eventItems.find(item => item.type === feedType)?.image || '/og-sankthans.png';
  return {
    id: event.id,
    type: feedType,
    title: event.title,
    dateText: event.dateText,
    location: event.location,
    spots: spotsLabel(event),
    summary: event.description,
    image: event.imageUrl || fallbackImage,
    ctaLabel: toCtaLabel(feedType),
    ctaRoute: toCtaRoute(event.type),
  };
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
