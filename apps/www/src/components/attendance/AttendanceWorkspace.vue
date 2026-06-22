<template>
  <div class="page-stack attendance-workspace">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Fremmøde</p>
            <h1 class="page-title">Kalender og check-in</h1>
          </div>

          <div class="attendance-toolbar">
            <div class="calendar-view-switch">
              <button
                v-for="mode in viewModes"
                :key="mode.id"
                type="button"
                class="calendar-view-btn"
                :class="{ active: viewMode === mode.id }"
                @click="setViewMode(mode.id)"
              >
                {{ mode.label }}
              </button>
            </div>

            <div class="month-nav">
              <button type="button" class="calendar-day-btn" @click="shiftSelection(-1)">‹</button>
              <div>
                <div class="month-nav-title">{{ currentTitle }}</div>
                <div class="month-nav-sub">{{ currentSubtitle }}</div>
              </div>
              <button type="button" class="calendar-day-btn" @click="shiftSelection(1)">›</button>
            </div>
          </div>
        </div>
      </template>

      <div class="attendance-layout" :class="`attendance-layout--${viewMode}`">
        <section class="attendance-main">
          <div v-if="viewMode === 'year'" class="year-calendar-grid">
            <article v-for="month in yearCards" :key="month.monthIndex" class="year-month">
              <h2 class="year-month-title">{{ month.title }}</h2>
              <div class="year-weekdays">
                <span v-for="label in weekdayLabels" :key="label" class="year-weekday">{{ label }}</span>
              </div>
              <div class="year-days">
                <button
                  v-for="cell in month.cells"
                  :key="cell.isoDate"
                  type="button"
                  class="year-day"
                  :class="{
                    'other-month': !cell.inMonth,
                    today: cell.isoDate === todayIso,
                    selected: cell.isoDate === selectedDate,
                    'has-meetings': meetingsByDate.has(cell.isoDate),
                    'past-day': cell.isoDate < todayIso,
                  }"
                  @click="selectDate(cell.isoDate)"
                >
                  {{ cell.date.getDate() }}
                </button>
              </div>
            </article>
          </div>

          <div v-else-if="viewMode === 'month'" class="month-card">
            <div class="month-head">
              <div>
                <div class="month-title">{{ currentMonthLabel }}</div>
                <div class="month-meta">{{ dayMeetings.length }} hold på valgt dag</div>
              </div>
            </div>
            <div class="month-grid">
              <div v-for="label in weekdayLabels" :key="label" class="month-day-label">{{ label }}</div>
              <button
                v-for="cell in currentMonthCells"
                :key="cell.isoDate"
                type="button"
                class="month-day"
                :class="{
                  'other-month': !cell.inMonth,
                  today: cell.isoDate === todayIso,
                  selected: cell.isoDate === selectedDate,
                  'past-day': cell.isoDate < todayIso,
                  'has-meetings': meetingsByDate.has(cell.isoDate),
                }"
                @click="selectDate(cell.isoDate)"
              >
                <span class="month-day-num">{{ cell.date.getDate() }}</span>
                <span v-if="meetingsByDate.get(cell.isoDate)?.length" class="month-day-badge">
                  {{ meetingsByDate.get(cell.isoDate)?.length }} hold
                </span>
              </button>
            </div>
          </div>

          <div v-else-if="viewMode === 'week'" class="week-grid">
            <div v-for="label in weekdayLabels" :key="label" class="week-day-header">{{ label }}</div>
            <article
              v-for="cell in currentWeekCells"
              :key="cell.isoDate"
              class="week-day"
              :class="{
                today: cell.isoDate === todayIso,
                selected: cell.isoDate === selectedDate,
                'past-day': cell.isoDate < todayIso,
              }"
              @click="selectDate(cell.isoDate)"
            >
              <div class="week-day-num">{{ cell.date.getDate() }}</div>
              <div class="week-day-events">
                <button
                  v-for="meeting in meetingsByDate.get(cell.isoDate) ?? []"
                  :key="meeting.id"
                  type="button"
                  class="week-day-event"
                  @click.stop="selectDate(cell.isoDate)"
                >
                  {{ meeting.title }} · {{ meeting.time }}
                </button>
                <div v-if="!(meetingsByDate.get(cell.isoDate)?.length)" class="week-day-more">Ingen hold</div>
              </div>
            </article>
          </div>

          <div v-else class="day-timeline-shell">
            <div class="day-view-header">
              <div>
                <div class="day-view-title">{{ currentDateLabel }}</div>
                <div class="day-view-sub">{{ dayMeetings.length }} hold på dagen</div>
              </div>
              <span class="pill">{{ currentDateShortLabel }}</span>
            </div>

            <div class="day-timeline-all-day">
              <span>Hele dagen</span>
            </div>

            <div class="day-timeline-list">
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
                <div class="day-event-summary">{{ meeting.summary }}</div>
              </button>
            </div>
          </div>
        </section>

        <aside class="attendance-side">
          <section class="calendar-date-panel">
            <div class="calendar-date-panel-head">
              <div>
                <div class="calendar-date-panel-title">Hold</div>
                <div class="calendar-date-panel-sub">{{ dayMeetings.length }} hold på dagen</div>
              </div>
            </div>
            <div class="calendar-date-meetings">
              <button
                v-for="meeting in dayMeetings"
                :key="meeting.id"
                type="button"
                class="calendar-date-meeting"
                :class="{ active: selectedMeeting?.id === meeting.id }"
                @click="selectMeeting(meeting.id)"
              >
                <div class="calendar-date-meeting-main">
                  <div class="calendar-date-meeting-title">{{ meeting.title }}</div>
                  <div class="calendar-date-meeting-sub">
                    {{ meeting.time }} · {{ branchLabel(meeting.branchId) }} · {{ meeting.location }}
                  </div>
                </div>
                <div class="calendar-date-meeting-badge">{{ meeting.capacity }} pladser</div>
              </button>
              <div v-if="!dayMeetings.length" class="calendar-empty">Ingen hold på denne dato.</div>
            </div>
          </section>

          <section class="calendar-date-panel">
            <div class="calendar-date-panel-head">
              <div>
                <div class="calendar-date-panel-title">Filter</div>
                <div class="calendar-date-panel-sub">Vis hold efter gren</div>
              </div>
            </div>
            <div class="day-filter-list">
                <button
                  v-for="branch in attendanceBranches"
                  :key="branch.id"
                  type="button"
                  class="day-filter-btn"
                  :class="{ active: isBranchActive(branch.id) }"
                  @click="toggleBranch(branch.id)"
                >
                  <span class="label">{{ branch.label }}</span>
                  <span class="count">{{ branch.id }}</span>
                </button>
            </div>
          </section>

          <section class="day-search-panel">
            <div class="calendar-date-panel-title">Medlemmer</div>
            <input
              class="day-search-input"
              type="search"
              placeholder="Søg medlem"
              :value="searchTerm"
              @input="onSearchInput"
            />
          </section>

          <section class="calendar-date-panel">
            <div class="calendar-date-panel-head">
              <div>
                <div class="calendar-date-panel-title">
                  {{ selectedMeeting ? selectedMeeting.title : 'Vælg et hold' }}
                </div>
                <div class="calendar-date-panel-sub" v-if="selectedMeeting">
                  {{ selectedMeeting.time }} · {{ branchLabel(selectedMeeting.branchId) }} · {{ selectedMeeting.location }}
                </div>
              </div>
              <span v-if="selectedMeeting" class="pill">{{ meetingSummary.arrived }}/{{ filteredMembers.length }}</span>
            </div>

            <div v-if="selectedMeeting" class="attendance-summary">
              <span class="att-chip present">{{ meetingSummary.arrived }} ankommet</span>
              <span class="att-chip absent">{{ meetingSummary.waiting }} afventer</span>
            </div>

            <div class="attendance-member-list">
              <button
                v-for="member in filteredMembers"
                :key="member.id"
                type="button"
                class="member-row"
                :class="selectedMeeting && isArrived(selectedMeeting.id, member.id) ? 'arrived' : 'waiting'"
                @click="selectedMeeting && toggleArrival(selectedMeeting.id, member.id)"
              >
                <span class="member-av">{{ member.initials }}</span>
                <span class="member-name">{{ member.name }}</span>
                <span class="member-check">{{ selectedMeeting && isArrived(selectedMeeting.id, member.id) ? '✓' : '○' }}</span>
              </button>
              <div v-if="selectedMeeting && !filteredMembers.length" class="calendar-empty">Ingen medlemmer matcher den valgte gren eller søgning.</div>
              <div v-if="!selectedMeeting" class="calendar-empty">Vælg et hold for at se check-in.</div>
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
import { useAttendancePage } from '@/features/attendance/useAttendancePage';

