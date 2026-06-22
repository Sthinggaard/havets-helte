import type { EventFilterType } from '../events/events.types';

export type LibraryTypeId = Exclude<EventFilterType, 'all'>;

export interface LibraryItem {
  id: string;
  type: LibraryTypeId;
  title: string;
  summary: string;
  imageUrl: string;
  sourceLabel: string;
  isLocal: boolean;
}

export interface LibraryDraft {
  title: string;
  type: LibraryTypeId;
  imageUrl: string;
  summary: string;
}

export interface LibraryTypeOption {
  id: EventFilterType;
  label: string;
}
