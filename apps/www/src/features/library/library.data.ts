import { eventItems } from '../events/events.data';
import { eventSummaries } from '../events/eventSummaries';

import type { LibraryCategory, LibraryItem, LibrarySourceRecord } from './library.types';

export const IMAGE_LIBRARY_COLLECTION = 'imageLibrary';
export const IMAGE_LIBRARY_CATEGORIES_COLLECTION = 'imageLibraryCategories';
export const IMAGE_LIBRARY_UNCATEGORIZED_ID = 'uncategorized';
export const IMAGE_LIBRARY_UNCATEGORIZED_NAME = 'Ukategoriseret';

export const librarySeedCategories: LibraryCategory[] = [
  {
    id: IMAGE_LIBRARY_UNCATEGORIZED_ID,
    name: IMAGE_LIBRARY_UNCATEGORIZED_NAME,
    locked: true,
  },
];

const baseImage = '/og-sankthans.webp';
const logoImage = '/havets-helte-logo.svg';

function makeItem(
  id: string,
  name: string,
  summary: string,
  imageUrl = baseImage,
  sourceCollection: LibraryItem['sourceCollection'] = 'fallback',
  sourceId = id,
  sourceName = name,
): LibraryItem {
  return {
    id,
    name,
    categoryId: IMAGE_LIBRARY_UNCATEGORIZED_ID,
    imageUrl,
    summary,
    sourceCollection,
    sourceId,
    sourceName,
    importedFromForm: sourceCollection !== 'fallback',
    isLocal: false,
  };
}

export function createFallbackLibraryItems(): LibraryItem[] {
  return [
    ...eventItems.map(item =>
      makeItem(
        `event-${item.id}`,
        `Billede til ${item.title}`,
        `Bruges på ${item.title}.`,
        item.image || baseImage,
        'fallback',
        item.id,
        item.title,
      ),
    ),
    ...eventSummaries.map((event, index) =>
      makeItem(
        `summary-${index + 1}`,
        `Billede til ${event.title}`,
        event.meta,
        logoImage,
        'fallback',
        `${index + 1}`,
        event.title,
      ),
    ),
  ];
}

function sourceDisplayName(record: LibrarySourceRecord) {
  return String(record.name || record.title || 'Billede').trim() || 'Billede';
}

export function createLibraryCategoryFromRecord(record: LibrarySourceRecord): LibraryCategory | null {
  const id = String(record.id || '').trim();
  const name = String(record.name || '').trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    locked: !!record.locked,
  };
}

export function createLibraryItemFromRecord(record: LibrarySourceRecord): LibraryItem | null {
  const imageUrl = String(record.imageUrl || record.url || record.image || '').trim();
  if (!imageUrl) return null;

  const sourceName = String(record.sourceName || sourceDisplayName(record)).trim();
  const summaryParts = [record.description, record.dateText, record.location].filter(Boolean);
  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : `Bruges på ${sourceName}.`;

  return {
    id: String(record.id),
    name: String(record.name || `Billede til ${sourceName}`).trim(),
    categoryId: String(record.categoryId || IMAGE_LIBRARY_UNCATEGORIZED_ID),
    imageUrl,
    summary,
    sourceCollection: (record.sourceCollection || 'library') as LibraryItem['sourceCollection'],
    sourceId: String(record.sourceId || record.id),
    sourceName,
    importedFromForm: record.importedFromForm ?? false,
    storagePath: record.storagePath,
    originalName: record.originalName,
    contentType: record.contentType,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isLocal: false,
  };
}
