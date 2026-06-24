export type LibrarySourceCollection = 'fallback' | 'library' | 'events' | 'members' | 'meetings';

export interface LibraryCategory {
  id: string;
  name: string;
  locked?: boolean;
}

export interface LibraryItem {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  url?: string;
  summary: string;
  sourceCollection: LibrarySourceCollection;
  sourceId: string;
  sourceName: string;
  importedFromForm: boolean;
  storagePath?: string;
  originalName?: string;
  contentType?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  isLocal: boolean;
}

export interface LibraryDraft {
  name: string;
  categoryId: string;
  imageUrl: string;
  summary: string;
}

export interface LibrarySourceRecord {
  id: string;
  name?: string;
  title?: string;
  locked?: boolean;
  description?: string;
  dateText?: string;
  location?: string;
  image?: string;
  imageUrl?: string;
  url?: string;
  categoryId?: string;
  sourceCollection?: LibrarySourceCollection;
  sourceId?: string;
  sourceName?: string;
  importedFromForm?: boolean;
  storagePath?: string;
  originalName?: string;
  contentType?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
