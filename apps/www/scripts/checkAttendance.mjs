// Isolated checks: synthetic members and in-memory storage, never Firebase or a browser's data.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { nextTick } from 'vue';

const root = fileURLToPath(new URL('..', import.meta.url));
const values = new Map();
const listeners = new Map();
let failWrites = false;
const ActualDate = Date;
globalThis.Date = class extends ActualDate {
  constructor(...args) { super(...(args.length ? args : ['2026-10-21T12:00:00'])); }
};
globalThis.window = {
  localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { if (failWrites) throw Error('storage full'); values.set(key, value); },
  },
  addEventListener: (name, listener) => listeners.set(name, listener),
  removeEventListener: name => listeners.delete(name),
};
const server = await createServer({
  root, configFile: false, optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false }, ssr: { noExternal: ['vue-router'] },
  plugins: [{ name: 'test-router', enforce: 'pre',
    resolveId(source) { if (source === 'vue-router') return '\0test-router'; },
    load(id) { if (id === '\0test-router') return "export const useRoute = () => ({query: {date: '2026-10-20'}}); export const useRouter = () => ({push: value => value});"; },
  }],
});
try {
  const roster = await server.ssrLoadModule('/src/features/roster/roster.data.ts');
  const member = (id, branchId = 'junior', team = 'Mandagshold', weekday = 'Mandag') => ({id, name: `Test ${id}`, initials: id.toUpperCase(), branchId, team, weekday, birthYear: 2015, active: true});
  roster.rosterMembers.splice(0, roster.rosterMembers.length, member('a'), member('b'), member('c', 'junior', 'Tirsdagshold', 'Tirsdag'));
  const {attendanceRecords, saveAttendance, toggleRecordedArrival, membersForMeeting, isAttendanceDate} = await server.ssrLoadModule('/src/features/attendance/attendance.records.ts');
  const {summarizeAttendance} = await server.ssrLoadModule('/src/features/attendance/attendance.stats.ts');
  const {useAttendanceDashboard} = await server.ssrLoadModule('/src/features/attendance/useAttendanceDashboard.ts');
  const monday = roster.rosterTeams.find(team => team.branchId === 'junior' && team.weekday === 'Mandag');
  const tuesday = roster.rosterTeams.find(team => team.branchId === 'junior' && team.weekday === 'Tirsdag');
  // Also work in checkouts without the optional private fixture.
  if (!monday) roster.rosterTeams.push({id:'test-monday', branchId:'junior', label:'Mandagshold', weekday:'Mandag', active:true, startTime:'',endTime:'',seasonStartDate:'',seasonEndDate:''});
  const mondayId = monday?.id ?? 'test-monday';
  const tuesdayId = tuesday.id;
  const record = (id, date, present, completed = true) => ({
    meeting: {id, date, branchId:'junior', teamId:mondayId, title:'Testmøde', weekday:'Mandag',time:'',location:'',capacity:2,summary:''},
    expectedMembers:[{id:'a',name:'Test a'},{id:'b',name:'Test b'}], presentMemberIds:present,
    completedAt:completed ? '2026-10-21T10:00:00Z' : null,
  });
  assert.equal(attendanceRecords.length, 0, 'demo attendance must never become real history');
  assert.equal(isAttendanceDate('2026-02-30'), false);
  assert.equal(isAttendanceDate('2028-02-29'), true);
  const model = useAttendanceDashboard();
  assert.equal(model.summary.value.rate, null, 'no data is not zero attendance');
  saveAttendance(record('m1','2026-10-01',['a']));
  saveAttendance(record('m2','2026-10-08',['a','b']));
  saveAttendance(record('m3','2026-10-15',['b']));
  saveAttendance(record('m4','2026-10-21',['b']));
  saveAttendance(record('draft','2026-10-20',[],false));
  let stats = summarizeAttendance(roster.rosterMembers, attendanceRecords);
  assert.deepEqual(stats.map(row => [row.member.id,row.present,row.total,row.rate,row.consecutiveAbsences,row.lastPresent]), [
    ['a',2,4,50,2,'2026-10-08'], ['b',3,4,75,0,'2026-10-21'], ['c',0,0,null,0,null],
  ]);
  assert.equal(model.summary.value.rate, 63, 'aggregate attendance is 5/8, rounded once');
  assert.equal(model.summary.value.expected, 8, 'drafts do not count as absences');
  assert.equal(model.summary.value.meetings, 4);
  assert.equal(model.rows.value[0].member.id, 'a');
  model.sort.value = 'highest';
  assert.equal(model.rows.value[0].member.id, 'b');
  model.onlyAbsence.value = true;
  assert.equal(model.rows.value.length, 2);
  model.search.value = 'Test a';
  assert.equal(model.rows.value.length, 1);
  assert.equal(model.summary.value.expected, 8, 'search must not change overall statistics');
  roster.rosterMembers[0].branchId = 'trop';
  roster.rosterMembers[0].team = 'Onsdagshold';
  roster.rosterMembers[0].weekday = 'Onsdag';
  assert.equal(summarizeAttendance(roster.rosterMembers, attendanceRecords)[0].total, 4, 'transfer must preserve historic eligibility');
  roster.rosterMembers.push(member('new'));
  assert.equal(summarizeAttendance(roster.rosterMembers, attendanceRecords).at(-1).rate, null, 'new members must not inherit past absences');
  model.branchId.value = 'trop';
  assert.equal(model.summary.value.rate, 50);
  assert.equal(model.summary.value.members, 1);
  model.branchId.value = 'all';
  model.teamId.value = tuesdayId;
  assert.equal(model.summary.value.expected, 0);
  model.teamId.value = 'all';
  saveAttendance(record('m4','2026-10-21',['a','b','outsider','a']));
  assert.equal(attendanceRecords.filter(item => item.meeting.id === 'm4').length, 1, 'editing replaces the same registration');
  assert.equal(attendanceRecords.find(item => item.meeting.id === 'm4').presentMemberIds.length, 2);
  assert.equal(model.summary.value.rate, 75);
  const closed = attendanceRecords.find(item => item.meeting.id === 'm4');
  toggleRecordedArrival(closed.meeting,'a');
  assert.equal(closed.presentMemberIds.length, 2, 'kiosk cannot alter finalized registrations');
  assert.throws(() => saveAttendance(record('future','2026-10-22',[])), /Fremtidige/);
  failWrites = true;
  const before = JSON.stringify(attendanceRecords);
  assert.throws(() => saveAttendance(record('failed','2026-10-19',[])), /kunne ikke gemmes/);
  assert.equal(JSON.stringify(attendanceRecords), before, 'failed storage must not mutate visible state');
  failWrites = false;
  const currentMeeting = {id:'live',date:'2026-10-20',branchId:'junior',teamId:tuesdayId,weekday:'Tirsdag',title:'Test tirsdag',time:'',location:'',capacity:1,summary:''};
  assert.deepEqual(membersForMeeting(currentMeeting).map(member => member.id), ['c']);
  toggleRecordedArrival(currentMeeting,'c');
  assert.equal(attendanceRecords.find(item => item.meeting.id === 'live').completedAt, null);
  assert.equal(model.summary.value.rate, 75, 'live check-in remains excluded until finalized');
  const {useAttendancePage} = await server.ssrLoadModule('/src/features/attendance/useAttendancePage.ts');
  const checkIn = useAttendancePage();
  checkIn.selectMeeting('live');
  await nextTick();
  assert.equal(checkIn.filteredMembers.value.length, 1);
  checkIn.setSearchTerm('does not match');
  assert.equal(checkIn.filteredMembers.value.length, 0);
  assert.deepEqual(checkIn.meetingSummary.value, {arrived:1,total:1,waiting:0}, 'search must not change meeting totals');
  saveAttendance(record('last-year','2025-12-15',[]));
  assert.equal(model.summary.value.expected, 8);
  model.period.value = 'all';
  assert.equal(model.summary.value.expected, 10);
  model.period.value = 'quarter';
  assert.equal(model.summary.value.expected, 8);
  await nextTick();
  const key = `sankthans.attendance.${roster.rosterStorageVersion}`;
  assert.ok(values.get(key));
  server.moduleGraph.invalidateAll();
  const reloaded = await server.ssrLoadModule('/src/features/attendance/attendance.records.ts');
  assert.equal(reloaded.attendanceRecords.length, 7);
  assert.deepEqual(reloaded.attendanceRecords.find(item => item.meeting.id === 'm4').presentMemberIds, ['a','b']);
  values.set(key, JSON.stringify([record('from-other-tab','2026-10-21',['b'])]));
  listeners.get('storage')({key});
  assert.equal(reloaded.attendanceRecords[0].meeting.id, 'from-other-tab');
  console.log('PASS: attendance rates, absence streaks, periods, filters, drafts, team eligibility, transfers, new members, correction, failed saves, reload and synchronization between tabs.');
} finally {
  await server.close();
  globalThis.Date = ActualDate;
  delete globalThis.window;
}
