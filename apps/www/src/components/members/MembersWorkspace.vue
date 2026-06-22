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

        <div class="day-filter-list">
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

      <div class="members-layout">
        <div class="members-list">
          <button
            v-for="member in filteredMembers"
            :key="member.id"
            type="button"
            class="member-card"
            :class="{ active: selectedMember?.id === member.id }"
            @click="selectMember(member.id)"
          >
            <div class="member-row-shell">
              <span class="member-av">{{ member.initials }}</span>
              <div class="member-card-main">
                <div class="member-card-title">{{ member.name }}</div>
                <div class="member-card-meta">
                  <span>{{ member.branchLabel }}</span>
                  <span>{{ member.team }}</span>
                  <span>{{ member.weekday }}</span>
                </div>
              </div>
              <span class="pill">{{ member.active ? 'Aktiv' : 'Inaktiv' }}</span>
            </div>
          </button>
          <div v-if="!filteredMembers.length" class="calendar-empty">Ingen medlemmer matcher filteret.</div>
        </div>

        <aside class="member-profile-panel">
          <section class="calendar-date-panel">
            <div class="calendar-date-panel-head">
              <div>
                <div class="calendar-date-panel-title">
                  {{ selectedMember ? selectedMember.name : 'Vælg et medlem' }}
                </div>
                <div class="calendar-date-panel-sub" v-if="selectedMember">
                  {{ selectedMember.branchLabel }} · {{ selectedMember.team }}
                </div>
              </div>
              <span v-if="selectedMember" class="pill">{{ selectedMember.active ? 'Aktiv' : 'Inaktiv' }}</span>
            </div>

            <div v-if="selectedMember" class="member-detail-grid">
              <div class="member-detail-item">
                <div class="member-detail-label">Gren</div>
                <div class="member-detail-value">{{ selectedMember.branchLabel }}</div>
              </div>
              <div class="member-detail-item">
                <div class="member-detail-label">Hold</div>
                <div class="member-detail-value">{{ selectedMember.team }}</div>
              </div>
              <div class="member-detail-item">
                <div class="member-detail-label">Mødedag</div>
                <div class="member-detail-value">{{ selectedMember.weekday }}</div>
              </div>
              <div class="member-detail-item">
                <div class="member-detail-label">Fødselsår</div>
                <div class="member-detail-value">{{ selectedMember.birthYear }}</div>
              </div>
            </div>
          </section>

          <section class="calendar-date-panel">
            <div class="calendar-date-panel-head">
              <div>
                <div class="calendar-date-panel-title">Profilhistorik</div>
                <div class="calendar-date-panel-sub">Seneste registrerede oplysninger</div>
              </div>
            </div>

            <div class="member-history">
              <div v-for="item in timeline" :key="item.label" class="member-history-row">
                <div class="member-history-label">{{ item.label }}</div>
                <div class="member-history-value">{{ item.value }}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { computed } from 'vue';
import { useMembersPage } from '@/features/members/useMembersPage';

const {
  branchFilter,
  branchOptions,
  counts,
  filteredMembers,
  searchTerm,
  selectedMember,
  selectMember,
  setBranchFilter,
  setStatusFilter,
  statusFilter,
  timeline,
} = useMembersPage();

const statusOptions = computed(() => [
  { id: 'all' as const, label: 'Alle', count: counts.value.total },
  { id: 'active' as const, label: 'Aktive', count: counts.value.active },
  { id: 'inactive' as const, label: 'Inaktive', count: counts.value.inactive },
]);

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  searchTerm.value = target?.value ?? '';
}
</script>
