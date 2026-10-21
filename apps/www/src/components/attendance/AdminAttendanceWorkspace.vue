<template>
  <main class="attendance-workspace">
    <header class="workspace-heading">
      <h1>Fremmøde</h1>
      <div class="view-switch" role="group" aria-label="Visning">
        <button type="button" :class="{ active: view === 'overview' }" :aria-pressed="view === 'overview'" @click="view = 'overview'">Overblik</button>
        <button type="button" :class="{ active: view === 'calendar' }" :aria-pressed="view === 'calendar'" @click="view = 'calendar'; loadCalendarEvents()">Kalender</button>
      </div>
    </header>

    <section v-if="view === 'overview'" class="workspace-panel overview-panel"><AttendanceDashboard /></section>
    <template v-else>
      <dl class="calendar-summary workspace-panel">
        <div><i class="ti ti-users" aria-hidden="true"></i><dt>Aktive medlemmer</dt><dd>{{ calendarSummary.members }}</dd></div>
        <div><i class="ti ti-calendar" aria-hidden="true"></i><dt>Aktive hold</dt><dd>{{ calendarSummary.teams }}</dd></div>
        <div><i class="ti ti-calendar-event" aria-hidden="true"></i><dt>Arrangementer i perioden</dt><dd>{{ eventsLoading || eventsError ? '—' : calendarSummary.events }}</dd></div>
      </dl>
      <p v-if="eventsLoading" role="status" class="calendar-load-status">Henter arrangementer…</p>
      <div v-if="eventsError" role="alert" class="calendar-load-error">
        <span>{{ eventsError }}</span><button type="button" class="calendar-control" @click="loadCalendarEvents">Prøv igen</button>
      </div>

      <div class="calendar-layout" :class="`calendar-layout--${calendarView}`">
        <section class="workspace-panel calendar-panel" aria-label="Kalender">
          <div class="calendar-toolbar">
            <div class="view-switch" role="group" aria-label="Kalendervisning">
              <button v-for="option in calendarViewOptions" :key="option.id" type="button" :class="{ active: calendarView === option.id }" :aria-pressed="calendarView === option.id" @click="setCalendarView(option.id)">{{ option.label }}</button>
            </div>
            <button type="button" class="calendar-control" @click="selectDate(todayIso)">I dag</button>
            <div class="calendar-navigation">
              <button type="button" class="calendar-control icon-control" :aria-label="`Forrige ${periodUnit}`" @click="shiftPeriod(-1)"><i class="ti ti-chevron-left" aria-hidden="true"></i></button>
              <button type="button" class="calendar-control icon-control" :aria-label="`Næste ${periodUnit}`" @click="shiftPeriod(1)"><i class="ti ti-chevron-right" aria-hidden="true"></i></button>
            </div>
            <h2 class="calendar-period">{{ calendarPeriodLabel }}</h2>
          </div>

          <div v-if="calendarView !== 'day'" class="calendar-scroll" tabindex="0" :aria-label="calendarView === 'month' ? 'Månedskalender' : 'Ugekalender'">
            <div class="calendar-grid" :class="{ 'calendar-grid--week': calendarView === 'week' }">
              <div class="calendar-label">Uge</div>
              <div v-for="label in weekdayLabels" :key="label" class="calendar-label">{{ label }}</div>
              <template v-for="(cell, index) in visibleCalendarCells" :key="cell.isoDate">
                <div v-if="index % 7 === 0" class="calendar-week" :aria-label="`Uge ${isoWeekNumber(cell.date)}`">{{ isoWeekNumber(cell.date) }}</div>
                <button type="button" class="calendar-day" :class="{ 'other-month': !cell.inMonth, today: cell.isoDate === todayIso, selected: cell.isoDate === selectedDate }"
                  :aria-pressed="cell.isoDate === selectedDate" :aria-current="cell.isoDate === todayIso ? 'date' : undefined" @click="selectDate(cell.isoDate)">
                  <span class="sr-only">{{ formatDateLong(cell.date) }}: </span>
                  <span class="calendar-day-number" aria-hidden="true">{{ cell.date.getDate() }}</span>
                  <span class="calendar-activities">
                    <span v-for="activity in (calendarActivitiesByDate.get(cell.isoDate) ?? []).slice(0, calendarView === 'week' ? 6 : 3)" :key="activity.id" class="calendar-activity" :class="`calendar-activity--${activity.kind}`" :title="activity.title">{{ activity.label }}</span>
                    <span v-if="(calendarActivitiesByDate.get(cell.isoDate)?.length ?? 0) > (calendarView === 'week' ? 6 : 3)" class="calendar-more">+ {{ (calendarActivitiesByDate.get(cell.isoDate)?.length ?? 0) - (calendarView === 'week' ? 6 : 3) }} flere</span>
                  </span>
                </button>
              </template>
            </div>
          </div>
        </section>

        <aside class="calendar-sidebar">
          <section class="workspace-panel selected-day-panel" aria-label="Den valgte dag">
            <header><h2>{{ calendarView === 'day' ? 'På dagen' : currentDateLabel }}</h2><p>{{ selectedDateMeetings.length }} hold · {{ selectedDateEvents.length }} {{ selectedDateEvents.length === 1 ? 'arrangement' : 'arrangementer' }}</p></header>
            <div class="day-choices">
              <button v-for="entry in dayEntries" :key="entry.id" type="button" class="day-choice" :class="{ selected: selectedEntry?.id === entry.id }" :disabled="!entry.query" :aria-pressed="selectedEntry?.id === entry.id" @click="selectEntry(entry.id)">
                <span class="choice-indicator" :class="{ checked: selectedEntry?.id === entry.id }" aria-hidden="true"></span>
                <span class="choice-copy"><strong>{{ entry.title }}</strong><small v-if="entry.detail">{{ entry.detail }}</small></span>
                <span class="entry-badge">{{ entry.badge }}</span>
              </button>
              <p v-if="!dayEntries.length" class="muted">Ingen hold eller arrangementer på denne dato.</p>
            </div>
            <button type="button" class="btn-action btn-action--primary open-attendance" :disabled="!canOpenAttendance" @click="openAttendance">Åbn fremmøde</button>
          </section>
          <section class="workspace-panel next-event-panel">
            <h2>Næste arrangement</h2>
            <p v-if="eventsLoading" class="muted">Henter arrangementer…</p>
            <p v-else-if="eventsError" class="muted">Arrangementer kunne ikke hentes.</p>
            <button v-else-if="nextEvent" type="button" class="next-event" @click="selectDate(nextEvent.date)">
              <span class="event-category">Arrangement</span><strong>{{ nextEvent.title }}</strong>
              <span>{{ formatDateLong(fromIsoDate(nextEvent.date)) }}</span>
              <small v-if="nextEvent.location">{{ nextEvent.location }}</small>
              <span class="next-event-link">Vis i kalender <i class="ti ti-chevron-right" aria-hidden="true"></i></span>
            </button>
            <p v-else class="muted">Ingen kommende arrangementer.</p>
          </section>
        </aside>
      </div>

      <section class="workspace-panel recent-panel" aria-labelledby="recent-attendance-title">
        <h2 id="recent-attendance-title">Seneste registreringer</h2>
        <p v-if="!recentRecords.length" class="muted">Ingen fremmøderegistreringer endnu.</p>
        <div v-else class="recent-table-scroll" tabindex="0" role="region" aria-label="Seneste fremmøderegistreringer">
          <table class="recent-table">
            <thead><tr><th scope="col">Dato</th><th scope="col">Hold / arrangement</th><th scope="col">Fremmøde</th><th scope="col">Status</th></tr></thead>
            <tbody><tr v-for="record in recentRecords" :key="record.meeting.id">
              <td>{{ formatDateShort(fromIsoDate(record.meeting.date)) }}</td>
              <td><button type="button" class="record-link" @click="register?.open(record)">{{ record.meeting.title }}</button></td>
              <td>{{ record.presentMemberIds.length }} af {{ record.expectedMembers.length }}</td>
              <td><span class="record-status" :class="{ complete: record.completedAt }">{{ record.completedAt ? 'Afsluttet' : 'Foreløbig' }}</span></td>
            </tr></tbody>
          </table>
        </div>
        <p v-if="savedNotice" role="status">{{ savedNotice }}</p>
      </section>
      <AttendanceRegisterDialog ref="register" @saved="savedNotice = 'Fremmødet er gemt på denne enhed.'" />
    </template>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { formatDateLong, formatDateShort, fromIsoDate, isoWeekNumber } from '@/features/attendance/attendanceCalendar';
