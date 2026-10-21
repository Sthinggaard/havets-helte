<template>
  <AdminPageTemplate title="Samlet medlemsliste" copy="Opret, find og administrer foreningens medlemmer.">
    <div class="page-stack members-workspace">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Medlemmer</p>
            <h1 class="page-title">Samlet medlemsliste</h1>
          </div>

          <div class="filter-tabs filter-tabs--tight" role="group" aria-label="Medlemsfilter">
            <button
              v-for="option in statusOptions"
              :key="option.id"
              type="button"
              class="filter-tab"
              :class="{ active: statusFilter === option.id }"
              :aria-pressed="statusFilter === option.id"
              @click="setStatusFilter(option.id)"
            >
              {{ option.label }}
              <span class="filter-tab-count">{{ option.count }}</span>
            </button>
          </div>
        </div>
      </template>

      <div class="member-create-launch">
        <button type="button" class="btn-action btn-action--primary" aria-haspopup="dialog" @click="openCreateMember">Opret medlem</button>
      </div>

      <Teleport to="body">
      <dialog ref="createDialog" class="member-dialog member-create-dialog" aria-labelledby="member-create-title" @click="onDialogClick">
        <h2 id="member-create-title" class="member-create-title">Opret medlem</h2>
        <form class="member-create-form" @submit.prevent="handleCreateMember">
          <label class="field">
            <span class="field-label">Navn</span>
            <input v-model="memberName" class="field-input" type="text" autocomplete="name" placeholder="Fulde navn" autofocus />
          </label>

          <label class="field">
            <span class="field-label">Gren</span>
            <select v-model="memberBranchId" class="field-input">
              <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">
                {{ branch.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span class="field-label">Hold</span>
            <select v-model="memberTeam" class="field-input" :disabled="!memberTeamOptions.length">
              <option v-if="!memberTeamOptions.length" value="">Opret først et hold</option>
              <option v-for="team in memberTeamOptions" :key="team.id" :value="team.label">
                {{ team.label }} · {{ team.weekday }}<template v-if="team.startTime && team.endTime"> · {{ team.startTime }}–{{ team.endTime }}</template><template v-if="team.seasonStartDate && team.seasonEndDate"> · {{ formatSeasonDate(team.seasonStartDate) }}–{{ formatSeasonDate(team.seasonEndDate) }}</template>
              </option>
            </select>
          </label>

          <label class="field">
            <span class="field-label">Fødselsår</span>
            <input
              v-model.number="memberBirthYear"
              class="field-input"
              type="number"
              min="1900"
              :max="currentYear"
              inputmode="numeric"
            />
          </label>

          <label class="member-create-switch">
            <input v-model="memberActive" type="checkbox" />
            <span>Aktiv</span>
          </label>

          <p v-if="memberError" class="member-create-error" role="alert">{{ memberError }}</p>
          <div class="member-create-actions">
            <button type="button" class="btn-action" @click="createDialog?.close()">Annuller</button>
            <button type="submit" class="btn-action btn-action--primary">Opret medlem</button>
          </div>
        </form>

      </dialog>
      </Teleport>

      <section class="members-toolbar">
        <input
          class="day-search-input"
          type="search"
          placeholder="Søg medlem"
          :value="searchTerm"
          @input="onSearchInput"
        />

        <div class="day-filter-list member-gren-filters">
          <button
            type="button"
            class="day-filter-btn"
            :class="{ active: branchFilter === 'all' }"
            @click="setBranchFilter('all')"
          >
            <span class="label">Alle grene</span>
            <span class="count">{{ counts.total }}</span>
          </button>
          <button
            v-for="branch in branchOptions"
            :key="branch.id"
            type="button"
            class="day-filter-btn"
            :class="{ active: branchFilter === branch.id }"
            @click="setBranchFilter(branch.id)"
          >
            <span class="label">{{ branch.label }}</span>
            <span class="count">{{ branch.id }}</span>
          </button>
        </div>
      </section>

        <div class="members-list legacy-member-list member-directory">
          <button
            v-for="member in filteredMembers"
            :key="member.id"
            type="button"
            class="member-card-shell"
            :class="{ active: selectedMember?.id === member.id }"
            aria-haspopup="dialog"
            @click="openMemberProfile(member.id)"
          >
            <div class="member-card-main">
              <img v-if="member.imageUrl" class="member-card-image" :src="member.imageUrl" :alt="member.name" loading="lazy" decoding="async" />
              <div class="member-card-top">
                <div class="member-card-head">
                  <span class="member-av">{{ member.initials }}</span>
                  <div class="member-card-copy-block">
                    <div class="ec-title">{{ member.name }}</div>
                    <div class="ec-meta member-card-chip-row">
                      <span class="member-status-chip" :class="member.active ? 'active' : 'inactive'">
                        {{ member.active ? 'Aktiv' : 'Inaktiv' }}
                      </span>
                      <span class="member-team-chip">{{ member.branchLabel }}</span>
                      <span class="member-day-chip">{{ member.team }}</span>
                      <span class="member-day-chip">{{ member.weekday }}</span>
                    </div>
                  </div>
                </div>
                <i class="ti ti-chevron-right member-card-chevron" aria-hidden="true"></i>
              </div>
            </div>
          </button>

          <div v-if="!filteredMembers.length" class="calendar-empty">Ingen medlemmer matcher filteret.</div>
        </div>

      <Teleport to="body">
      <dialog ref="profileDialog" class="member-dialog member-profile-dialog" aria-labelledby="member-profile-title" @click="onDialogClick">
        <div class="member-profile-close">
          <button type="button" class="btn-action" autofocus @click="profileDialog?.close()">Luk</button>
        </div>
        <div class="member-profile-panel legacy-member-panel">
          <section class="member-profile-card">
            <div class="member-profile-card-head">
              <div>
                <h2 id="member-profile-title" class="member-profile-title">
                  {{ selectedMember ? selectedMember.name : 'Vælg et medlem' }}
                </h2>
                <div class="member-profile-sub" v-if="selectedMember">
                  {{ selectedMember.branchLabel }} · {{ selectedMember.team }} · {{ selectedMember.weekday }}
                </div>
              </div>
              <span v-if="selectedMember" class="member-status-chip" :class="selectedMember.active ? 'active' : 'inactive'">
                {{ selectedMember.active ? 'Aktiv' : 'Inaktiv' }}
              </span>
            </div>

            <div v-if="selectedMember" class="member-card-detail-grid">
              <div class="member-card-detail-item">
                <div class="member-card-detail-label">Nuværende gren</div>
                <div class="member-card-detail-value">{{ selectedMember.branchLabel }}</div>
              </div>
              <div class="member-card-detail-item">
                <div class="member-card-detail-label">Nuværende hold</div>
                <div class="member-card-detail-value">{{ selectedMember.team }}</div>
              </div>
              <div class="member-card-detail-item">
                <div class="member-card-detail-label">Status</div>
                <div class="member-card-detail-value">{{ selectedMember.active ? 'Aktiv' : 'Inaktiv' }}</div>
              </div>
              <div class="member-card-detail-item">
                <div class="member-card-detail-label">Fødselsår</div>
                <div class="member-card-detail-value">{{ selectedMember.birthYear }}</div>
              </div>
            </div>
          </section>

          <div class="member-profile-quick">
            <section class="member-profile-card">
              <div class="member-profile-card-head">
                <div>
                  <div class="member-profile-title">Billede</div>
                  <div class="member-profile-sub">Tilknyt et billede fra biblioteket</div>
                </div>
              </div>
              <div class="member-profile-actions">
                <button type="button" class="btn-action" :disabled="!selectedMember" @click="openImagePicker">
                  {{ selectedMember?.imageUrl ? 'Skift billede' : 'Vælg billede' }}
                </button>
                <button
                  v-if="selectedMember?.imageUrl"
                  type="button"
                  class="btn-action"
                  @click="clearMemberImage(selectedMember.id)"
                >
                  Fjern billede
                </button>
              </div>
            </section>

            <section class="member-profile-card">
              <div class="member-profile-card-head">
                <div>
                  <div class="member-profile-title">Flyt medlem</div>
                </div>
              </div>
              <form class="member-move-form" @submit.prevent="moveMember">
                <label class="field">
                  <span class="field-label">Gren</span>
                  <select v-model="moveBranchId" class="field-input">
                    <option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">{{ branch.label }}</option>
                  </select>
                </label>
                <label class="field">
                  <span class="field-label">Hold</span>
                  <select v-model="moveTeamId" class="field-input" :disabled="!moveTeamOptions.length">
                    <option v-if="!moveTeamOptions.length" value="">Ingen aktive hold i grenen</option>
                    <option v-for="team in moveTeamOptions" :key="team.id" :value="team.id">{{ team.label }} · {{ team.weekday }}</option>
                  </select>
                </label>
                <p v-if="moveError" class="member-create-error" role="alert">{{ moveError }}</p>
                <div class="member-profile-actions">
                  <button type="submit" class="btn-action" :disabled="!canMoveMember">Flyt medlem</button>
                </div>
                <p v-if="moveNotice" class="member-move-notice" role="status">{{ moveNotice }}</p>
              </form>
            </section>

            <section class="member-profile-card">
              <div class="member-profile-card-head">
                <div>
                  <div class="member-profile-title">Profilhistorik</div>
                  <div class="member-profile-sub">Seneste registrerede oplysninger</div>
                </div>
              </div>
              <div class="member-profile-history">
                <div v-for="item in timeline" :key="item.label" class="member-profile-history-row">
                  <div class="member-profile-history-main">
                    <div class="member-profile-history-title">{{ item.label }}</div>
                    <div class="member-profile-history-meta">{{ item.value }}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </dialog>
      </Teleport>

      <LibraryPickerModal
        :open="pickerOpen"
        title="Billedbibliotek"
        subtitle="Vælg et eksisterende billede eller upload et nyt."
        :items="items"
        :categories="categories"
        @close="closeImagePicker"
        @pick="handleImagePick"
        @upload="handleImageUpload"
      />
    </PageCard>
    </div>
  </AdminPageTemplate>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import AdminPageTemplate from '@/components/admin/AdminPageTemplate.vue';
import { computed, ref } from 'vue';
import LibraryPickerModal from '@/components/library/LibraryPickerModal.vue';
import { useLibraryPage } from '@/features/library/useLibraryPage';
import { useMembersPage } from '@/features/members/useMembersPage';
import type { LibraryItem } from '@/features/library/library.types';

const {
  branchFilter,
  branchOptions,
  clearMemberImage,
  createMember,
  counts,
  filteredMembers,
  memberActive,
  memberBirthYear,
  memberBranchId,
  memberError,
  memberName,
  memberTeam,
  memberTeamOptions,
  canMoveMember,
  moveBranchId,
  moveTeamId,
  moveTeamOptions,
  moveMember,
  moveError,
  moveNotice,
  searchTerm,
  selectedMember,
  selectMember,
  setBranchFilter,
  setMemberImage,
  setStatusFilter,
  statusFilter,
  timeline,
} = useMembersPage();

const { items, categories, uploadItem } = useLibraryPage();

function formatSeasonDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return Number.isFinite(year + month + day) ? `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}` : value;
}

const pickerOpen = ref(false);
const createDialog = ref<HTMLDialogElement | null>(null);
const profileDialog = ref<HTMLDialogElement | null>(null);

const currentYear = new Date().getFullYear();

const statusOptions = computed(() => [
  { id: 'all' as const, label: 'Alle', count: counts.value.total },
  { id: 'active' as const, label: 'Aktive', count: counts.value.active },
  { id: 'inactive' as const, label: 'Inaktive', count: counts.value.inactive },
]);

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  searchTerm.value = target?.value ?? '';
}

