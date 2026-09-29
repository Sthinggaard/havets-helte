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

      <section class="member-create-panel">
        <div class="member-create-head">
          <div>
            <p class="eyebrow">Nyt medlem</p>
            <h2 class="member-create-title">Opret medlem</h2>
          </div>
          <p class="member-create-copy">Det nye medlem bliver tilføjet til listen med det samme og kan vælges videre herfra.</p>
        </div>

        <form class="member-create-form" @submit.prevent="handleCreateMember">
          <label class="field">
            <span class="field-label">Navn</span>
            <input v-model="memberName" class="field-input" type="text" autocomplete="name" placeholder="Fulde navn" />
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

          <div class="member-create-actions">
            <p v-if="memberError" class="member-create-error" role="alert">{{ memberError }}</p>
            <button type="submit" class="btn-action btn-action--primary">Opret medlem</button>
          </div>
        </form>

      </section>

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

      <div class="members-layout members-layout--legacy">
        <div class="members-list legacy-member-list">
          <button
            v-for="member in filteredMembers"
            :key="member.id"
            type="button"
            class="member-card-shell"
            :class="{ active: selectedMember?.id === member.id }"
            @click="selectMember(member.id)"
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

        <aside class="member-profile-panel legacy-member-panel">
          <section class="member-profile-card">
            <div class="member-profile-card-head">
              <div>
                <div class="member-profile-title">
                  {{ selectedMember ? selectedMember.name : 'Vælg et medlem' }}
                </div>
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
                  <div class="member-profile-sub">Skift gren eller hold direkte herfra</div>
                </div>
              </div>
              <div class="member-profile-actions">
                <button type="button" class="btn-action" @click="setBranchFilter(selectedMember?.branchId ?? 'all')">
                  Til gren og hold
                </button>
              </div>
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
        </aside>
      </div>

      <LibraryPickerModal
        :open="pickerOpen"
        title="Billedbibliotek"
        subtitle="Vælg et eksisterende billede eller upload et nyt."
        :items="items"
        :categories="categories"
        @close="pickerOpen = false"
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

function handleCreateMember() {
  createMember();
}

function openImagePicker() {
  if (!selectedMember.value) return;
  pickerOpen.value = true;
}

function handleImagePick(item: LibraryItem) {
  if (!selectedMember.value) return;
  setMemberImage(selectedMember.value.id, item.imageUrl);
  pickerOpen.value = false;
}

async function handleImageUpload(file: File, categoryId: string) {
  if (!selectedMember.value) return;
  const uploaded = await uploadItem(file, categoryId);
  if (uploaded) {
    setMemberImage(selectedMember.value.id, uploaded.imageUrl);
    pickerOpen.value = false;
  }
}
</script>

<style scoped>
.member-create-panel {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(216, 225, 234, 0.92);
}

.member-create-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.member-create-title {
  margin: 0;
  color: var(--navy-dark);
  font-size: 1.02rem;
  font-weight: 800;
}

.member-create-copy {
  margin: 0;
  max-width: 560px;
  color: var(--muted);
  line-height: 1.5;
}

.member-create-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
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
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  grid-column: 1 / -1;
}

.member-create-error {
  margin: 0;
  color: #c94853;
  font-size: 0.92rem;
  font-weight: 600;
}

@media (max-width: 900px) {
  .member-create-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
