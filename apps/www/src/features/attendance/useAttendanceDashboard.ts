import { computed, ref, watch } from 'vue';
import { publicRosterBranches, rosterMembers, rosterTeams } from '../roster/roster.data';
import { toIsoDate } from './attendanceCalendar';
import { attendanceRecords } from './attendance.records';
import { summarizeAttendance } from './attendance.stats';

export function useAttendanceDashboard() {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const period = ref<'year' | 'quarter' | 'all'>('year');
  const branchId = ref('all');
  const teamId = ref('all');
  const search = ref('');
  const sort = ref<'lowest' | 'highest' | 'absence' | 'name'>('lowest');
  const onlyAbsence = ref(false);
  const branches = publicRosterBranches;
  const teams = computed(() => rosterTeams.filter(team => team.active && branches.value.some(branch => branch.id === team.branchId)
    && (branchId.value === 'all' || team.branchId === branchId.value)));
  watch(teams, options => {
    if (!options.some(team => team.id === teamId.value)) teamId.value = 'all';
  });
  const startDate = computed(() => {
    if (period.value === 'all') return '';
    if (period.value === 'year') return `${today.getFullYear()}-01-01`;
    const date = new Date(today);
    date.setDate(date.getDate() - 90);
    return toIsoDate(date);
  });
  const periodRecords = computed(() => attendanceRecords.filter(record => record.meeting.date >= startDate.value && record.meeting.date <= todayIso));
  const members = computed(() => {
    const team = teams.value.find(item => item.id === teamId.value);
    return rosterMembers.filter(member => member.active && branches.value.some(branch => branch.id === member.branchId)
      && (branchId.value === 'all' || member.branchId === branchId.value)
      && (!team || (member.branchId === team.branchId && member.team === team.label && member.weekday === team.weekday)));
  });
  const stats = computed(() => summarizeAttendance(members.value, periodRecords.value));
  const rows = computed(() => {
    const term = search.value.trim().toLocaleLowerCase('da');
    return stats.value.filter(row => (!term || row.member.name.toLocaleLowerCase('da').includes(term)) && (!onlyAbsence.value || row.absent > 0))
      .sort((a, b) => {
        if (sort.value !== 'name' && (a.rate === null || b.rate === null)) return a.rate === null ? (b.rate === null ? a.member.name.localeCompare(b.member.name, 'da') : 1) : -1;
        const difference = sort.value === 'lowest' ? (a.rate ?? 0) - (b.rate ?? 0)
          : sort.value === 'highest' ? (b.rate ?? 0) - (a.rate ?? 0)
            : sort.value === 'absence' ? b.consecutiveAbsences - a.consecutiveAbsences : 0;
        return difference || a.member.name.localeCompare(b.member.name, 'da');
      });
  });
  const summary = computed(() => {
    const present = stats.value.reduce((sum, row) => sum + row.present, 0);
    const expected = stats.value.reduce((sum, row) => sum + row.total, 0);
    return {
      present, expected, rate: expected ? Math.round(100 * present / expected) : null,
      meetings: new Set(stats.value.flatMap(row => row.meetings.map(meeting => meeting.meetingId))).size,
      withData: stats.value.filter(row => row.total > 0).length,
      withAbsence: stats.value.filter(row => row.absent > 0).length,
      members: stats.value.length,
    };
  });
  const records = computed(() => periodRecords.value.filter(record => (branchId.value === 'all' || record.meeting.branchId === branchId.value)
    && (teamId.value === 'all' || record.meeting.teamId === teamId.value || (!record.meeting.teamId && teams.value.some(team => team.id === teamId.value && team.branchId === record.meeting.branchId && team.weekday === record.meeting.weekday))))
    .slice().sort((a, b) => b.meeting.date.localeCompare(a.meeting.date)));
  function branchLabel(id: string) { return branches.value.find(branch => branch.id === id)?.label ?? id; }
  return { period, branchId, teamId, search, sort, onlyAbsence, branches, teams, rows, summary, records, branchLabel };
}
