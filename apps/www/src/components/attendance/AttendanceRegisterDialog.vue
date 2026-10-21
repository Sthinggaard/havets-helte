<template>
  <Teleport to="body">
    <dialog ref="dialog" class="attendance-register" :aria-labelledby="titleId">
      <form @submit.prevent="save(true)">
        <div class="register-heading">
          <h2 :id="titleId">Registrer fremmøde</h2>
          <button type="button" class="btn-action" @click="dialog?.close()">Luk</button>
        </div>
        <div v-if="fixedMeeting" class="register-event">
          <h3>{{ fixedMeeting.title }}</h3>
          <p>{{ shortDate(fixedMeeting.date) }}<template v-if="fixedMeeting.time"> · {{ fixedMeeting.time }}</template><template v-if="fixedMeeting.location"> · {{ fixedMeeting.location }}</template></p>
        </div>
        <div v-else class="register-fields">
          <label>Dato<FormControl :model-value="date" type="date" :max="today" required @update:model-value="changeDate(String($event))" /></label>
          <label>Gren<FormControl :model-value="branchId" as="select" @update:model-value="changeBranch(String($event))"><option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.label }}</option></FormControl></label>
          <label>Hold<FormControl :model-value="teamId" as="select" :disabled="!teams.length" @update:model-value="changeTeam(String($event))"><option v-if="!teams.length" value="">Ingen planlagte hold</option><option v-for="team in teams" :key="team.id" :value="team.id">{{ team.label }} · {{ team.meeting.time }}</option></FormControl></label>
        </div>
        <p v-if="selectedTeam && !fixedMeeting" class="register-schedule">{{ selectedTeam.meeting.weekday }} · {{ selectedTeam.meeting.time }}<template v-if="selectedTeam.meeting.seasonStartDate && selectedTeam.meeting.seasonEndDate"> · Sæson {{ shortDate(selectedTeam.meeting.seasonStartDate) }}–{{ shortDate(selectedTeam.meeting.seasonEndDate) }}</template></p>
        <p class="register-count">{{ presentIds.length }} af {{ expected.length }} {{ fixedMeeting ? 'tilmeldinger tjekket ind' : 'mødt' }}</p>
        <div class="register-members">
          <label v-for="member in expected" :key="member.id" class="register-member">
            <input v-model="presentIds" type="checkbox" :value="member.id" :disabled="date > today" />
            <span>{{ member.name }}</span>
            <span class="register-state">{{ presentIds.includes(member.id) ? 'Mødt' : savedRecord?.completedAt ? 'Fravær' : 'Afventer' }}</span>
          </label>
          <p v-if="fixedMeeting && !expected.length">Ingen bekræftede tilmeldinger til denne sektion.</p>
          <p v-else-if="!fixedMeeting && !teams.length">Ingen hold er planlagt på datoen. Mødedage og sæson sættes under Grene.</p>
          <p v-else-if="!fixedMeeting && !expected.length">Ingen medlemmer på det valgte hold.</p>
        </div>
        <p v-if="date > today" class="register-explanation">Fremmøde kan registreres på dagen eller senere.</p>
        <p v-else class="register-explanation">{{ fixedMeeting ? 'Ikke markerede tilmeldinger' : 'Ikke markerede medlemmer' }} tæller som fraværende, når du afslutter registreringen.</p>
        <p v-if="error" class="register-error" role="alert">{{ error }}</p>
        <div class="register-actions">
          <button type="button" class="btn-action" @click="dialog?.close()">Annuller</button>
          <button v-if="!savedRecord?.completedAt" type="button" class="btn-action" :disabled="!expected.length || date > today" @click="save(false)">Gem foreløbigt</button>
          <button type="submit" class="btn-action btn-action--primary" :disabled="!expected.length || date > today">{{ savedRecord?.completedAt ? 'Gem ændringer' : 'Afslut registrering' }}</button>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import FormControl from '@/components/form/FormControl.vue';
import { publicRosterBranches, rosterBranches, rosterTeams } from '@/features/roster/roster.data';
import { isAttendanceDate, attendanceRecords, membersForMeeting, saveAttendance } from '@/features/attendance/attendance.records';
import { getAttendanceMeetings } from '@/features/attendance/attendance.data';
import { fromIsoDate, toIsoDate } from '@/features/attendance/attendanceCalendar';
import type { AttendanceRecord, Meeting } from '@/features/attendance/attendance.types';

const emit = defineEmits<{ saved: [] }>();
const titleId = useId();
const dialog = ref<HTMLDialogElement | null>(null);
const today = toIsoDate(new Date());
const date = ref(today);
const branchId = ref('');
const teamId = ref('');
const presentIds = ref<string[]>([]);
const expected = ref<AttendanceRecord['expectedMembers']>([]);
const savedRecord = ref<AttendanceRecord | null>(null);
const error = ref('');
const fixedMeeting = ref<Meeting | null>(null);
const branches = computed(() => {
  const historical = rosterBranches.find(branch => branch.id === branchId.value && !branch.active);
  return historical ? [...publicRosterBranches.value, historical] : publicRosterBranches.value;
});
const meetings = computed(() => getAttendanceMeetings(date.value));
const teams = computed(() => meetings.value.filter(meeting => meeting.branchId === branchId.value).map(meeting => ({
  id: meeting.teamId ?? meeting.id,
  label: rosterTeams.find(team => team.id === meeting.teamId)?.label ?? meeting.title,
  meeting,
})));
const selectedTeam = computed(() => teams.value.find(team => team.id === teamId.value));

