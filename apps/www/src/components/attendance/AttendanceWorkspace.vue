<template>
  <PublicLandingPageShell
    content-width="70vw"
    hero-badge="Fremmøde"
    :hero-copy="heroCopy"
    :hero-count-label="heroCountLabel"
    hero-image="/og-sankthans.webp"
    hero-image-alt="Fremmøde"
    :hero-title="heroTitle"
    :section-chip="sectionChip"
    section-eyebrow="Check-in"
    :section-lead="sectionLead"
    :section-title="sectionTitle"
  >
    <template #info v-if="hasRequestedDate">
      <span class="info-chip">
        <i class="ti ti-calendar" aria-hidden="true"></i>
        {{ currentDateLabel }}
      </span>
      <span class="info-chip">
        <i class="ti ti-users" aria-hidden="true"></i>
        {{ meetingSummary.total }} {{ isSignupAttendance ? 'tilmeldinger' : 'medlemmer' }}
      </span>
      <span v-if="selectedMeeting" class="info-chip">
        <i class="ti ti-check" aria-hidden="true"></i>
        {{ meetingSummary.arrived }} ankommet
      </span>
    </template>

    <template #body>

      <div v-if="!hasRequestedDate" class="attendance-empty-state">
        <h2 class="attendance-empty-title">Vælg først en dag i admin</h2>
        <p class="attendance-empty-copy">Fremmøde kan kun startes fra admin, når en leder har valgt dagens hold.</p>
      </div>

      <div v-else-if="loading" class="attendance-empty-state" role="status">Henter tilmeldte…</div>
      <div v-else-if="loadError" class="attendance-empty-state" role="alert">
        <p>{{ loadError }}</p><button type="button" class="btn-action" @click="retryLoad">Prøv igen</button>
      </div>
      <div v-else class="attendance-center">
        <section class="attendance-controls">
          <div class="attendance-day-head">
            <div>
              <div class="day-view-title">{{ currentDateLabel }}</div>
              <div class="day-view-sub">{{ isSignupAttendance ? 'Tilmeldte til arrangementet' : `${dayMeetings.length} hold på dagen` }}</div>
            </div>
            <span class="pill">{{ currentDateShortLabel }}</span>
          </div>

          <div v-if="!isSignupAttendance" class="attendance-filter-group">
            <div class="group-title">Grene</div>
            <div class="day-filter-list">
              <button
                v-for="branch in attendanceBranches.filter(branch => dayMeetings.some(meeting => meeting.branchId === branch.id))"
                :key="branch.id"
                type="button"
                class="day-filter-btn"
                :class="{ active: isBranchActive(branch.id) }"
                @click="toggleBranch(branch.id)"
              >
                <span class="label">{{ branch.label }}</span>
              </button>
            </div>
          </div>

          <div v-if="dayMeetings.length > 1" class="attendance-filter-group">
            <div class="group-title">Hold</div>
            <div class="meeting-list">
              <button
                v-for="meeting in dayMeetings"
                :key="meeting.id"
                type="button"
                class="day-timeline-event"
                :class="{ active: selectedMeeting?.id === meeting.id }"
                @click="selectMeeting(meeting.id)"
              >
                <div class="day-timeline-event-head">
                  <div>
                    <div class="day-timeline-event-title">{{ meeting.title }}</div>
                    <div class="day-timeline-event-meta">{{ meeting.location }} · {{ branchLabel(meeting.branchId) }}</div>
                  </div>
                  <div class="day-timeline-event-time">{{ meeting.time }}</div>
                </div>
              </button>
              <div v-if="!dayMeetings.length" class="calendar-empty">Ingen hold på denne dato.</div>
            </div>
          </div>
        </section>

        <section class="attendance-members-panel">
          <div class="calendar-date-panel-head">
            <div>
              <div class="calendar-date-panel-title">
                {{ selectedMeeting ? selectedMeeting.title : isSignupAttendance ? 'Ingen tilmelding valgt' : 'Vælg et hold' }}
              </div>
              <div class="calendar-date-panel-sub" v-if="selectedMeeting">
                {{ [currentDateLabel, selectedMeeting.location, isSignupAttendance ? '' : branchLabel(selectedMeeting.branchId)].filter(Boolean).join(' · ') }}
              </div>
            </div>
            <div v-if="selectedMeeting" class="calendar-date-panel-meta">
              <span class="pill">{{ selectedMeeting.time }}</span>
              <span class="pill soft">{{ meetingSummary.arrived }}/{{ meetingSummary.total }}</span>
            </div>
          </div>

          <div v-if="selectedMeeting" class="attendance-summary">
            <span class="att-chip present">{{ meetingSummary.arrived }} ankommet</span>
            <span class="att-chip absent">{{ meetingSummary.waiting }} {{ meetingCompleted ? 'fraværende' : 'afventer' }}</span>
          </div>
          <p v-if="saveError" role="alert">{{ saveError }}</p>
          <p v-if="meetingCompleted" role="status">Registreringen er afsluttet. En leder kan rette den fra fremmødeoversigten.</p>

          <div class="day-search-panel">
            <input class="day-search-input" type="search"  :placeholder="isSignupAttendance ? 'Søg tilmeldt' : 'Søg medlem'" :aria-label="isSignupAttendance ? 'Søg tilmeldt' : 'Søg medlem'" :value="searchTerm" @input="onSearchInput" />
          </div>

          <div class="attendance-member-list">
            <button
              v-for="member in filteredMembers"
              :key="member.id"
              type="button"
              class="member-row"
              :disabled="meetingCompleted"
              :aria-pressed="!!selectedMeeting && isArrived(selectedMeeting.id, member.id)"
              :class="selectedMeeting && isArrived(selectedMeeting.id, member.id) ? 'arrived' : 'waiting'"
              @click="selectedMeeting && toggleArrival(selectedMeeting.id, member.id)"
            >
              <span class="member-av">{{ member.initials }}</span>
              <span class="member-name">{{ member.name }}</span>
              <span class="member-check">{{ selectedMeeting && isArrived(selectedMeeting.id, member.id) ? '✓' : '○' }}</span>
            </button>
            <div v-if="selectedMeeting && !filteredMembers.length" class="calendar-empty">{{ isSignupAttendance ? searchTerm ? 'Ingen tilmeldte matcher søgningen.' : 'Ingen bekræftede tilmeldinger til denne sektion.' : 'Ingen medlemmer matcher den valgte gren eller søgning.' }}</div>
            <div v-if="!selectedMeeting" class="calendar-empty">Ingen hold er valgt.</div>
          </div>
        </section>
      </div>
    </template>
  </PublicLandingPageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import PublicLandingPageShell from '@/components/public/PublicLandingPageShell.vue';
