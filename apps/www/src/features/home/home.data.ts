import type { AdminEvent, EventType } from '../eventAdmin/eventAdmin.types';
import { eventItems } from '../events/events.data';
import type { EventFilterType } from '../events/events.types';
import type { HomeFeedItem, HomeSignupItem, HomeTabId } from './home.types';

export const homeTabs: Array<{ id: HomeTabId; label: string }> = [
  { id: 'parents', label: 'Forældrehelte-opgaver' },
  { id: 'scout-signups', label: 'Spejdertilmeldinger' },
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
  if (type === 'event') return '/';
  if (type === 'timed') return '/vagter';
  return '/opgaver';
}

function spotsLabel(event: AdminEvent): string {
  if (!event.slots.length) return 'Ingen pladser';
  if (event.slots.some(slot => slot.capacity === 0)) return 'Ubegrænset';
  const total = event.slots.reduce((sum, slot) => sum + slot.capacity, 0);
  return `${total} ${total === 1 ? 'plads' : 'pladser'}`;
}

export function toHomeFeedItem(
  event: AdminEvent,
  feedType = toFeedType(event.type),
  id = event.id,
  parentTypes?: Array<'shift' | 'task'>,
): HomeFeedItem {
  const fallbackImage = eventItems.find(item => item.type === feedType)?.image || '/og-sankthans.webp';
  return {
    id,
    eventId: event.id,
    parentTypes,
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

export function toHomeFeedItems(event: AdminEvent): HomeFeedItem[] {
  if (event.type !== 'event') return [toHomeFeedItem(event)];

  const componentTypes = new Set(event.slots.map(slot => slot.componentType));
  const parentTypes = (['shift', 'task'] as const).filter(type => componentTypes.has(type));
  const items: HomeFeedItem[] = [];

  if (parentTypes.length) {
    items.push(toHomeFeedItem(event, parentTypes.includes('shift') ? 'shift' : 'task', `${event.id}:parents`, parentTypes));
  }
  if (componentTypes.has('signup')) items.push(toHomeFeedItem(event, 'event', `${event.id}:scouts`));

  return items.length ? items : [toHomeFeedItem(event)];
}

export const homeFeedItems: HomeFeedItem[] = eventItems.map(item => ({
  ...item,
  ctaLabel: toCtaLabel(item.type),
  ctaRoute: item.type === 'event' ? '/' : item.type === 'shift' ? '/vagter' : '/opgaver',
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