function openCreateMember() {
  memberError.value = '';
  createDialog.value?.showModal();
}

function onDialogClick(event: MouseEvent) {
  const dialog = event.currentTarget as HTMLDialogElement;
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    dialog.close();
  }
}

function handleCreateMember() {
  if (createMember()) createDialog.value?.close();
}

function openMemberProfile(memberId: string) {
  selectMember(memberId);
  profileDialog.value?.showModal();
}

function openImagePicker() {
  if (!selectedMember.value) return;
  // The existing library overlay must be outside the native dialog's top layer.
  profileDialog.value?.close();
  pickerOpen.value = true;
}

function closeImagePicker() {
  pickerOpen.value = false;
  profileDialog.value?.showModal();
}

function handleImagePick(item: LibraryItem) {
  if (!selectedMember.value) return;
  setMemberImage(selectedMember.value.id, item.imageUrl);
  closeImagePicker();
}

async function handleImageUpload(file: File, categoryId: string) {
  if (!selectedMember.value) return;
  const uploaded = await uploadItem(file, categoryId);
  if (uploaded) {
    setMemberImage(selectedMember.value.id, uploaded.imageUrl);
    closeImagePicker();
  }
}
</script>

<style scoped>
.member-create-launch {
  margin-bottom: 18px;
}

