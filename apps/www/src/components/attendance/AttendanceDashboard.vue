<template>
  <section class="attendance-dashboard" aria-label="Overblik over fremmøde og fravær">
    <div class="dashboard-heading">
      <div><h2>Hvem møder op?</h2><p>Fremmøde og fravær fra afsluttede registreringer.</p></div>
      <button type="button" class="btn-action btn-action--primary" @click="register?.open()">Registrer fremmøde</button>
    </div>

    <div class="dashboard-filters">
      <label>Periode<FormControl v-model="period" as="select"><option value="year">Dette år</option><option value="quarter">Seneste 90 dage</option><option value="all">Alle registreringer</option></FormControl></label>
      <label>Gren<FormControl v-model="branchId" as="select"><option value="all">Alle grene</option><option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.label }}</option></FormControl></label>
      <label>Hold<FormControl v-model="teamId" as="select"><option value="all">Alle hold</option><option v-for="team in teams" :key="team.id" :value="team.id">{{ branchId === 'all' ? `${branchLabel(team.branchId)} · ` : '' }}{{ team.label }}</option></FormControl></label>
    </div>

    <dl class="attendance-totals">
      <div><dt>Samlet fremmøde</dt><dd>{{ summary.rate === null ? 'Ingen data' : `${summary.rate} %` }}</dd><small>{{ summary.present }} fremmøder af {{ summary.expected }} mulige</small></div>
      <div><dt>Afsluttede møder</dt><dd>{{ summary.meetings }}</dd><small>I den valgte periode</small></div>
      <div><dt>Medlemmer med data</dt><dd>{{ summary.withData }} <span>af {{ summary.members }}</span></dd><small>{{ summary.withAbsence }} med registreret fravær</small></div>
    </dl>

    <div v-if="!summary.withData" class="dashboard-empty">
      <h3>Der er endnu ingen afsluttede registreringer</h3>
      <p>Registrer fremmøde for et hold for at se deltagelsen her. Medlemmer uden data får ingen fremmødeprocent.</p>
    </div>

    <div class="dashboard-list-heading">
      <h3>Aktive medlemmer</h3>
      <label class="absence-filter"><input v-model="onlyAbsence" type="checkbox" /> Kun medlemmer med fravær</label>
    </div>
    <div class="dashboard-search">
      <FormControl v-model="search" type="search" placeholder="Søg medlem" aria-label="Søg medlem" />
      <label><span class="sr-only">Sortering</span><FormControl v-model="sort" as="select"><option value="lowest">Lavest fremmøde først</option><option value="highest">Højest fremmøde først</option><option value="absence">Flest fravær i træk</option><option value="name">Navn A–Å</option></FormControl></label>
    </div>

    <div class="attendance-table-wrap">
      <table class="attendance-table">
        <caption class="sr-only">Medlemmernes deltagelse i afsluttede møder. Klik på et navn for at se registreringerne.</caption>
        <thead><tr><th scope="col">Medlem</th><th scope="col">Fremmøde</th><th scope="col">Fravær</th><th scope="col">Senest mødt</th></tr></thead>
        <tbody>
          <template v-for="row in rows" :key="row.member.id">
            <tr>
              <th scope="row"><button type="button" class="member-history-toggle" :aria-expanded="expandedId === row.member.id" @click="expandedId = expandedId === row.member.id ? '' : row.member.id">{{ row.member.name }}<i class="ti" :class="expandedId === row.member.id ? 'ti-chevron-up' : 'ti-chevron-down'" aria-hidden="true"></i></button><small>{{ branchLabel(row.member.branchId) }} · {{ row.member.team }}</small></th>
              <td><strong>{{ row.rate === null ? 'Ingen data' : `${row.rate} %` }}</strong><small v-if="row.total">{{ row.present }} af {{ row.total }} {{ row.total === 1 ? 'møde' : 'møder' }}</small></td>
              <td>{{ row.total ? `${row.absent} ${row.absent === 1 ? 'møde' : 'møder'}` : '—' }}<small v-if="row.consecutiveAbsences">{{ row.consecutiveAbsences }} i træk</small></td>
              <td>{{ row.lastPresent ? shortDate(row.lastPresent) : '—' }}</td>
            </tr>
            <tr v-if="expandedId === row.member.id" class="member-history"><td colspan="4"><p v-if="!row.total">Ingen registreringer i perioden.</p><ol v-else><li v-for="meeting in row.meetings" :key="meeting.meetingId"><span>{{ shortDate(meeting.date) }}</span><span :class="meeting.present ? 'history-present' : 'history-absent'">{{ meeting.present ? 'Mødt' : 'Fravær' }}</span></li></ol></td></tr>
          </template>
          <tr v-if="!rows.length"><td colspan="4" class="table-empty">Ingen medlemmer matcher filtrene.</td></tr>
        </tbody>
      </table>
    </div>

    <section class="dashboard-records" aria-labelledby="attendance-records-title">
      <h3 id="attendance-records-title">Registreringer</h3>
      <p v-if="!records.length" class="muted">Ingen registreringer i den valgte periode.</p>
      <div v-else class="record-list">
        <button v-for="record in records" :key="record.meeting.id" type="button" class="record-row" @click="register?.open(record)">
          <span><strong>{{ record.meeting.title }}</strong><small>{{ shortDate(record.meeting.date) }} · {{ record.presentMemberIds.length }} af {{ record.expectedMembers.length }} mødt</small></span>
          <span class="record-state" :class="{ complete: record.completedAt }">{{ record.completedAt ? 'Afsluttet' : 'Skal afsluttes' }}<i class="ti ti-chevron-right" aria-hidden="true"></i></span>
        </button>
      </div>
    </section>
    <p v-if="savedNotice" class="saved-notice" role="status">{{ savedNotice }}</p>
    <AttendanceRegisterDialog ref="register" @saved="savedNotice = 'Fremmødet er gemt, og oversigten er opdateret.'" />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormControl from '@/components/form/FormControl.vue';
