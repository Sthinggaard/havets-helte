import { eventFilterOptions, eventItems } from '../events/events.data';
import type { EventFilterType } from '../events/events.types';
import { taskSummaries } from '../tasks/taskSummaries';
import { shiftSummaries } from '../shifts/shiftSummaries';

import type { LibraryItem, LibraryTypeOption, LibraryTypeId } from './library.types';

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
): LibraryItem {
  return {
    id,
    type,
    title,
    summary,
    imageUrl,
    sourceLabel: typeSourceLabel(type),
    isLocal: false,
  };
}

export const librarySeedItems: LibraryItem[] = [
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

export const libraryTypeLabels: Record<EventFilterType, string> = {
  all: 'Alle',
  event: 'Events',
  task: 'Opgaver',
  shift: 'Vagter',
};
