<template>
  <div class="page-stack branches-workspace">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Grene</p>
            <h1 class="page-title">Gren-oversigt</h1>
          </div>
        </div>
      </template>

      <div class="branches-layout">
        <div class="branches-list">
          <button
            v-for="branch in branchCards"
            :key="branch.id"
            type="button"
            class="branch-card"
            :class="{ active: selectedBranch?.id === branch.id }"
            @click="selectBranch(branch.id)"
          >
            <div class="branch-card-head">
              <div>
                <div class="branch-card-title">{{ branch.label }}</div>
                <div class="branch-card-sub">{{ branch.ageRange }}</div>
              </div>
              <span class="pill">{{ branch.memberCount }} medlemmer</span>
            </div>
            <div class="branch-card-copy">{{ branch.focus }}</div>
            <div class="branch-card-meta">
              <span v-for="day in branch.meetingDays" :key="day" class="info-chip">{{ day }}</span>
            </div>
          </button>
        </div>

        <aside class="branch-detail-panel">
          <section class="calendar-date-panel">
            <div class="calendar-date-panel-head">
              <div>
                <div class="calendar-date-panel-title">
                  {{ selectedBranch ? selectedBranch.label : 'Vælg en gren' }}
                </div>
                <div class="calendar-date-panel-sub" v-if="selectedBranch">
                  {{ selectedBranch.ageRange }} · {{ selectedBranch.memberCount }} medlemmer
                </div>
              </div>
            </div>

            <div v-if="selectedBranch" class="member-detail-grid">
              <div class="member-detail-item">
                <div class="member-detail-label">Alder</div>
                <div class="member-detail-value">{{ selectedBranch.ageRange }}</div>
              </div>
              <div class="member-detail-item">
                <div class="member-detail-label">Fokus</div>
                <div class="member-detail-value">{{ selectedBranch.focus }}</div>
              </div>
              <div class="member-detail-item">
                <div class="member-detail-label">Mødedage</div>
                <div class="member-detail-value">{{ selectedBranch.meetingDays.join(', ') }}</div>
              </div>
            </div>
          </section>

          <section class="calendar-date-panel">
            <div class="calendar-date-panel-head">
              <div>
                <div class="calendar-date-panel-title">Medlemmer i grenen</div>
                <div class="calendar-date-panel-sub">{{ branchMembers.length }} tilknyttede medlemmer</div>
              </div>
            </div>

            <div class="stacked-list">
              <article v-for="member in branchMembers" :key="member.id" class="member-compact-row">
                <span class="member-av">{{ member.initials }}</span>
                <div class="member-card-main">
                  <div class="member-card-title">{{ member.name }}</div>
                  <div class="member-card-meta">
                    <span>{{ member.team }}</span>
                    <span>{{ member.weekday }}</span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </aside>
      </div>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { useBranchesPage } from '@/features/branches/useBranchesPage';

const { branchCards, branchMembers, selectedBranch, selectBranch } = useBranchesPage();
</script>
