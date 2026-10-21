<template>
  <AdminPageTemplate title="Fremmøde" copy="Se deltagelsen over tid, og registrer fremmøde for foreningens hold.">
    <div class="page-stack">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Fremmøde</p>
            <h1 class="page-title">Fremmøde</h1>
          </div>

          <div class="filter-tabs filter-tabs--tight" role="group" aria-label="Visning">
            <button type="button" class="filter-tab" :class="{ active: view === 'overview' }" :aria-pressed="view === 'overview'" @click="view = 'overview'">Overblik</button>
            <button type="button" class="filter-tab" :class="{ active: view === 'calendar' }" :aria-pressed="view === 'calendar'" @click="view = 'calendar'; loadCalendarEvents()">Kalender og check-in</button>
          </div>
        </div>
      </template>

      <AttendanceDashboard v-if="view === 'overview'" />
      <template v-else>
          <p v-if="eventsLoading" role="status">Henter arrangementer…</p>
          <div v-if="eventsError" role="alert" class="calendar-load-error">
            <span>{{ eventsError }}</span>
            <button type="button" class="btn-action" @click="loadCalendarEvents">Prøv igen</button>
          </div>
          <div class="month-nav calendar-nav">
            <button type="button" class="calendar-day-btn" aria-label="Forrige måned" @click="shiftMonth(-1)">‹</button>
            <div>
              <div class="month-nav-title">{{ currentMonthLabel }}</div>
              <div class="month-nav-sub">{{ currentDateLabel }}</div>
            </div>
            <button type="button" class="calendar-day-btn" aria-label="Næste måned" @click="shiftMonth(1)">›</button>
          </div>

      <div class="attendance-setup-layout">
        <section class="month-card">
          <div class="month-grid">
            <div class="month-day-label">Uge</div>
            <div v-for="label in weekdayLabels" :key="label" class="month-day-label">{{ label }}</div>
            <template v-for="(cell, index) in currentMonthCells" :key="cell.isoDate">
            <div v-if="index % 7 === 0" class="week-number" :aria-label="`Uge ${isoWeekNumber(cell.date)}`">{{ isoWeekNumber(cell.date) }}</div>
            <button
              type="button"
              class="month-day"
              :class="{
                'other-month': !cell.inMonth,
                today: cell.isoDate === todayIso,
                selected: cell.isoDate === selectedDate,
                'has-meetings': meetingsByDate.get(cell.isoDate)?.length || eventsByDate.get(cell.isoDate)?.length,
              }"
              @click="selectDate(cell.isoDate)"
            >
              <span class="sr-only">{{ cell.isoDate }}: </span>
              <span class="month-day-num">{{ cell.date.getDate() }}</span>
              <span v-if="meetingsByDate.get(cell.isoDate)?.length" class="month-day-badge">
                {{ meetingsByDate.get(cell.isoDate)?.length }} hold
              </span>
              <span v-if="eventsByDate.get(cell.isoDate)?.length" class="month-event-label">
                <span aria-hidden="true">{{ eventsByDate.get(cell.isoDate)?.length }} arr.</span>
                <span class="sr-only">{{ eventsByDate.get(cell.isoDate)?.length }} arrangementer</span>
              </span>
            </button>
            </template>
          </div>
        </section>

        <aside class="calendar-date-panel">
          <div class="calendar-date-panel-head">
            <div>
              <div class="calendar-date-panel-title">{{ currentDateLabel }}</div>
              <div class="calendar-date-panel-sub">{{ selectedDateMeetings.length }} hold · {{ selectedDateEvents.length }} {{ selectedDateEvents.length === 1 ? 'arrangement' : 'arrangementer' }}</div>
            </div>
            <button type="button" class="btn-action btn-action--primary" :disabled="!canOpenAttendance" @click="openAttendance">
              Åbn fremmøde
            </button>
          </div>

          <div class="calendar-date-meetings">
            <h2 v-if="dayEntries.length" class="calendar-section-title">På dagen</h2>
            <button v-for="entry in dayEntries" :key="entry.id" type="button" class="calendar-date-meeting"
              :class="{ active: selectedEntry?.id === entry.id }" :disabled="!entry.query"
              :aria-pressed="selectedEntry?.id === entry.id" @click="selectEntry(entry.id)">
              <span class="calendar-date-meeting-main">
                <span class="calendar-date-meeting-title">{{ entry.title }}</span>
                <span v-if="entry.detail" class="calendar-date-meeting-sub">{{ entry.detail }}</span>
              </span>
              <span class="calendar-date-meeting-badge">{{ entry.badge }}</span>
            </button>
            <div v-if="!dayEntries.length" class="calendar-empty">Ingen hold eller arrangementer på denne dato.</div>
          </div>
        </aside>
      </div>
      </template>
    </PageCard>
    </div>
  </AdminPageTemplate>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import AdminPageTemplate from '@/components/admin/AdminPageTemplate.vue';
