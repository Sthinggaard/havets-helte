import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import {
  IMAGE_LIBRARY_COLLECTION,
  IMAGE_LIBRARY_CATEGORIES_COLLECTION,
  IMAGE_LIBRARY_UNCATEGORIZED_ID,
  IMAGE_LIBRARY_UNCATEGORIZED_NAME,
  createFallbackLibraryItems,
  createLibraryCategoryFromRecord,
  createLibraryItemFromRecord,
  librarySeedCategories,
} from './library.data';
import type { LibraryCategory, LibraryDraft, LibraryItem } from './library.types';
import { getAppFirestore, getAppStorage, waitForAppAuthReady } from '@/lib/firebase';

function createDraft(item: LibraryItem): LibraryDraft {
  return {
    name: item.name,
    categoryId: item.categoryId,
    imageUrl: item.imageUrl,
    summary: item.summary,
  };
}

function cloneItem(item: LibraryItem): LibraryItem {
  return { ...item };
}

function cloneCategory(category: LibraryCategory): LibraryCategory {
  return { ...category };
}

function sortCategories(categories: LibraryCategory[]) {
  return [...categories].sort((a, b) => {
    if (a.id === IMAGE_LIBRARY_UNCATEGORIZED_ID) return -1;
    if (b.id === IMAGE_LIBRARY_UNCATEGORIZED_ID) return 1;
    return a.name.localeCompare(b.name, 'da');
  });
}

function timeValue(value: unknown) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  if (typeof value === 'object' && value && 'seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
}

function sortItems(items: LibraryItem[]) {
  return [...items].sort((a, b) => {
    const byTime = timeValue(b.updatedAt || b.createdAt) - timeValue(a.updatedAt || a.createdAt);
    if (byTime !== 0) return byTime;
    return a.name.localeCompare(b.name, 'da');
  });
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function baseFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Billede';
}

function buildStoragePath(categoryId: string, fileName: string) {
  return `image-library/${categoryId}/${crypto.randomUUID()}_${sanitizeFileName(fileName)}`;
}

