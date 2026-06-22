import { eventFilterOptions, eventItems } from '../events/events.data';
import type { EventFilterType } from '../events/events.types';
import { shiftSummaries } from '../shifts/shiftSummaries';
import { taskSummaries } from '../tasks/taskSummaries';

import type { LibraryItem, LibrarySourceRecord, LibraryTypeId, LibraryTypeOption } from './library.types';

export const libraryTypeOptions: LibraryTypeOption[] = eventFilterOptions;

const baseImage = '/og-sankthans.png';
const logoImage = '/havets-helte-logo.svg';

function typeSourceLabel(type: LibraryTypeId) {
  if (type === 'event') return 'Bruges i events';
  if (type === 'task') return 'Bruges i opgaver';
  return 'Bruges i vagter';
}

function toLibraryItem(
  id: string,
  type: LibraryTypeId,
  title: string,
  summary: string,
  imageUrl = baseImage,
  sourceCollection: LibraryItem['sourceCollection'] = 'fallback',
  sourceId = id,
): LibraryItem {
  return {
    id,
    sourceCollection,
    sourceId,
    type,
    title,
    summary,
    imageUrl,
    sourceLabel: typeSourceLabel(type),
    isLocal: false,
  };
}

export function createFallbackLibraryItems(): LibraryItem[] {
  return [
    ...eventItems.map(item =>
      toLibraryItem(
        `event-${item.id}`,
        item.type as LibraryTypeId,
        `Billede til ${item.title}`,
        `Bruges på ${item.title}.`,
        item.image || baseImage,
      ),
    ),
    ...taskSummaries.map((task, index) =>
      toLibraryItem(
        `task-${index + 1}`,
        'task',
        `Opgavebillede til ${task.title}`,
        task.description,
        logoImage,
      ),
    ),
    ...shiftSummaries.map((shift, index) =>
      toLibraryItem(
        `shift-${index + 1}`,
        'shift',
        `Vagtbillede til ${shift.title}`,
        shift.description,
        baseImage,
      ),
    ),
  ];
}

export function toLibraryItemFromSourceRecord(record: LibrarySourceRecord): LibraryItem | null {
  const imageUrl = String(record.imageUrl || record.image || '').trim();
  if (!imageUrl) return null;

  const type = record.type || 'event';
  const title = String(record.title || 'Billede').trim();
  const summaryParts = [record.description, record.dateText, record.location].filter(Boolean);
  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : `Bruges på ${title}.`;

  return {
    id: record.id,
    sourceCollection: 'events',
    sourceId: record.id,
    type,
    title: `Billede til ${title}`,
    summary,
    imageUrl,
    sourceLabel: typeSourceLabel(type),
    isLocal: false,
  };
}

export const libraryTypeLabels: Record<EventFilterType, string> = {
  all: 'Alle',
  event: 'Events',
  task: 'Opgaver',
  shift: 'Vagter',
};
