<template>
  <div class="page-stack">
    <PageCard>
      <template #header>
        <div class="workspace-header">
          <div>
            <p class="eyebrow">Fremmøde</p>
            <h1 class="page-title">Vælg dag til check-in</h1>
          </div>

          <div class="month-nav">
            <button type="button" class="calendar-day-btn" @click="shiftMonth(-1)">‹</button>
            <div>
              <div class="month-nav-title">{{ currentMonthLabel }}</div>
              <div class="month-nav-sub">{{ currentDateLabel }}</div>
            </div>
            <button type="button" class="calendar-day-btn" @click="shiftMonth(1)">›</button>
          </div>
        </div>
      </template>

      <div class="attendance-setup-layout">
        <section class="month-card">
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
                'has-meetings': meetingsByDate.get(cell.isoDate)?.length,
              }"
              @click="selectDate(cell.isoDate)"
            >
              <span class="month-day-num">{{ cell.date.getDate() }}</span>
              <span v-if="meetingsByDate.get(cell.isoDate)?.length" class="month-day-badge">
                {{ meetingsByDate.get(cell.isoDate)?.length }} hold
              </span>
            </button>
          </div>
        </section>

        <aside class="calendar-date-panel">
          <div class="calendar-date-panel-head">
            <div>
              <div class="calendar-date-panel-title">{{ currentDateLabel }}</div>
              <div class="calendar-date-panel-sub">{{ selectedDateMeetings.length }} hold på dagen</div>
            </div>
            <button type="button" class="btn-action btn-action--primary" :disabled="!selectedDateMeetings.length" @click="openAttendance">
              Åbn fremmøde
            </button>
          </div>

          <div class="calendar-date-meetings">
            <article v-for="meeting in selectedDateMeetings" :key="meeting.id" class="calendar-date-meeting static">
              <div class="calendar-date-meeting-main">
                <div class="calendar-date-meeting-title">{{ meeting.title }}</div>
                <div class="calendar-date-meeting-sub">{{ meeting.time }} · {{ meeting.location }}</div>
              </div>
              <div class="calendar-date-meeting-badge">{{ meeting.capacity }} pladser</div>
            </article>
            <div v-if="!selectedDateMeetings.length" class="calendar-empty">Ingen hold på denne dato.</div>
          </div>
        </aside>
      </div>
    </PageCard>
  </div>
</template>

<script setup lang="ts">
import PageCard from '@/components/PageCard.vue';
import { useAttendanceSetupPage } from '@/features/attendance/useAttendanceSetupPage';

const {
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
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

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

.calendar-date-meeting.static {
  align-items: center;
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
</style>
