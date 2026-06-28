<template>
  <Teleport to="body">
    <div v-if="open" class="library-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId" @click.self="emit('close')">
      <div class="library-dialog">
        <div class="library-head">
          <div>
            <div class="library-title" :id="titleId">{{ title }}</div>
            <div class="library-sub">{{ subtitle }}</div>
          </div>
          <button type="button" class="library-close" @click="emit('close')" aria-label="Luk bibliotek">×</button>
        </div>

        <div class="library-toolbar">
          <label class="library-upload">
            <i class="ti ti-upload"></i>Upload nyt billede
            <input type="file" accept="image/*" @change="handleUpload" />
          </label>

          <div class="library-nav">
            <button type="button" class="btn-action" :disabled="!visibleItems.length" @click="stepSelection(-1)" aria-label="Forrige billede">
              <i class="ti ti-chevron-left"></i>
            </button>
            <button type="button" class="btn-action" :disabled="!visibleItems.length" @click="stepSelection(1)" aria-label="Næste billede">
              <i class="ti ti-chevron-right"></i>
            </button>
            <button type="button" class="btn-action btn-action--primary" :disabled="!selectedItem" @click="applySelection">
              <i class="ti ti-check"></i>Vælg billede
            </button>
          </div>

          <div class="library-count">{{ visibleItems.length ? `${visibleItems.length} billeder` : 'Ingen billeder endnu' }}</div>
        </div>

        <div class="library-picker-body">
          <aside class="library-picker-sidebar">
            <button
              type="button"
              class="library-picker-filter"
              :class="{ active: activeCategoryId === 'all' }"
              @click="activeCategoryId = 'all'"
            >
              <span>Alle</span>
              <small>{{ items.length }}</small>
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="library-picker-filter"
              :class="{ active: activeCategoryId === category.id }"
              @click="activeCategoryId = category.id"
            >
              <span>{{ category.name }}</span>
              <small>{{ countByCategory(category.id) }}</small>
            </button>
          </aside>

          <div class="library-picker-grid-wrap">
            <div class="library-selected">
              {{ selectedItem ? `Valgt billede: ${selectedItem.name} · ${categoryLabel(selectedItem.categoryId)}` : 'Intet billede valgt endnu.' }}
            </div>

            <div v-if="!visibleItems.length" class="library-empty">
              Der er endnu ingen billeder i den valgte kategori.
            </div>

            <div v-else class="library-grid">
              <button
                v-for="item in visibleItems"
                :id="`libraryModalItem-${item.id}`"
                :key="item.id"
                type="button"
                class="library-item"
                :class="{ active: selectedItem?.id === item.id }"
                @click="selectedItemId = item.id"
              >
                <img class="library-thumb" :src="item.imageUrl" :alt="item.name" loading="lazy" decoding="async" />
                <div class="library-name">{{ item.name }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { IMAGE_LIBRARY_UNCATEGORIZED_ID } from '@/features/library/library.data';
import type { LibraryCategory, LibraryItem } from '@/features/library/library.types';

const props = defineProps<{
  open: boolean;
  title: string;
  subtitle: string;
  items: LibraryItem[];
  categories: LibraryCategory[];
  selectedItemId?: string;
  selectedCategoryId?: string;
}>();

const emit = defineEmits<{
  close: [];
  pick: [item: LibraryItem];
  upload: [file: File, categoryId: string];
}>();

let titleSequence = 0;
const titleId = `library-picker-title-${++titleSequence}`;
const activeCategoryId = ref('all');
const selectedItemId = ref('');

watch(
  () => props.open,
  isOpen => {
    if (!isOpen) return;
    activeCategoryId.value = props.selectedCategoryId ?? 'all';
    selectedItemId.value = props.selectedItemId ?? props.items[0]?.id ?? '';
  },
  { immediate: true },
);

watch(
  () => props.selectedItemId,
  next => {
    if (props.open) {
      selectedItemId.value = next ?? props.items[0]?.id ?? '';
    }
  },
);

function handleKeydown(event: KeyboardEvent) {
  if (!props.open || event.key !== 'Escape') return;
  emit('close');
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const visibleItems = computed(() =>
  activeCategoryId.value === 'all'
    ? props.items
    : props.items.filter(item => item.categoryId === activeCategoryId.value),
);

const selectedItem = computed(() => visibleItems.value.find(item => item.id === selectedItemId.value) ?? visibleItems.value[0] ?? null);

watch(
  visibleItems,
  nextItems => {
    if (!props.open || !nextItems.length) return;
    if (!nextItems.some(item => item.id === selectedItemId.value)) {
      selectedItemId.value = nextItems[0]?.id ?? '';
    }
  },
);

function categoryLabel(categoryId: string) {
  return props.categories.find(category => category.id === categoryId)?.name ?? 'Ukategoriseret';
}

function countByCategory(categoryId: string) {
  return props.items.filter(item => item.categoryId === categoryId).length;
}

function stepSelection(delta: number) {
  if (!visibleItems.value.length) return;
  const currentIndex = Math.max(
    0,
    visibleItems.value.findIndex(item => item.id === selectedItem.value?.id),
  );
  const nextIndex = (currentIndex + delta + visibleItems.value.length) % visibleItems.value.length;
  selectedItemId.value = visibleItems.value[nextIndex]?.id ?? selectedItemId.value;
}

function applySelection() {
  if (!selectedItem.value) return;
  emit('pick', selectedItem.value);
}

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const categoryId = activeCategoryId.value === 'all' ? IMAGE_LIBRARY_UNCATEGORIZED_ID : activeCategoryId.value;
  emit('upload', file, categoryId);
  input.value = '';
}
</script>

<style scoped>
.library-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 24, 48, 0.62);
}

