import { computed, onBeforeUnmount, reactive, ref } from 'vue';

import type { EventFilterType } from '../events/events.types';

import { librarySeedItems, libraryTypeLabels, libraryTypeOptions } from './library.data';
import type { LibraryDraft, LibraryItem, LibraryTypeId } from './library.types';

function createDraft(item: LibraryItem): LibraryDraft {
  return {
    title: item.title,
    type: item.type,
    imageUrl: item.imageUrl,
    summary: item.summary,
  };
}

function cloneItem(item: LibraryItem): LibraryItem {
  return { ...item };
}

export function useLibraryPage() {
  const items = ref<LibraryItem[]>(librarySeedItems.map(cloneItem));
  const activeType = ref<EventFilterType>('all');
  const selectedItemId = ref(items.value[0]?.id ?? '');
  const editing = ref(false);
  const draft = reactive<LibraryDraft>(createDraft(items.value[0] ?? librarySeedItems[0]));

  const typeCounts = computed<Record<EventFilterType, number>>(() => {
    const counts: Record<EventFilterType, number> = {
      all: items.value.length,
      event: 0,
      task: 0,
      shift: 0,
    };
    items.value.forEach(item => {
      counts[item.type] += 1;
    });
    return counts;
  });

  const visibleItems = computed(() =>
    activeType.value === 'all' ? items.value : items.value.filter(item => item.type === activeType.value),
  );

  const selectedItem = computed(() => {
    const visibleSelected = visibleItems.value.find(item => item.id === selectedItemId.value);
    return visibleSelected || visibleItems.value[0] || items.value[0] || null;
  });

  const selectedTypeLabel = computed(() =>
    selectedItem.value ? libraryTypeLabels[selectedItem.value.type] : libraryTypeLabels.all,
  );

  const activeTypeLabel = computed(() => libraryTypeLabels[activeType.value]);

  function syncDraft(item: LibraryItem | null) {
    if (!item) return;
    draft.title = item.title;
    draft.type = item.type;
    draft.imageUrl = item.imageUrl;
    draft.summary = item.summary;
  }

  function selectType(type: EventFilterType) {
    if (editing.value) cancelEditing();
    activeType.value = type;
    const nextVisible = type === 'all' ? items.value : items.value.filter(item => item.type === type);
    selectedItemId.value = nextVisible[0]?.id ?? '';
    editing.value = false;
    syncDraft(selectedItem.value);
  }

  function selectItem(id: string) {
    if (editing.value) cancelEditing();
    selectedItemId.value = id;
    editing.value = false;
    syncDraft(selectedItem.value);
  }

  function startEditing() {
    if (!selectedItem.value) return;
    syncDraft(selectedItem.value);
    editing.value = true;
  }

  function cancelEditing() {
    if (draft.imageUrl.startsWith('blob:') && selectedItem.value?.imageUrl !== draft.imageUrl) {
      URL.revokeObjectURL(draft.imageUrl);
    }
    syncDraft(selectedItem.value);
    editing.value = false;
  }

  function ensureSelectedVisible() {
    if (activeType.value === 'all') return;
    const stillVisible = visibleItems.value.some(item => item.id === selectedItemId.value);
    if (stillVisible) return;
    selectedItemId.value = visibleItems.value[0]?.id ?? '';
  }

  function saveDraft() {
    const current = selectedItem.value;
    if (!current || !draft.title.trim()) return false;

    const nextImageIsLocal = draft.imageUrl.startsWith('blob:');
    if (current.isLocal && current.imageUrl.startsWith('blob:') && current.imageUrl !== draft.imageUrl) {
      URL.revokeObjectURL(current.imageUrl);
    }

    const nextItem: LibraryItem = {
      ...current,
      title: draft.title.trim(),
      type: draft.type,
      imageUrl: draft.imageUrl.trim() || current.imageUrl,
      summary: draft.summary.trim() || current.summary,
      isLocal: nextImageIsLocal || current.isLocal,
    };

    items.value = items.value.map(item => (item.id === current.id ? nextItem : item));
    selectedItemId.value = nextItem.id;
    editing.value = false;
    if (activeType.value !== 'all' && activeType.value !== nextItem.type) {
      activeType.value = nextItem.type;
    }
    ensureSelectedVisible();
    syncDraft(nextItem);
    return true;
  }

  function resetLibrary() {
    items.value.forEach(item => {
      if (item.isLocal && item.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.imageUrl);
      }
    });
    if (draft.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(draft.imageUrl);
    }
    items.value = librarySeedItems.map(cloneItem);
    activeType.value = 'all';
    selectedItemId.value = librarySeedItems[0]?.id ?? '';
    editing.value = false;
    syncDraft(items.value[0] ?? null);
  }

  function replaceSelectedImage(file: File) {
    const current = selectedItem.value;
    if (!current) return false;
    const nextUrl = URL.createObjectURL(file);
    draft.imageUrl = nextUrl;
    draft.summary = current.summary;
    return true;
  }

  function uploadItem(file: File, type: LibraryTypeId) {
    const currentType = type || 'event';
    const nextUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Nyt billede';
    const nextItem: LibraryItem = {
      id: `upload-${crypto.randomUUID()}`,
      type: currentType,
      title: fileName,
      summary: 'Ny fil lagt i biblioteket.',
      imageUrl: nextUrl,
      sourceLabel: libraryTypeLabels[currentType],
      isLocal: true,
    };
    items.value = [nextItem, ...items.value];
    activeType.value = currentType;
    selectedItemId.value = nextItem.id;
    editing.value = false;
    syncDraft(nextItem);
    return nextItem;
  }

  function deleteSelectedItem() {
    const current = selectedItem.value;
    if (!current) return false;
    if (current.isLocal && current.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(current.imageUrl);
    }
    items.value = items.value.filter(item => item.id !== current.id);
    selectedItemId.value = visibleItems.value.find(item => item.id !== current.id)?.id ?? items.value[0]?.id ?? '';
    editing.value = false;
    syncDraft(selectedItem.value);
    return true;
  }

  function copySelectedLink() {
    const current = selectedItem.value;
    if (!current?.imageUrl) return Promise.reject(new Error('No image selected'));
    return navigator.clipboard.writeText(current.imageUrl);
  }

  function typeLabel(type: EventFilterType | LibraryTypeId) {
    return libraryTypeLabels[type as EventFilterType];
  }

  onBeforeUnmount(() => {
    items.value.forEach(item => {
      if (item.isLocal && item.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.imageUrl);
      }
    });
    if (draft.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(draft.imageUrl);
    }
  });

  syncDraft(selectedItem.value);

  return {
    activeType,
    activeTypeLabel,
    copySelectedLink,
    deleteSelectedItem,
    draft,
    editing,
    items,
    libraryTypeLabels,
    libraryTypeOptions,
    resetLibrary,
    replaceSelectedImage,
    saveDraft,
    selectItem,
    selectType,
    selectedItem,
    selectedItemId,
    selectedTypeLabel,
    startEditing,
    typeCounts,
    typeLabel,
    uploadItem,
    visibleItems,
    cancelEditing,
  };
}
