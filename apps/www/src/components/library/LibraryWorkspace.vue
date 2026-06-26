<template>
  <div class="page-stack library-workspace">
    <PageCard>
      <template #header>
        <div class="workspace-header library-header">
          <div>
            <p class="eyebrow">Admin</p>
            <h1 class="page-title">Billedbibliotek</h1>
          </div>

          <div class="library-actions">
            <button type="button" class="btn-action btn-action--primary" @click="triggerUpload">
              Upload billede
            </button>
            <button type="button" class="btn-action" @click="openPicker">
              Vælg fra bibliotek
            </button>
            <button type="button" class="btn-action" @click="resetLibrary">Nulstil</button>
          </div>
        </div>
      </template>

      <div v-if="uploadError" class="library-upload-error" role="alert">
        <i class="ti ti-alert-triangle"></i>
        <span class="library-upload-error-text">{{ uploadError }}</span>
        <button type="button" class="library-upload-error-close" aria-label="Luk" @click="clearUploadError">×</button>
      </div>

      <div class="library-layout">
        <aside class="library-sidebar">
          <div class="library-sidebar-head">
            <div>
              <div class="library-sidebar-title">Kategorier</div>
              <div class="library-sidebar-sub">{{ categoryCounts.all }} billeder</div>
            </div>
            <span class="pill pill--soft">{{ activeCategoryLabel }}</span>
          </div>

          <div class="library-cat-add">
            <input
              v-model="newCategoryName"
              class="field-input"
              type="text"
              placeholder="Ny kategori"
              @keydown.enter.prevent="createNewCategory"
            />
            <button type="button" class="btn-action" @click="createNewCategory">Tilføj</button>
          </div>

          <div class="library-toolbar-actions library-category-actions">
            <button type="button" class="btn-action" @click="selectCategory('all')">Alle</button>
            <button
              type="button"
              class="btn-action"
              :disabled="!selectedCategory || selectedCategory.locked"
              @click="saveCategoryName"
            >
              Gem navn
            </button>
            <button
              type="button"
              class="btn-action btn-action--danger"
              :disabled="!selectedCategory || selectedCategory.locked"
              @click="deleteCategory"
            >
              Slet kategori
            </button>
          </div>

          <div class="library-selected-category">
            <span>Valgt kategori</span>
            <small>{{ selectedCategoryId === 'all' ? `Alle · ${categoryCounts.all}` : `${selectedCategoryLabel} · ${categoryCounts[selectedCategoryId] ?? 0}` }}</small>
          </div>

          <label class="field library-category-name-field">
            <span class="field-label">Kategori-navn</span>
            <input
              v-model="selectedCategoryName"
              class="field-input"
              type="text"
              :disabled="!selectedCategory || selectedCategory.locked"
              placeholder="Rediger navn"
            />
          </label>

          <div class="library-cat-list" role="tablist" aria-label="Bibliotekskategorier">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="library-cat-btn"
              :class="{ active: selectedCategoryId === category.id }"
              :aria-pressed="selectedCategoryId === category.id"
              @click="selectCategory(category.id)"
            >
              <span>{{ category.name }}</span>
              <small>{{ categoryCounts[category.id] ?? 0 }}</small>
            </button>
          </div>
        </aside>

        <section class="library-main">
          <section class="library-detail">
            <div class="library-preview">
              <img
                v-if="selectedItem"
                class="library-preview-image"
                :src="editing ? draft.imageUrl : selectedItem.imageUrl"
                :alt="editing ? draft.name : selectedItem.name"
              />
              <div class="library-preview-empty" v-else>Ingen billeder i denne visning.</div>
            </div>

            <div class="library-detail-body" v-if="selectedItem">
              <div class="library-detail-head">
                <div>
                  <p class="card-kicker">Valgt billede</p>
                  <h2 class="card-title">{{ editing ? draft.name : selectedItem.name }}</h2>
                </div>
                <span class="pill">{{ selectedCategoryLabel }}</span>
              </div>

              <p class="lead library-summary">{{ editing ? draft.summary : selectedItem.summary }}</p>

              <div v-if="editing" class="library-form-grid">
                <label class="field">
                  <span class="field-label">Navn</span>
                  <input v-model="draft.name" class="field-input" type="text" />
                </label>
                <label class="field">
                  <span class="field-label">Kategori</span>
                  <select v-model="draft.categoryId" class="field-input">
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                </label>
                <label class="field field--wide">
                  <span class="field-label">Beskrivelse</span>
                  <input v-model="draft.summary" class="field-input" type="text" />
                </label>
                <label class="field field--wide">
                  <span class="field-label">Link</span>
                  <input v-model="draft.imageUrl" class="field-input" type="text" readonly />
                </label>
              </div>

              <div v-else class="info-strip">
                <span class="info-chip">{{ selectedItem.sourceName }}</span>
                <span class="info-chip">{{ categoryLabel(selectedItem.categoryId) }}</span>
                <span class="info-chip">{{ selectedItem.imageUrl }}</span>
              </div>

              <div class="detail-actions library-actions-row">
                <button v-if="editing" type="button" class="btn-action btn-action--primary" @click="saveDraft">
                  Gem
                </button>
                <button v-if="editing" type="button" class="btn-action" @click="cancelEditing">
                  Annuller
                </button>
                <button v-else type="button" class="btn-action btn-action--primary" @click="startEditing">
                  Rediger billede
                </button>
                <button type="button" class="btn-action" @click="triggerReplace">
                  Skift billede
                </button>
                <button type="button" class="btn-action" @click="copyLink">
                  Kopiér link
                </button>
                <button type="button" class="btn-action btn-action--danger" @click="deleteSelectedItem">
                  Slet billede
                </button>
              </div>
            </div>
          </section>

          <div class="library-grid">
            <button
              v-for="item in visibleItems"
              :key="item.id"
              type="button"
              class="library-card"
              :class="{ active: selectedItem?.id === item.id }"
              @click="selectItem(item.id)"
            >
              <img class="library-card-image" :src="item.imageUrl" :alt="item.name" />
              <div class="library-card-body">
                <div class="library-card-head">
                  <h3 class="library-card-title">{{ item.name }}</h3>
                  <span class="pill pill--soft">{{ categoryLabel(item.categoryId) }}</span>
                </div>
                <p class="library-card-copy">{{ item.summary }}</p>
              </div>
            </button>
          </div>
        </section>
      </div>

      <input ref="uploadInput" class="sr-only" type="file" accept="image/*" @change="handleUpload" />
      <input ref="replaceInput" class="sr-only" type="file" accept="image/*" @change="handleReplace" />
      <LibraryPickerModal
        :open="pickerOpen"
        title="Billedbibliotek"
        subtitle="Vælg et eksisterende billede eller upload et nyt."
        :items="items"
        :categories="categories"
        :selected-item-id="selectedItem?.id"
        :selected-category-id="selectedCategoryId"
        @close="pickerOpen = false"
        @pick="handlePickerPick"
        @upload="handlePickerUpload"
      />
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import PageCard from '@/components/PageCard.vue';
import LibraryPickerModal from '@/components/library/LibraryPickerModal.vue';
import { IMAGE_LIBRARY_UNCATEGORIZED_ID } from '@/features/library/library.data';
import { useLibraryPage } from '@/features/library/useLibraryPage';