.library-dialog {
  width: min(1040px, 100%);
  max-height: min(90vh, 860px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
}

.library-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.library-title {
  color: var(--navy-dark);
  font-size: 1.15rem;
  font-weight: 800;
}

.library-sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.93rem;
}

.library-close {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 1.9rem;
  line-height: 1;
  cursor: pointer;
}

.library-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: #fbfcfe;
}

.library-upload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: #fff;
  color: var(--navy);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.library-upload:hover {
  border-color: var(--navy-mid);
}

.library-upload input {
  display: none;
}

.library-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.library-count {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.library-picker-body {
  display: grid;
  grid-template-columns: minmax(200px, 0.6fr) minmax(0, 1.4fr);
  min-height: 0;
}

.library-picker-sidebar {
  padding: 16px;
  border-right: 1px solid var(--border);
  background: #f9fbfd;
  overflow: auto;
}

.library-picker-filter {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  font: inherit;
  font-size: 13px;
}

.library-picker-filter.active {
  border-color: rgba(15, 70, 123, 0.32);
  background: rgba(15, 70, 123, 0.06);
  color: var(--navy-dark);
}

.library-picker-filter small {
  color: var(--muted);
}

.library-picker-grid-wrap {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  overflow: auto;
}

.library-selected {
  padding: 12px 14px;
  border: 1px solid rgba(15, 65, 114, 0.18);
  border-radius: 12px;
  background: rgba(15, 65, 114, 0.04);
  color: var(--navy);
  font-size: 13px;
  font-weight: 600;
}

.library-empty {
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  color: var(--muted);
  background: #fbfcfe;
  line-height: 1.6;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.library-item {
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  overflow: clip;
  text-align: left;
  box-shadow: 0 8px 20px rgba(9, 38, 68, 0.04);
  cursor: pointer;
}

.library-item.active {
  border-color: rgba(15, 70, 123, 0.32);
  box-shadow: 0 14px 24px rgba(15, 70, 123, 0.1);
}

.library-thumb {
  display: block;
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.library-name {
  padding: 12px 12px 13px;
  color: var(--navy-dark);
  font-size: 0.95rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .library-dialog {
    max-height: 92vh;
  }

  .library-picker-body {
    grid-template-columns: 1fr;
  }

  .library-picker-sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
}

@media (max-width: 640px) {
  .library-head,
  .library-toolbar {
    padding-left: 14px;
    padding-right: 14px;
  }

  .library-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>