import { useAttendancePage } from '@/features/attendance/useAttendancePage';

const {
  isSignupAttendance,
  loading,
  loadError,
  retryLoad,
  attendanceBranches,
  branchLabel,
  currentDateLabel,
  currentDateShortLabel,
  dayMeetings,
  filteredMembers,
  hasRequestedDate,
  isArrived,
  isBranchActive,
  meetingSummary,
  meetingCompleted,
  saveError,
  searchTerm,
  selectedMeeting,
  selectMeeting,
  setSearchTerm,
  toggleArrival,
  toggleBranch,
} = useAttendancePage();

const heroTitle = computed(() => (selectedMeeting.value ? `Check-in · ${selectedMeeting.value.title}` : 'Check-in'));
const heroCopy = computed(() =>
  hasRequestedDate.value
    ? isSignupAttendance.value ? 'Tjek arrangementets tilmeldte ind.' : 'Tjek medlemmer ind fra dagens valgte hold.'
    : 'Start fremmøde fra admin ved at vælge en dag i kalenderen.',
);
const heroCountLabel = computed(() => (hasRequestedDate.value ? `${meetingSummary.value.total} ${isSignupAttendance.value ? 'tilmeldinger' : 'medlemmer'}` : 'Ingen dag valgt'));
const sectionTitle = computed(() => (selectedMeeting.value ? selectedMeeting.value.title : 'Fremmøde'));
const sectionChip = computed(() => (hasRequestedDate.value ? currentDateShortLabel.value : 'Afventer dag'));
const sectionLead = computed(() =>
  hasRequestedDate.value
    ? isSignupAttendance.value ? 'Tryk på dit navn for at tjekke ind.' : 'Dagen ligger over medlemslisten, og check-in sker direkte i den centrale liste.'
    : 'Siden bliver aktiveret fra admin, når en leder vælger dagens dato.',
);

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  setSearchTerm(target?.value ?? '');
}
</script>