const {
  activeCategoryLabel,
  categories,
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
  uploadError,
  clearUploadError,
  uploadItem,
  visibleItems,
  cancelEditing,
} = useLibraryPage();

const uploadInput = ref<HTMLInputElement | null>(null);
const replaceInput = ref<HTMLInputElement | null>(null);
const pickerOpen = ref(false);
const newCategoryName = ref('');
const selectedCategoryName = ref('');

watch(
  selectedCategory,
  next => {
    selectedCategoryName.value = next?.name ?? '';
  },
  { immediate: true },
);

function triggerUpload() {
  uploadInput.value?.click();
}

function triggerReplace() {
  replaceInput.value?.click();
}

function openPicker() {
  pickerOpen.value = true;
}

async function createNewCategory() {
  if (await createCategory(newCategoryName.value)) {
    newCategoryName.value = '';
  }
}

async function saveCategoryName() {
  if (!selectedCategory.value || selectedCategory.value.locked) return;
  await renameSelectedCategory(selectedCategoryName.value);
}

async function deleteCategory() {
  const category = selectedCategory.value;
  if (!category || category.locked) return;
  if (!window.confirm(`Slet kategorien "${category.name}"? Billederne flyttes til ${categoryLabel(IMAGE_LIBRARY_UNCATEGORIZED_ID)}.`)) {
    return;
  }
  await deleteSelectedCategory();
}

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const categoryId = selectedCategoryId.value === 'all' ? IMAGE_LIBRARY_UNCATEGORIZED_ID : selectedCategoryId.value;
  await uploadItem(file, categoryId);
  input.value = '';
}

function handleReplace(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !selectedItem.value) return;
  startEditing();
  replaceSelectedImage(file);
  input.value = '';
}

async function copyLink() {
  try {
    await copySelectedLink();
  } catch {
    // Ignore clipboard failures in environments without user permissions.
  }
}

function handlePickerPick(item: { id: string; categoryId: string }) {
  selectCategory(item.categoryId);
  selectItem(item.id);
  pickerOpen.value = false;
}