const {
  attendanceBranches,
  currentDateLabel,
  currentDateShortLabel,
  currentMonthCells,
  currentMonthLabel,
  currentWeekCells,
  dayMeetings,
  filteredMembers,
  meetingMembers,
  meetingSummary,
  meetingsByDate,
  selectedDate,
  selectedMeeting,
  selectedMeetingId,
  selectDate,
  selectMeeting,
  searchTerm,
  setSearchTerm,
  setViewMode,
  shiftSelection,
  toggleArrival,
  toggleBranch,
  isBranchActive,
  viewMode,
  yearCards,
  branchLabel,
} = useAttendancePage();

const viewModes = [
  { id: 'day', label: 'Dag' },
  { id: 'week', label: 'Uge' },
  { id: 'month', label: 'Måned' },
  { id: 'year', label: 'År' },
] as const;

const weekdayLabels = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const todayIso = new Date().toISOString().slice(0, 10);

const currentTitle = computed(() =>
  viewMode.value === 'day'
    ? 'Dagvisning'
    : viewMode.value === 'week'
      ? 'Ugevisning'
      : viewMode.value === 'month'
        ? 'Månedvisning'
        : 'Årvisning',
);

const currentSubtitle = computed(() =>
  viewMode.value === 'year'
    ? '12 måneder i én oversigt'
    : currentDateLabel.value,
);

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  setSearchTerm(target?.value ?? '');
}

function isArrived(meetingId: string, memberId: string) {
  return meetingMembers(meetingId).some(member => member.id === memberId && member.arrived);
}
</script>