import AttendanceRegisterDialog from './AttendanceRegisterDialog.vue';
import { useAttendanceDashboard } from '@/features/attendance/useAttendanceDashboard';
import { fromIsoDate } from '@/features/attendance/attendanceCalendar';

const { period, branchId, teamId, search, sort, onlyAbsence, branches, teams, rows, summary, records, branchLabel } = useAttendanceDashboard();
const register = ref<InstanceType<typeof AttendanceRegisterDialog> | null>(null);
const expandedId = ref('');
const savedNotice = ref('');
function shortDate(date: string) { return fromIsoDate(date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }); }
</script>

<style scoped>
.attendance-dashboard { display: grid; gap: 24px; }
.dashboard-heading, .dashboard-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
h2, h3, p { margin: 0; }
h2 { font-size: 24px; color: var(--navy); }
h3 { font-size: 18px; color: var(--navy); }
.dashboard-heading p { margin-top: 6px; color: var(--muted); font-size: 14px; }
.dashboard-filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.dashboard-filters label { display: grid; gap: 6px; color: var(--navy); font-weight: 700; font-size: 14px; }
.attendance-dashboard :deep(.form-control) { min-height: 44px; font-size: 16px; }
.attendance-totals { display: grid; grid-template-columns: 1.15fr 1fr 1fr; margin: 0; padding-block: 24px; border-block: 1px solid var(--border-soft); gap: 20px; }
.attendance-totals dt { font-size: 14px; color: var(--muted); }
.attendance-totals dd { margin: 8px 0; font-size: 28px; font-weight: 700; color: var(--navy); font-variant-numeric: tabular-nums; }
.attendance-totals dd span { font-size: 18px; font-weight: 400; color: var(--muted); }
.attendance-totals small { color: var(--muted); font-size: 14px; }
.dashboard-empty { padding: 20px; background: #f5f8fb; border-radius: var(--radius-md); }
.dashboard-empty p { max-width: 65ch; margin-top: 8px; font-size: 14px; line-height: 1.6; color: var(--muted); }
.absence-filter { display: flex; gap: 8px; align-items: center; min-height: 44px; font-size: 14px; cursor: pointer; }
.absence-filter input { width: 18px; height: 18px; accent-color: var(--navy); }
.dashboard-search { display: grid; grid-template-columns: minmax(0, 1fr) minmax(210px, 0.5fr); gap: 12px; }
.attendance-table-wrap { max-height: 65dvh; overflow: auto; border: 1px solid var(--border-soft); border-radius: var(--radius-md); }
.attendance-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.attendance-table thead { position: sticky; top: 0; z-index: 1; background: #f6f8fa; }
.attendance-table th, .attendance-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--border-soft); vertical-align: middle; }
.attendance-table thead th { white-space: nowrap; font-weight: 700; color: var(--navy); }
.attendance-table tbody th { min-width: 220px; width: 45%; font-weight: 400; }
.attendance-table small { display: block; margin-top: 5px; font-weight: 400; font-size: 13px; color: var(--muted); }
.attendance-table td { font-variant-numeric: tabular-nums; }
.attendance-table td strong { color: var(--navy); }
.member-history-toggle { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 0; text-align: left; border: 0; background: none; color: var(--navy); font: inherit; font-weight: 700; cursor: pointer; }
.member-history-toggle i { flex-shrink: 0; }
.member-history-toggle:focus-visible, .record-row:focus-visible, .absence-filter input:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }
.member-history td { background: #f8fafb; }
.member-history ol { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); max-height: 240px; overflow-y: auto; gap: 10px; list-style: none; padding: 0; margin: 0; }
.member-history li { display: flex; justify-content: space-between; gap: 10px; padding: 8px; border-bottom: 1px solid var(--border-soft); }
.history-present { color: #246331; font-weight: 700; }
.history-absent { color: #a63737; font-weight: 700; }
.table-empty { color: var(--muted); }
.dashboard-records { display: grid; gap: 14px; }
.record-list { max-height: 340px; overflow-y: auto; }
.record-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; width: 100%; min-height: 64px; padding: 14px 4px; border: 0; border-bottom: 1px solid var(--border-soft); background: none; color: var(--navy); text-align: left; font: inherit; cursor: pointer; }
.record-row:hover, .attendance-table tbody > tr:not(.member-history):hover { background: #f5f8fb; }
.record-row small { display: block; margin-top: 5px; color: var(--muted); font-size: 14px; }
.record-state { display: inline-flex; align-items: center; gap: 12px; font-size: 14px; color: #8c541d; }
.record-state.complete { color: #246331; }
.muted { color: var(--muted); }
.saved-notice { color: var(--navy); font-size: 14px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (max-width: 650px) { .dashboard-filters { grid-template-columns: 1fr; gap: 10px; } .dashboard-search { grid-template-columns: 1fr; } .attendance-totals { grid-template-columns: 1fr; gap: 16px; } .attendance-totals > div { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: center; } .attendance-totals dd { margin: 0; font-size: 24px; } .attendance-totals small { grid-column: 1 / -1; } .dashboard-heading { align-items: flex-start; } .record-row { align-items: flex-start; } }
</style>