async function handlePickerUpload(file: File, categoryId: string) {
  const uploaded = await uploadItem(file, categoryId);
  if (uploaded) {
    selectCategory(uploaded.categoryId);
    selectItem(uploaded.id);
    pickerOpen.value = false;
  }
}
</script>

<style scoped>
.library-workspace {
  gap: 0;
}

.library-upload-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid #f1c0c0;
  border-radius: 12px;
  background: #fdf2f2;
  color: #9b1c1c;
  font-size: 14px;
  line-height: 1.4;
}

.library-upload-error i {
  margin-top: 1px;
  flex: none;
}

.library-upload-error-text {
  flex: 1 1 auto;
}

.library-upload-error-close {
  flex: none;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}

.library-upload-error-close:hover {
  opacity: 0.7;
}

.library-header {
  align-items: center;
}

.library-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.library-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.85fr) minmax(0, 3.15fr);
  gap: 18px;
  align-items: start;
}

.library-sidebar,
.library-main {
  min-width: 0;
}

.library-sidebar {
  position: sticky;
  top: 24px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow);
}

.library-sidebar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.library-sidebar-title {
  color: var(--navy-dark);
  font-size: 1.02rem;
  font-weight: 800;
}

.library-sidebar-sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.92rem;
}

.library-cat-add {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.library-category-actions {
  margin: 0 0 12px 0;
}

.library-category-name-field {
  margin-bottom: 12px;
}

.library-selected-category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin: 0 0 12px 0;
  border: 1px solid rgba(15, 65, 114, 0.2);
  border-radius: 10px;
  background: rgba(15, 65, 114, 0.05);
  color: var(--navy);
  font-size: 13px;
  font-weight: 600;
}

.library-selected-category small {
  color: var(--muted);
  font-weight: 600;
}

.library-cat-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.library-cat-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  font-size: 13px;
}

.library-cat-btn.active {
  border-color: var(--navy);
  background: rgba(15, 65, 114, 0.06);
  color: var(--navy);
}

.library-cat-btn small {
  color: var(--muted);
}

.library-type-list {
  display: grid;
  gap: 10px;
}

.library-type-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(9, 38, 68, 0.04);
}

.library-type-btn.active {
  border-color: rgba(15, 70, 123, 0.3);
  background: linear-gradient(180deg, rgba(15, 70, 123, 0.08), rgba(15, 70, 123, 0.04));
  color: var(--navy-dark);
}

.library-main {
  display: grid;
  gap: 18px;
}

.library-detail {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 1.1fr);
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow);
}

.library-preview {
  min-height: 280px;
  border-radius: 18px;
  overflow: clip;
  background: linear-gradient(180deg, #f6f9fc 0%, #eaf2f8 100%);
}

.library-preview-image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 280px;
  object-fit: cover;
}

.library-preview-empty {
  display: grid;
  place-items: center;
  min-height: 280px;
  color: var(--muted);
  font-weight: 700;
}

.library-detail-body {
  display: grid;
  align-content: start;
  gap: 16px;
}

.library-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.library-summary {
  font-size: 0.98rem;
}

.library-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
}

.field--wide {
  grid-column: 1 / -1;
}

.field-label {
  color: var(--navy-dark);
  font-size: 0.88rem;
  font-weight: 800;
}

.field-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  color: var(--text);
  font: inherit;
}

.field-input:focus {
  outline: 2px solid rgba(15, 70, 123, 0.18);
  outline-offset: 1px;
}

.info-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.library-actions-row {
  flex-wrap: wrap;
}

.btn-action--danger {
  border-color: rgba(237, 95, 106, 0.2);
  color: #e95663;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.library-card {
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #fff;
  overflow: clip;
  text-align: left;
  box-shadow: 0 8px 20px rgba(9, 38, 68, 0.04);
  cursor: pointer;
}

.library-card.active {
  border-color: rgba(15, 70, 123, 0.32);
  box-shadow: 0 14px 24px rgba(15, 70, 123, 0.1);
}

.library-card-image {
  display: block;
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.library-card-body {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.library-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.library-card-title {
  margin: 0;
  color: var(--navy-dark);
  font-size: 1rem;
}

.library-card-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 980px) {
  .library-layout {
    grid-template-columns: 1fr;
  }

  .library-sidebar {
    position: static;
  }
}

@media (max-width: 760px) {
  .library-detail {
    grid-template-columns: 1fr;
  }

  .library-form-grid {
    grid-template-columns: 1fr;
  }

  .library-preview-image,
  .library-preview,
  .library-preview-empty {
    min-height: 220px;
  }
}
</style>
