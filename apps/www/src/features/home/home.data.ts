import type { AdminEvent, EventType } from '../eventAdmin/eventAdmin.types';
import { eventItems } from '../events/events.data';
import type { EventFilterType } from '../events/events.types';
import type { HomeFeedItem, HomeSignupItem, HomeTabId } from './home.types';

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

function feedSlots(event: AdminEvent, feedType: HomeFeedItem['type'], parentTypes?: Array<'shift' | 'task'>) {
  const componentTypes = parentTypes ?? [feedType === 'event' ? 'signup' : feedType];
  return event.slots.filter(slot => componentTypes.includes(slot.componentType as typeof componentTypes[number]));
}

function signupAppearsInTab(slot: AdminEvent['slots'][number], tab: HomeTabId) {
  if (slot.signupAudience === 'both') return true;
  return tab === 'parents' ? slot.signupAudience === 'parents' : slot.signupAudience === 'scouts';
}

function spotsLabel(event: AdminEvent, feedType: HomeFeedItem['type'], parentTypes?: Array<'shift' | 'task'>): string {
  const slots = feedSlots(event, feedType, parentTypes);
  if (!slots.length) return 'Ingen pladser';
  if (slots.some(slot => slot.capacity === 0)) return 'Ubegrænset';
  const total = slots.reduce((sum, slot) => sum + slot.capacity, 0);
  return `${total} ${total === 1 ? 'plads' : 'pladser'}`;
}

export function toHomeFeedItem(
  event: AdminEvent,
  feedType = toFeedType(event.type),
  id = event.id,
  parentTypes?: Array<'shift' | 'task'>,
  tabs?: HomeTabId[],
): HomeFeedItem {
  const fallbackImage = eventItems.find(item => item.type === feedType)?.image || '/og-sankthans.webp';
  const targetTabs = tabs ?? (feedType === 'event' ? ['scout-signups'] : ['parents']);
  const slots = feedSlots(event, feedType, parentTypes).filter(slot =>
    feedType !== 'event' || targetTabs.length !== 1 || signupAppearsInTab(slot, targetTabs[0]),
  );
  return {
    id,
    eventId: event.id,
    parentTypes,
    tabs: targetTabs,
    capacityCount: slots.some(slot => slot.capacity === 0) ? 0 : slots.reduce((sum, slot) => sum + slot.capacity, 0),
    signupAudienceLabels: feedType === 'event'
      ? [...new Set(slots.flatMap(slot => slot.eligibleGroups.map(group => group.label)))]
      : [],
    type: feedType,
    title: event.title,
    dateText: event.dateText,
    location: event.location,
    spots: spotsLabel(event, feedType, parentTypes),
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
    items.push(toHomeFeedItem(event, parentTypes.includes('shift') ? 'shift' : 'task', `${event.id}:parents`, parentTypes, ['parents']));
  }
  const signupSlots = event.slots.filter(slot => slot.componentType === 'signup');
  if (signupSlots.length) {
    if (signupSlots.some(slot => signupAppearsInTab(slot, 'scout-signups'))) {
      items.push(toHomeFeedItem(event, 'event', `${event.id}:signups:scouts`, undefined, ['scout-signups']));
    }
    if (signupSlots.some(slot => signupAppearsInTab(slot, 'parents'))) {
      items.push(toHomeFeedItem(event, 'event', `${event.id}:signups:parents`, undefined, ['parents']));
    }
  }

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