import { useAttendanceSetupPage } from '@/features/attendance/useAttendanceSetupPage';
import AttendanceDashboard from './AttendanceDashboard.vue';
import AttendanceRegisterDialog from './AttendanceRegisterDialog.vue';

const view = ref<'overview' | 'calendar'>('calendar');
const register = ref<InstanceType<typeof AttendanceRegisterDialog> | null>(null);
const savedNotice = ref('');
const {
  calendarView, setCalendarView, calendarPeriodLabel, periodUnit, shiftPeriod, visibleCalendarCells,
  calendarSummary, calendarActivitiesByDate, nextEvent, recentRecords,
  dayEntries, selectedEntry, selectEntry, canOpenAttendance, eventsError, eventsLoading, loadCalendarEvents,
  selectedDateEvents, currentDateLabel, openAttendance, selectedDate, selectedDateMeetings, selectDate, todayIso,
} = useAttendanceSetupPage();
onMounted(loadCalendarEvents);
const calendarViewOptions = [{ id: 'month', label: 'Måned' }, { id: 'week', label: 'Uge' }, { id: 'day', label: 'Dag' }] as const;
const weekdayLabels = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
</script>

<style scoped>
.attendance-workspace { width: min(1480px, calc(100% - 48px)); margin: 28px auto 48px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; color: var(--text); }
.workspace-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.workspace-heading h1 { margin: 0; color: var(--navy); font-size: clamp(28px, 3vw, 38px); letter-spacing: -0.025em; }
h2 { margin: 0; color: var(--navy-dark); font-size: 19px; line-height: 1.35; }
.workspace-panel { min-width: 0; border: 1px solid #dce3eb; border-radius: 12px; background: var(--surface); }
.overview-panel { padding: 24px; }
.view-switch { display: inline-flex; flex-shrink: 0; overflow: hidden; border: 1px solid #d6dfe8; border-radius: 8px; }
.view-switch button { min-height: 42px; padding: 9px 18px; border: 0; border-right: 1px solid #d6dfe8; background: transparent; color: var(--navy); font: inherit; font-size: 14px; cursor: pointer; }
.view-switch button:last-child { border-right: 0; }
.view-switch button.active { background: var(--navy); color: #fff; }
.view-switch button:not(.active):hover, .calendar-control:hover { background: var(--navy-soft); }
button:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.calendar-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; padding: 18px 0; }
.calendar-summary div { display: flex; align-items: center; gap: 9px; padding: 0 24px; }
.calendar-summary div + div { border-left: 1px solid #e0e5eb; }
.calendar-summary i { color: var(--muted); font-size: 22px; margin-right: 6px; }
.calendar-summary dt { order: 2; font-size: 14px; }
.calendar-summary dd { order: 1; margin: 0; font-size: 19px; font-weight: 700; color: var(--navy-dark); font-variant-numeric: tabular-nums; }
.calendar-summary i { order: 0; }
.calendar-layout { display: grid; grid-template-columns: minmax(0, 2.4fr) minmax(300px, 1fr); gap: 16px; align-items: start; }
.calendar-panel { padding: 16px; min-width: 0; }
.calendar-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
.calendar-control { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 8px 14px; border: 1px solid #d6dfe8; border-radius: 7px; color: var(--navy); background: var(--surface); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.icon-control { width: 38px; padding: 8px; }
.calendar-navigation { display: flex; gap: 7px; }
.calendar-period { font-size: 17px; flex: 1 1 160px; }
.calendar-scroll { overflow-x: auto; border: 1px solid #dce3eb; border-radius: 7px; }
.calendar-grid { display: grid; grid-template-columns: 38px repeat(7, minmax(0, 1fr)); min-width: 610px; gap: 1px; background: #e1e6ec; }
.calendar-label { padding: 11px 2px; background: #f7f8fa; color: #535f70; text-align: center; text-transform: uppercase; font-size: 11px; font-weight: 700; }
.calendar-week { display: grid; place-items: center; color: #4f5d6d; background: #f7f8fa; font-size: 12px; font-variant-numeric: tabular-nums; }
.calendar-day { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 6px; min-width: 0; min-height: 102px; padding: 8px 6px; border: 0; border-radius: 0; background: #fff; color: var(--navy-dark); text-align: left; font: inherit; cursor: pointer; }
.calendar-day:hover { background: #f4f8fc; }
.calendar-day.selected { background: #eef5fc; outline: 2px solid var(--navy); outline-offset: -2px; z-index: 1; }
.calendar-day.today:not(.selected) { outline: 2px solid var(--accent); outline-offset: -2px; }
.calendar-day.other-month .calendar-day-number { color: #7d8998; }
.calendar-day.other-month .calendar-activities { opacity: 0.65; }
.calendar-day-number { padding: 0 3px; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.calendar-activities { display: grid; gap: 4px; }
.calendar-activity { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 4px 5px; border-radius: 4px; background: #e2eefb; color: var(--navy-dark); font-size: 11px; line-height: 1.2; }
.calendar-activity--event { background: #def2f5; color: #105d72; }
.calendar-more { padding-left: 4px; color: var(--muted); font-size: 11px; }
.calendar-grid--week { min-width: 760px; }
.calendar-grid--week .calendar-day { min-height: 210px; }
.calendar-grid--week .calendar-activity { white-space: normal; }
.calendar-sidebar { display: grid; gap: 14px; min-width: 0; }
.selected-day-panel, .next-event-panel { padding: 18px; }
.selected-day-panel { display: grid; gap: 18px; }
.selected-day-panel header p { margin: 7px 0 0; color: var(--muted); font-size: 13px; }
.day-choices { display: grid; gap: 10px; max-height: 360px; overflow-y: auto; }
.day-choice { display: flex; align-items: center; gap: 10px; width: 100%; padding: 14px 12px; border: 1px solid #dce3eb; border-radius: 8px; color: var(--navy-dark); background: #fff; text-align: left; font: inherit; cursor: pointer; }
.day-choice.selected { background: #eef5fc; border-color: #b6cde6; }
.day-choice:disabled { opacity: 1; cursor: default; }
.choice-indicator { display: grid; flex: 0 0 17px; height: 17px; place-items: center; border: 1px solid #9aa9ba; border-radius: 50%; }
.choice-indicator.checked { border-color: var(--navy); }
.choice-indicator.checked::after { content: ''; width: 9px; height: 9px; border-radius: 50%; background: var(--navy); }
.choice-copy { flex: 1; min-width: 0; }
.day-choice strong { display: block; font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; }
.day-choice small { display: block; margin-top: 4px; color: var(--muted); font-size: 12px; line-height: 1.4; }
.entry-badge { flex-shrink: 0; padding: 5px 7px; border-radius: 5px; color: var(--navy-dark); background: #edf0f4; font-size: 11px; }
.open-attendance { width: 100%; min-height: 46px; font-size: 16px; }
.next-event { display: grid; justify-items: start; gap: 9px; width: 100%; margin-top: 18px; padding: 0; background: none; border: 0; font: inherit; color: var(--navy-dark); text-align: left; cursor: pointer; }
.next-event strong { font-size: 18px; }
.next-event > span:not(.event-category) { font-size: 13px; }
.next-event small { color: var(--muted); font-size: 13px; }
.event-category { display: inline-block; padding: 4px 8px; border-radius: 4px; color: #105d72; background: #def2f5; font-size: 12px; }
.next-event .next-event-link { display: inline-flex; align-items: center; gap: 8px; color: var(--navy); margin-top: 4px; font-weight: 600; }
.muted, .calendar-load-status { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.5; }
.next-event-panel > .muted, .recent-panel > .muted { margin-top: 14px; }
.calendar-load-error { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; color: #a92338; font-size: 14px; }
.recent-panel { padding: 18px; }
.recent-table-scroll { overflow-x: auto; margin-top: 14px; border: 1px solid #e1e6ec; border-radius: 8px; }
.recent-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
.recent-table th, .recent-table td { padding: 10px 16px; border-bottom: 1px solid #e1e6ec; }
.recent-table th { background: #f7f8fa; color: #535f70; font-size: 12px; font-weight: 600; }
.recent-table tr:last-child td { border-bottom: 0; }
.recent-table td:first-child { white-space: nowrap; }
.record-link { border: 0; background: transparent; color: var(--navy-dark); font: inherit; font-weight: 600; text-align: left; cursor: pointer; }
.record-link:hover { text-decoration: underline; }
.record-status { display: inline-block; padding: 4px 8px; border-radius: 4px; background: #fff2d8; color: #77520f; white-space: nowrap; font-size: 12px; }
.record-status.complete { background: var(--success); color: #21492b; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.calendar-layout--day { grid-template-columns: minmax(0, 1fr); }
.calendar-layout--day .calendar-sidebar { grid-template-columns: minmax(0, 2.4fr) minmax(300px, 1fr); }
@media (max-width: 1100px) { .calendar-layout { grid-template-columns: minmax(0, 1fr); } .calendar-sidebar { grid-template-columns: repeat(2, minmax(0, 1fr)); } .calendar-grid { min-width: 610px; } }
@media (max-width: 700px) {
  .attendance-workspace { width: calc(100% - 28px); margin-top: 20px; gap: 14px; }
  .workspace-heading { gap: 12px; flex-wrap: wrap; }
  .calendar-summary { padding: 0 14px; grid-template-columns: 1fr; }
  .calendar-summary div { padding: 12px 0; }
  .calendar-summary div + div { border-left: 0; border-top: 1px solid #e0e5eb; }
  .calendar-summary dt { flex: 1; }
  .calendar-summary dd { order: 2; }
  .calendar-summary dt { order: 1; }
  .calendar-sidebar { grid-row: 1; grid-template-columns: 1fr; }
  .calendar-layout--day .calendar-sidebar { grid-row: auto; grid-template-columns: minmax(0, 1fr); }
  .calendar-panel { padding: 12px; }
  .calendar-toolbar { gap: 8px; }
  .view-switch button { padding-inline: 14px; }
  .calendar-period { flex-basis: 100%; margin-top: 4px; }
  .overview-panel { padding: 16px; }
  .day-choice { flex-wrap: wrap; }
  .choice-copy { flex-basis: calc(100% - 32px); }
  .entry-badge { margin-left: 27px; }
  .recent-table { min-width: 550px; }
}
</style>