function shortDate(value: string) { return fromIsoDate(value).toLocaleDateString('da-DK'); }

function refresh() {
  error.value = '';
  const meeting = selectedTeam.value?.meeting;
  savedRecord.value = attendanceRecords.find(record => record.meeting.id === meeting?.id) ?? null;
  expected.value = meeting ? membersForMeeting(meeting).map(member => ({ ...member })) : [];
  presentIds.value = [...(savedRecord.value?.presentMemberIds ?? [])];
}
function changeDate(value: string) {
  date.value = value;
  if (!teams.value.some(team => team.id === teamId.value)) teamId.value = teams.value[0]?.id ?? '';
  refresh();
}
function changeTeam(value: string) { teamId.value = value; refresh(); }
function changeBranch(value: string) {
  branchId.value = value;
  teamId.value = teams.value[0]?.id ?? '';
  refresh();
}
function open(record?: AttendanceRecord) {
  fixedMeeting.value = record?.meeting.source === 'signup' ? record.meeting : null;
  if (fixedMeeting.value && record) { openForParticipants(record.meeting, record.expectedMembers); return; }
  date.value = record?.meeting.date ?? today;
  branchId.value = record?.meeting.branchId ?? meetings.value[0]?.branchId ?? publicRosterBranches.value[0]?.id ?? '';
  teamId.value = record ? teams.value.find(team => team.meeting.id === record.meeting.id)?.id ?? '' : teams.value[0]?.id ?? '';
  refresh();
  dialog.value?.showModal();
}
function openForParticipants(meeting: Meeting, participants: AttendanceRecord['expectedMembers']) {
  fixedMeeting.value = meeting;
  date.value = meeting.date;
  error.value = '';
  savedRecord.value = attendanceRecords.find(record => record.meeting.id === meeting.id) ?? null;
  expected.value = participants.map(member => ({ ...member }));
  const eligible = new Set(expected.value.map(member => member.id));
  presentIds.value = (savedRecord.value?.presentMemberIds ?? []).filter(id => eligible.has(id));
  dialog.value?.showModal();
}
function save(complete: boolean) {
  const meeting = fixedMeeting.value ?? selectedTeam.value?.meeting;
  if (!meeting || !isAttendanceDate(date.value) || date.value > today) { error.value = 'Vælg et hold eller en tilmelding og en dato senest i dag.'; return; }
  try {
    saveAttendance({
      meeting,
      expectedMembers: expected.value, presentMemberIds: presentIds.value, completedAt: complete ? new Date().toISOString() : null,
    });
    dialog.value?.close();
    emit('saved');
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Kunne ikke gemme fremmødet.'; }
}
defineExpose({ open });
</script>

<style scoped>
.attendance-register { width: min(680px, calc(100% - 32px)); max-height: calc(100dvh - 32px); overflow-y: auto; margin: auto; padding: 24px; border: 0; border-radius: var(--radius-md); color: var(--text); background: var(--surface); box-shadow: var(--shadow-lift); }
.attendance-register::backdrop { background: rgba(0, 15, 30, 0.55); }
.attendance-register form { display: grid; gap: 18px; }
.register-heading, .register-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.register-heading h2 { margin: 0; color: var(--navy); font-size: 22px; }
.register-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.register-fields label { display: grid; gap: 6px; min-width: 0; font-size: 14px; font-weight: 700; color: var(--navy); }
.register-fields :deep(.form-control) { min-height: 44px; font-size: 16px; }
.register-event h3 { margin: 0 0 6px; color: var(--navy); font-size: 18px; }
.register-event p { margin: 0; color: var(--muted); }
.register-count { margin: 0; font-weight: 700; color: var(--navy); }
.register-schedule { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.5; }
.register-members { max-height: 42dvh; overflow-y: auto; border-block: 1px solid var(--border-soft); }
.register-member { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 12px; align-items: center; min-height: 52px; padding: 10px 2px; cursor: pointer; }
.register-member + .register-member { border-top: 1px solid var(--border-soft); }
.register-member input { width: 20px; height: 20px; accent-color: var(--navy); }
.register-member:has(input:checked) { background: #eef5ed; }
.register-member input:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }
.register-state { font-size: 14px; color: var(--navy); }
.register-explanation { margin: 0; font-size: 14px; line-height: 1.5; color: var(--muted); }
.register-error { margin: 0; color: #a92338; }
.register-actions { justify-content: flex-end; flex-wrap: wrap; }
@media (max-width: 600px) { .register-fields { grid-template-columns: 1fr; } .attendance-register { padding: 18px; } .register-heading { align-items: flex-start; } }
</style>