export function useLibraryPage() {
  const fallbackCategories = librarySeedCategories.map(cloneCategory);
  const fallbackItems = createFallbackLibraryItems();

  const categories = ref<LibraryCategory[]>(fallbackCategories);
  const items = ref<LibraryItem[]>(fallbackItems.map(cloneItem));
  const selectedCategoryId = ref<string>('all');
  const selectedItemId = ref(items.value[0]?.id ?? '');
  const editing = ref(false);
  const draft = reactive<LibraryDraft>(createDraft(items.value[0] ?? fallbackItems[0]));
  const pendingReplacementFile = ref<File | null>(null);

  const orderedCategories = computed(() => sortCategories(categories.value));

  const categoryCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = { all: items.value.length };
    orderedCategories.value.forEach(category => {
      counts[category.id] = 0;
    });
    items.value.forEach(item => {
      counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
    });
    return counts;
  });

  const visibleItems = computed(() =>
    selectedCategoryId.value === 'all'
      ? items.value
      : items.value.filter(item => item.categoryId === selectedCategoryId.value),
  );

  const selectedItem = computed(() => {
    const visibleSelected = visibleItems.value.find(item => item.id === selectedItemId.value);
    return visibleSelected || visibleItems.value[0] || items.value[0] || null;
  });

  const selectedCategory = computed(() =>
    selectedCategoryId.value === 'all'
      ? null
      : orderedCategories.value.find(category => category.id === selectedCategoryId.value) ?? null,
  );

  function categoryLabel(categoryId: string) {
    return (
      orderedCategories.value.find(category => category.id === categoryId)?.name ??
      (categoryId === IMAGE_LIBRARY_UNCATEGORIZED_ID ? IMAGE_LIBRARY_UNCATEGORIZED_NAME : 'Ukendt kategori')
    );
  }

  const activeCategoryLabel = computed(() => selectedCategory.value?.name ?? 'Alle');
  const selectedCategoryLabel = computed(() => (selectedItem.value ? categoryLabel(selectedItem.value.categoryId) : 'Alle'));

  function syncDraft(item: LibraryItem | null) {
    if (!item) return;
    draft.name = item.name;
    draft.categoryId = item.categoryId;
    draft.imageUrl = item.imageUrl;
    draft.summary = item.summary;
  }

  function clearPendingReplacement() {
    pendingReplacementFile.value = null;
  }

  function ensureSelectedVisible() {
    if (selectedCategoryId.value === 'all') return;
    const stillVisible = visibleItems.value.some(item => item.id === selectedItemId.value);
    if (stillVisible) return;
    selectedItemId.value = visibleItems.value[0]?.id ?? '';
  }

  function setItems(nextItems: LibraryItem[]) {
    items.value = sortItems(nextItems.map(cloneItem));
    if (!items.value.some(item => item.id === selectedItemId.value)) {
      selectedItemId.value = items.value[0]?.id ?? '';
    }
    ensureSelectedVisible();
    syncDraft(selectedItem.value);
  }

  function setCategories(nextCategories: LibraryCategory[]) {
    categories.value = sortCategories(nextCategories.map(cloneCategory));
    if (
      selectedCategoryId.value !== 'all' &&
      !categories.value.some(category => category.id === selectedCategoryId.value)
    ) {
      selectedCategoryId.value = 'all';
    }
  }

  async function seedLibraryCollections(db: Awaited<ReturnType<typeof getAppFirestore>>) {
    const uncategorizedRef = doc(db, IMAGE_LIBRARY_CATEGORIES_COLLECTION, IMAGE_LIBRARY_UNCATEGORIZED_ID);
    const snap = await getDoc(uncategorizedRef);
    if (snap.exists()) return;

    await setDoc(uncategorizedRef, {
      name: IMAGE_LIBRARY_UNCATEGORIZED_NAME,
      locked: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function ensureLibraryItemFromSource(
    db: Awaited<ReturnType<typeof getAppFirestore>>,
    collectionName: 'events' | 'members' | 'meetings',
    record: { id: string; imageUrl?: string; image?: string; url?: string; name?: string; title?: string; description?: string; dateText?: string; location?: string },
  ) {
    const imageUrl = String(record.imageUrl || record.url || record.image || '').trim();
    if (!imageUrl) return;

    const docId = `${collectionName}_${record.id}`;
    const ref = doc(db, IMAGE_LIBRARY_COLLECTION, docId);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    const sourceName = String(record.name || record.title || 'Billede').trim() || 'Billede';
    const summaryParts = [record.description, record.dateText, record.location].filter(Boolean);
    const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : `Bruges på ${sourceName}.`;

    await setDoc(ref, {
      name: sourceName,
      categoryId: IMAGE_LIBRARY_UNCATEGORIZED_ID,
      imageUrl,
      url: imageUrl,
      summary,
      sourceCollection: collectionName,
      sourceId: record.id,
      sourceName,
      importedFromForm: true,
      storagePath: '',
      originalName: '',
      contentType: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function bootstrapLibraryFromSources(db: Awaited<ReturnType<typeof getAppFirestore>>) {
    const sources: Array<['events' | 'members' | 'meetings', string]> = [
      ['events', 'events'],
      ['members', 'members'],
      ['meetings', 'meetings'],
    ];

    const results = await Promise.allSettled(sources.map(([, name]) => getDocs(collection(db, name))));
    const writes: Promise<unknown>[] = [];

    for (let index = 0; index < sources.length; index += 1) {
      const [collectionName] = sources[index];
      const result = results[index];
      if (result.status !== 'fulfilled') {
        if ((result.reason as { code?: string } | undefined)?.code !== 'permission-denied') {
          console.error(result.reason);
        }
        continue;
      }

      result.value.forEach(docSnap => {
        writes.push(
          ensureLibraryItemFromSource(db, collectionName, {
            id: docSnap.id,
            ...docSnap.data(),
          }).catch(error => {
            if ((error as { code?: string } | undefined)?.code !== 'permission-denied') {
              console.error(error);
            }
          }),
        );
      });
    }

    await Promise.allSettled(writes);
  }

  async function loadLibraryFromSource() {
    try {
      await waitForAppAuthReady();
      const db = await getAppFirestore();
      await seedLibraryCollections(db);
      await bootstrapLibraryFromSources(db);
      const [categorySnap, itemSnap] = await Promise.all([
        getDocs(collection(db, IMAGE_LIBRARY_CATEGORIES_COLLECTION)),
        getDocs(collection(db, IMAGE_LIBRARY_COLLECTION)),
      ]);

      const nextCategories = categorySnap.docs
        .map(docSnap => createLibraryCategoryFromRecord({ id: docSnap.id, ...docSnap.data() }))
        .filter((category): category is LibraryCategory => Boolean(category));
      const nextItems = itemSnap.docs
        .map(docSnap => createLibraryItemFromRecord({ id: docSnap.id, ...docSnap.data() }))
        .filter((item): item is LibraryItem => Boolean(item));

      setCategories(nextCategories.length > 0 ? nextCategories : fallbackCategories);
      setItems(nextItems.length > 0 ? nextItems : fallbackItems);
    } catch (error) {
      console.error(error);
      setCategories(fallbackCategories);
      setItems(fallbackItems);
    }
  }

  function selectCategory(categoryId: string) {
    if (editing.value) cancelEditing();
    selectedCategoryId.value = categoryId;
    const nextVisible = categoryId === 'all' ? items.value : items.value.filter(item => item.categoryId === categoryId);
    selectedItemId.value = nextVisible[0]?.id ?? '';
    editing.value = false;
    clearPendingReplacement();
    syncDraft(selectedItem.value);
  }

  function selectItem(id: string) {
    if (editing.value) cancelEditing();
    selectedItemId.value = id;
    editing.value = false;
    clearPendingReplacement();
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
    clearPendingReplacement();
    syncDraft(selectedItem.value);
    editing.value = false;
  }

  async function uploadLibraryFile(file: File, categoryId: string) {
    const db = await getAppFirestore();
    const storage = await getAppStorage();
    const safeCategoryId = categoryId || IMAGE_LIBRARY_UNCATEGORIZED_ID;
    const storagePath = buildStoragePath(safeCategoryId, file.name);
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    const name = baseFileName(file.name);

    const docRef = await addDoc(collection(db, IMAGE_LIBRARY_COLLECTION), {
      name,
      categoryId: safeCategoryId,
      imageUrl: url,
      url,
      summary: 'Ny fil lagt i biblioteket.',
      sourceCollection: 'library',
      sourceId: '',
      sourceName: name,
      importedFromForm: false,
      storagePath,
      originalName: file.name,
      contentType: file.type || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, IMAGE_LIBRARY_COLLECTION, docRef.id), { sourceId: docRef.id }, { merge: true });

    return {
      id: docRef.id,
      name,
      categoryId: safeCategoryId,
      imageUrl: url,
      storagePath,
      originalName: file.name,
      contentType: file.type || '',
    };
  }

  async function saveDraft() {
    const current = selectedItem.value;
    if (!current || !draft.name.trim()) return false;

    try {
      let imageUrl = current.imageUrl;
      let storagePath = current.storagePath;
      let originalName = current.originalName;
      let contentType = current.contentType;
      let importedFromForm = current.importedFromForm;

      if (pendingReplacementFile.value) {
        const storage = await getAppStorage();
        const db = await getAppFirestore();
        const file = pendingReplacementFile.value;
        const nextStoragePath = buildStoragePath(draft.categoryId, file.name);
        const fileRef = storageRef(storage, nextStoragePath);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
        storagePath = nextStoragePath;
        originalName = file.name;
        contentType = file.type || '';
        importedFromForm = false;
        if (current.storagePath && !current.importedFromForm) {
          try {
            await deleteObject(storageRef(storage, current.storagePath));
          } catch (storageError) {
            console.error(storageError);
          }
        }
        await updateDoc(doc(db, IMAGE_LIBRARY_COLLECTION, current.id), {
          name: draft.name.trim(),
          categoryId: draft.categoryId,
          imageUrl,
          url: imageUrl,
          summary: draft.summary.trim() || current.summary,
          storagePath,
          originalName,
          contentType,
          importedFromForm,
          updatedAt: serverTimestamp(),
        });
      } else {
        const db = await getAppFirestore();
        await updateDoc(doc(db, IMAGE_LIBRARY_COLLECTION, current.id), {
          name: draft.name.trim(),
          categoryId: draft.categoryId,
          imageUrl,
          url: imageUrl,
          summary: draft.summary.trim() || current.summary,
          updatedAt: serverTimestamp(),
        });
      }

      const nextItem: LibraryItem = {
        ...current,
        name: draft.name.trim(),
        categoryId: draft.categoryId,
        imageUrl,
        summary: draft.summary.trim() || current.summary,
        storagePath,
        originalName,
        contentType,
        importedFromForm,
        updatedAt: Date.now(),
        isLocal: false,
      };

      setItems(items.value.map(item => (item.id === current.id ? nextItem : item)));
      selectedItemId.value = nextItem.id;
      selectedCategoryId.value = nextItem.categoryId || selectedCategoryId.value;
      editing.value = false;
      clearPendingReplacement();
      ensureSelectedVisible();
      syncDraft(nextItem);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async function createCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const duplicate = orderedCategories.value.some(
      category => category.name.localeCompare(trimmed, 'da', { sensitivity: 'base' }) === 0,
    );
    if (duplicate) return false;

    try {
      const db = await getAppFirestore();
      const docRef = await addDoc(collection(db, IMAGE_LIBRARY_CATEGORIES_COLLECTION), {
        name: trimmed,
        locked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const nextCategory: LibraryCategory = {
        id: docRef.id,
        name: trimmed,
      };
      setCategories([...categories.value, nextCategory]);
      selectedCategoryId.value = nextCategory.id;
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async function renameSelectedCategory(nextName: string) {
    const selected = selectedCategory.value;
    if (!selected || selected.locked) return false;
    const trimmed = nextName.trim();
    if (!trimmed) return false;

    const duplicate = orderedCategories.value.some(
      category =>
        category.id !== selected.id &&
        category.name.localeCompare(trimmed, 'da', { sensitivity: 'base' }) === 0,
    );
    if (duplicate) return false;

    try {
      const db = await getAppFirestore();
      await updateDoc(doc(db, IMAGE_LIBRARY_CATEGORIES_COLLECTION, selected.id), {
        name: trimmed,
        updatedAt: serverTimestamp(),
      });
      setCategories(categories.value.map(category => (category.id === selected.id ? { ...category, name: trimmed } : category)));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async function deleteSelectedCategory() {
    const selected = selectedCategory.value;
    if (!selected || selected.locked) return false;

    try {
      const db = await getAppFirestore();
      const batch = writeBatch(db);
      const nextItems = items.value.map(item =>
        item.categoryId === selected.id
          ? { ...item, categoryId: IMAGE_LIBRARY_UNCATEGORIZED_ID }
          : item,
      );

      items.value.forEach(item => {
        if (item.categoryId === selected.id) {
          batch.update(doc(db, IMAGE_LIBRARY_COLLECTION, item.id), {
            categoryId: IMAGE_LIBRARY_UNCATEGORIZED_ID,
            updatedAt: serverTimestamp(),
          });
        }
      });
      batch.delete(doc(db, IMAGE_LIBRARY_CATEGORIES_COLLECTION, selected.id));
      await batch.commit();

      setCategories(categories.value.filter(category => category.id !== selected.id));
      setItems(nextItems);
      selectedCategoryId.value = IMAGE_LIBRARY_UNCATEGORIZED_ID;
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
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
    setCategories(fallbackCategories);
    void loadLibraryFromSource();
    selectedCategoryId.value = 'all';
    selectedItemId.value = items.value[0]?.id ?? '';
    editing.value = false;
    clearPendingReplacement();
    syncDraft(items.value[0] ?? null);
  }

  function replaceSelectedImage(file: File) {
    const current = selectedItem.value;
    if (!current) return false;
    if (draft.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(draft.imageUrl);
    }
    pendingReplacementFile.value = file;
    draft.imageUrl = URL.createObjectURL(file);
    draft.summary = current.summary;
    return true;
  }

  async function uploadItem(file: File, categoryId: string) {
    const currentCategory = categoryId || IMAGE_LIBRARY_UNCATEGORIZED_ID;
    try {
      const uploaded = await uploadLibraryFile(file, currentCategory);
      const nextItem: LibraryItem = {
        id: uploaded.id,
        name: uploaded.name,
        categoryId: uploaded.categoryId,
        imageUrl: uploaded.imageUrl,
        url: uploaded.imageUrl,
        summary: 'Ny fil lagt i biblioteket.',
        sourceCollection: 'library',
        sourceId: uploaded.id,
        sourceName: uploaded.name,
        importedFromForm: false,
        storagePath: uploaded.storagePath,
        originalName: uploaded.originalName,
        contentType: uploaded.contentType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isLocal: false,
      };
      items.value = sortItems([nextItem, ...items.value]);
      selectedCategoryId.value = currentCategory;
      selectedItemId.value = nextItem.id;
      editing.value = false;
      clearPendingReplacement();
      syncDraft(nextItem);
      return nextItem;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function deleteSelectedItem() {
    const current = selectedItem.value;
    if (!current) return false;

    try {
      const db = await getAppFirestore();
      const storage = await getAppStorage();
      if (current.storagePath && !current.importedFromForm) {
        try {
          await deleteObject(storageRef(storage, current.storagePath));
        } catch (storageError) {
          console.error(storageError);
        }
      }
      await deleteDoc(doc(db, IMAGE_LIBRARY_COLLECTION, current.id));
      items.value = items.value.filter(item => item.id !== current.id);
      selectedItemId.value = visibleItems.value.find(item => item.id !== current.id)?.id ?? items.value[0]?.id ?? '';
      editing.value = false;
      clearPendingReplacement();
      syncDraft(selectedItem.value);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function copySelectedLink() {
    const current = selectedItem.value;
    if (!current?.imageUrl) return Promise.reject(new Error('No image selected'));
    return navigator.clipboard.writeText(current.imageUrl);
  }

  onMounted(() => {
    void loadLibraryFromSource();
  });

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
    activeCategoryLabel,
    categories: orderedCategories,
    categoryCounts,
    categoryLabel,
    copySelectedLink,
    createCategory,
    deleteSelectedCategory,
    deleteSelectedItem,
    draft,
    editing,
    items,
    resetLibrary,
    renameSelectedCategory,
    replaceSelectedImage,
    saveDraft,
    selectCategory,
    selectItem,
    selectedCategory,
    selectedCategoryId,
    selectedCategoryLabel,
    selectedItem,
    startEditing,
    uploadItem,
    visibleItems,
    cancelEditing,
  };
}
