export type EventFilterType = 'all' | 'event' | 'task' | 'shift';

export interface EventItem {
  id: string;
  type: Exclude<EventFilterType, 'all'>;
  title: string;
  dateText: string;
  location: string;
  spots: string;
  summary: string;
  image: string;
}