<style scoped>
.attendance-center,
.attendance-controls,
.attendance-filter-group,
.attendance-members-panel,
.attendance-member-list,
.day-filter-list,
.meeting-list {
  display: grid;
  gap: 16px;
}

.workspace-header,
.workspace-info {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.workspace-header {
  justify-content: space-between;
}

.workspace-info {
  justify-content: flex-end;
}

.attendance-center {
  width: 100%;
  min-width: 0;
}

.calendar-date-panel-head,
.attendance-day-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.calendar-date-panel-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.attendance-empty-state {
  display: grid;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 12px 0 8px;
}

.attendance-empty-title,
.day-view-title,
.day-timeline-event-title,
.calendar-date-panel-title,
.group-title {
  color: var(--navy-dark);
  font-weight: 800;
}

.attendance-empty-title {
  margin: 0;
  font-size: 1.2rem;
}

.attendance-empty-copy,
.day-timeline-event-meta,
.calendar-date-panel-sub,
.calendar-empty {
  color: var(--muted);
}

.attendance-empty-copy,
.calendar-date-panel-sub,
.day-timeline-event-meta,
.day-view-sub {
  margin: 0;
  font-size: 0.92rem;
}

.info-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f4f8fb;
  color: var(--navy-dark);
  font-size: 0.84rem;
  font-weight: 700;
}

.day-timeline-event,
.member-row,
.day-filter-btn {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: inherit;
  text-align: left;
  font: inherit;
}

.day-timeline-event {
  padding: 14px 16px;
}

.day-timeline-event.active {
  border-color: var(--navy);
  box-shadow: 0 0 0 2px rgba(15, 65, 114, 0.12);
}

.day-timeline-event-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.day-timeline-event-time,
.pill {
  white-space: nowrap;
}

.day-filter-list {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.day-filter-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 52px;
  padding: 10px 12px;
}

.day-filter-btn.active {
  border-color: var(--navy);
  background: #f8fbff;
}

.label,
.member-name {
  color: var(--navy-dark);
  font-weight: 700;
}

.attendance-members-panel {
  padding: 18px;
  border: 1px solid rgba(216, 225, 234, 0.95);
  border-radius: 18px;
  background: #fbfdff;
}

.day-search-input {
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--text);
  font: inherit;
}

.attendance-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.att-chip,
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.att-chip.present {
  background: rgba(38, 121, 73, 0.12);
  color: #267949;
}

.att-chip.absent,
.pill {
  background: var(--row-bg);
  color: var(--navy);
}

.pill.soft {
  background: rgba(15, 65, 114, 0.08);
}

.member-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 8px 12px;
}

.member-row.arrived {
  border-color: rgba(38, 121, 73, 0.3);
  background: rgba(38, 121, 73, 0.06);
}

.member-av {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 999px;
  background: var(--gold-light);
  color: var(--navy);
  font-size: 0.86rem;
  font-weight: 800;
}

.member-check {
  text-align: center;
  color: var(--navy);
  font-size: 1.2rem;
  font-weight: 800;
}

@media (max-width: 700px) {
  .attendance-members-panel {
    padding: 14px;
  }
}
</style>
