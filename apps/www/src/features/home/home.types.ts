import type { EventItem, EventFilterType } from '../events/events.types';

export type HomeTabId = EventFilterType | 'mine';

export interface HomeFeedItem extends EventItem {
  ctaLabel: string;
  ctaRoute: string;
}

export interface HomeSignupItem {
  id: string;
  eventId: string;
  title: string;
  subtitle: string;
  type: Exclude<EventFilterType, 'all'>;
  actionLabel: string;
}

export interface HomeCopyLinkTarget {
  tab: HomeTabId;
  eventId: string;
}
