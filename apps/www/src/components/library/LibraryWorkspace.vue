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
            <button type="button" class="btn-action" @click="resetLibrary">Nulstil</button>
          </div>
        </div>
      </template>

      <div class="library-layout">
        <aside class="library-sidebar">
          <div class="library-sidebar-head">
            <div>
              <div class="library-sidebar-title">Kilder</div>
              <div class="library-sidebar-sub">{{ typeCounts.all }} billeder</div>
            </div>
            <span class="pill pill--soft">{{ activeTypeLabel }}</span>
          </div>

          <div class="library-type-list" role="tablist" aria-label="Billedkilder">
            <button
              v-for="option in libraryTypeOptions"
              :key="option.id"
              type="button"
              class="library-type-btn"
              :class="{ active: activeType === option.id }"
              :aria-pressed="activeType === option.id"
              @click="selectType(option.id)"
            >
              <span>{{ option.label }}</span>
              <span class="pill">{{ typeCounts[option.id] }}</span>
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
                :alt="editing ? draft.title : selectedItem.title"
              />
              <div class="library-preview-empty" v-else>Ingen billeder i denne visning.</div>
            </div>

            <div class="library-detail-body" v-if="selectedItem">
              <div class="library-detail-head">
                <div>
                  <p class="card-kicker">Valgt billede</p>
                  <h2 class="card-title">{{ editing ? draft.title : selectedItem.title }}</h2>
                </div>
                <span class="pill">{{ selectedTypeLabel }}</span>
              </div>

              <p class="lead library-summary">{{ editing ? draft.summary : selectedItem.summary }}</p>

              <div v-if="editing" class="library-form-grid">
                <label class="field">
                  <span class="field-label">Navn</span>
                  <input v-model="draft.title" class="field-input" type="text" />
                </label>
                <label class="field">
                  <span class="field-label">Type</span>
                  <select v-model="draft.type" class="field-input">
                    <option v-for="option in libraryTypeOptions.slice(1)" :key="option.id" :value="option.id">
                      {{ option.label }}
                    </option>
                  </select>
                </label>
                <label class="field field--wide">
                  <span class="field-label">Link</span>
                  <input v-model="draft.imageUrl" class="field-input" type="text" readonly />
                </label>
              </div>

              <div v-else class="info-strip">
                <span class="info-chip">{{ selectedItem.sourceLabel }}</span>
                <span class="info-chip">{{ selectedItem.title }}</span>
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
              <img class="library-card-image" :src="item.imageUrl" :alt="item.title" />
              <div class="library-card-body">
                <div class="library-card-head">
                  <h3 class="library-card-title">{{ item.title }}</h3>
                  <span class="pill pill--soft">{{ typeLabel(item.type) }}</span>
                </div>
                <p class="library-card-copy">{{ item.summary }}</p>
              </div>
            </button>
          </div>
        </section>
      </div>

      <input ref="uploadInput" class="sr-only" type="file" accept="image/*" @change="handleUpload" />
      <input ref="replaceInput" class="sr-only" type="file" accept="image/*" @change="handleReplace" />
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import PageCard from '@/components/PageCard.vue';
import { useLibraryPage } from '@/features/library/useLibraryPage';

const {
  activeType,
  activeTypeLabel,
  copySelectedLink,
  deleteSelectedItem,
  draft,
  editing,
  libraryTypeOptions,
  resetLibrary,
  replaceSelectedImage,
  saveDraft,
  selectItem,
  selectType,
  selectedItem,
  selectedTypeLabel,
  startEditing,
  typeCounts,
  typeLabel,
  uploadItem,
  visibleItems,
  cancelEditing,
} = useLibraryPage();

const uploadInput = ref<HTMLInputElement | null>(null);
const replaceInput = ref<HTMLInputElement | null>(null);

function triggerUpload() {
  uploadInput.value?.click();
}

function triggerReplace() {
  replaceInput.value?.click();
}

function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const type = activeType.value === 'all' ? 'event' : activeType.value;
  uploadItem(file, type);
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
</script>

<style scoped>
.library-workspace {
  gap: 0;
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
