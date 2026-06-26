<template>
  <div class="page-stack members-workspace">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Medlemmer</p>
            <h1 class="page-title">Samlet medlemsliste</h1>
          </div>

          <div class="filter-tabs filter-tabs--tight" role="tablist" aria-label="Medlemsfilter">
            <button
              v-for="option in statusOptions"
              :key="option.id"
              type="button"
              class="filter-tab"
              :class="{ active: statusFilter === option.id }"
              @click="setStatusFilter(option.id)"
            >
              {{ option.label }}
              <span class="filter-tab-count">{{ option.count }}</span>
            </button>
          </div>
        </div>
      </template>

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
              <img v-if="member.imageUrl" class="member-card-image" :src="member.imageUrl" :alt="member.name" />
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
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { computed, ref } from 'vue';
import LibraryPickerModal from '@/components/library/LibraryPickerModal.vue';
import { useLibraryPage } from '@/features/library/useLibraryPage';
import { useMembersPage } from '@/features/members/useMembersPage';
import type { LibraryItem } from '@/features/library/library.types';

const {
  branchFilter,
  branchOptions,
  clearMemberImage,
  counts,
  filteredMembers,
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

const pickerOpen = ref(false);

const statusOptions = computed(() => [
  { id: 'all' as const, label: 'Alle', count: counts.value.total },
  { id: 'active' as const, label: 'Aktive', count: counts.value.active },
  { id: 'inactive' as const, label: 'Inaktive', count: counts.value.inactive },
]);

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  searchTerm.value = target?.value ?? '';
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