import { isoWeekNumber } from '@/features/attendance/attendanceCalendar';
import { useAttendanceSetupPage } from '@/features/attendance/useAttendanceSetupPage';
import { ref } from 'vue';
import AttendanceDashboard from './AttendanceDashboard.vue';

const view = ref<'overview' | 'calendar'>('overview');

const {
  dayEntries,
  selectedEntry,
  selectEntry,
  canOpenAttendance,
  eventsByDate,
  eventsError,
  eventsLoading,
  loadCalendarEvents,
  selectedDateEvents,
  currentDateLabel,
  currentMonthCells,
  currentMonthLabel,
  meetingsByDate,
  openAttendance,
  selectedDate,
  selectedDateMeetings,
  selectDate,
  shiftMonth,
  todayIso,
} = useAttendanceSetupPage();

const weekdayLabels = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
</script>

<style scoped>
.calendar-load-error { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.calendar-section-title { margin: 0; font-size: 1rem; color: var(--navy-dark); }
.month-event-label { display: block; margin-top: 6px; color: var(--navy-dark); font-size: 0.76rem; font-weight: 700; }
.calendar-date-meeting-main { min-width: 0; overflow-wrap: anywhere; }
.calendar-date-meetings { max-height: 420px; overflow-y: auto; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }

.workspace-header,
.month-nav,
.calendar-date-panel-head,
.attendance-setup-layout {
  display: flex;
  gap: 16px;
}

.workspace-header,
.calendar-date-panel-head {
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}

.month-nav {
  align-items: center;
}

.calendar-nav { justify-content: flex-end; margin-bottom: 20px; }

.month-nav-title {
  color: var(--navy-dark);
  font-size: 1rem;
  font-weight: 800;
}

.month-nav-sub,
.calendar-date-panel-sub,
.calendar-empty,
.month-day-label {
  color: var(--muted);
}

.month-nav-sub,
.calendar-date-panel-sub,
.calendar-date-meeting-sub,
.month-day-badge,
.month-day-label {
  font-size: 0.84rem;
}

.attendance-setup-layout {
  align-items: flex-start;
  flex-wrap: wrap;
}

.month-card,
.calendar-date-panel {
  flex: 1 1 360px;
}

.month-grid {
  display: grid;
  grid-template-columns: 28px repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.week-number { align-self: center; text-align: center; color: var(--muted); font-size: 0.8rem; font-variant-numeric: tabular-nums; }

.month-day-label {
  text-align: center;
  font-weight: 700;
}

.month-day {
  min-height: 88px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  text-align: left;
  color: var(--text);
  font: inherit;
}

.month-day.today {
  border-color: var(--navy-light);
}

.month-day.selected {
  border-color: var(--navy);
  box-shadow: 0 0 0 2px rgba(15, 65, 114, 0.12);
}

.month-day.other-month {
  opacity: 0.5;
}

.month-day.has-meetings {
  background: #f8fbff;
}

.month-day-num {
  display: block;
  color: var(--navy-dark);
  font-size: 1rem;
  font-weight: 800;
}

.month-day-badge {
  display: inline-flex;
  margin-top: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--row-bg);
  color: var(--navy);
  font-weight: 700;
}

.calendar-date-panel {
  display: grid;
  gap: 16px;
}

.calendar-date-panel-title,
.calendar-date-meeting-title {
  color: var(--navy-dark);
  font-weight: 800;
}

.calendar-date-meetings {
  display: grid;
  gap: 10px;
}

.calendar-date-meeting {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
}

.calendar-date-meeting {
  width: 100%;
  align-items: center;
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.calendar-date-meeting-title, .calendar-date-meeting-sub { display: block; }
.calendar-date-meeting.active { border-color: var(--navy); background: #f8fbff; }
.calendar-date-meeting:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }
.calendar-date-meeting:disabled { cursor: default; opacity: 1; }
@media (max-width: 480px) {
  .calendar-date-meeting { flex-wrap: wrap; }
}

.calendar-date-meeting-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--row-bg);
  color: var(--navy);
  font-size: 0.76rem;
  font-weight: 800;
  white-space: nowrap;
}

@media (max-width: 860px) {
  .month-grid {
    gap: 8px;
  }

  .month-day {
    min-height: 74px;
    padding: 8px;
  }
}
@media (max-width: 480px) {
  .month-grid { gap: 4px; grid-template-columns: 22px repeat(7, minmax(0, 1fr)); }
  .month-day { padding: 4px; }
  .month-day-badge { padding: 2px 3px; font-size: 0.7rem; }
  .month-event-label { font-size: 0.7rem; }
}
</style>