.member-dialog {
  width: min(520px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 24px;
  overflow-y: auto;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lift);
}

.member-dialog::backdrop {
  background: rgba(0, 15, 30, 0.55);
}

.member-profile-dialog {
  width: min(720px, calc(100% - 32px));
}

.member-profile-close {
  position: sticky;
  top: -24px;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  padding-block: 8px;
  background: var(--surface);
}

.member-profile-dialog h2 {
  margin: 0;
}

.member-directory .member-card-shell {
  max-width: none;
}

.member-create-title {
  margin: 0 0 20px;
  color: var(--navy);
  font-size: 20px;
  font-weight: 700;
}

.member-create-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: end;
}

.member-move-form {
  display: grid;
  gap: 16px;
}

.member-move-notice {
  margin: 0;
  color: var(--navy);
  font-size: 14px;
}

.member-create-form > .field:first-child {
  grid-column: 1 / -1;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.field-label {
  color: var(--navy-dark);
  font-size: 0.88rem;
  font-weight: 800;
}

.field-input {
  width: 100%;
  min-height: 44px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 16px;
}

.field-input:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 2px;
}

select.field-input {
  appearance: none;
  padding-right: 38px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23003366' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
}

.member-create-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: end;
  padding: 0 0 10px;
  color: var(--navy-dark);
  font-weight: 700;
}

.member-create-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  grid-column: 1 / -1;
}

.member-create-error {
  grid-column: 1 / -1;
  margin: 0;
  color: #c94853;
  font-size: 0.92rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .member-create-form {
    grid-template-columns: 1fr;
  }

  .member-create-switch {
    padding: 0;
  }
}
</style>
