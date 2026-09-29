import type { EventItem, EventFilterType } from '../events/events.types';

export type HomeTabId = 'parents' | 'scout-signups';

export interface HomeFeedItem extends EventItem {
  capacityCount?: number;
  confirmedCount?: number;
  signupAudienceLabels?: string[];
  eventId?: string;
  parentTypes?: Array<'shift' | 'task'>;
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
