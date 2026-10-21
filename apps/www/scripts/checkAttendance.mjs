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
globalThis.__attendanceTestRoute = {query:{date:'2026-10-20'}};
const server = await createServer({
  root, configFile: false, resolve: { alias: { '@': `${root}/src` } }, optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false }, ssr: { noExternal: ['vue-router'] },
  plugins: [{ name: 'test-router', enforce: 'pre',
    resolveId(source) { if (source === 'vue-router') return '\0test-router'; },
    load(id) { if (id === '\0test-router') return "export const useRoute = () => globalThis.__attendanceTestRoute; export const useRouter = () => ({push: value => value});"; },
  }],
});
try {
  const {isoWeekNumber,fromIsoDate} = await server.ssrLoadModule('/src/features/attendance/attendanceCalendar.ts');
  for (const [date,week] of [['2026-10-21',43],['2027-01-01',53],['2027-01-04',1],['2024-12-30',1]]) {
    assert.equal(isoWeekNumber(fromIsoDate(date)),week, `ISO week for ${date}`);
  }
  const {calendarEventOccurrences} = await server.ssrLoadModule('/src/features/attendance/attendance.events.ts');
  const event = {id:'test-event',title:'Testarrangement',active:true,eventDate:'2026-10-21',location:'Teststed',slots:[]};
  const shift = {componentType:'shift',date:'2026-10-21',startTime:'17:00',endTime:'18:00'};
  const events = [{...event,slots:[shift, {...shift}, {...shift,componentType:'task',date:'2026-10-19'}, {...shift,componentType:'signup',date:'2026-10-22'}]}, {...event,id:'draft',active:false}, {...event,id:'undated',eventDate:'2026-02-30'}];
  const occurrences = calendarEventOccurrences(events);
  assert.deepEqual(occurrences.map(item => item.date), ['2026-10-21','2026-10-22']);
  assert.deepEqual(occurrences[0].times, ['17:00–18:00'], 'same-day shifts do not duplicate arrangements or times');
  assert.equal(occurrences[0].location, 'Teststed');
  const relative = calendarEventOccurrences([{...event,slots:[{...shift,date:'',scheduleMode:'relative',offsetDays:2}]}]);
  assert.deepEqual(relative.map(item => item.date), ['2026-10-21','2026-10-23']);
  const recurring = {...shift,date:'',scheduleMode:'weekly',recurrenceWeekdays:[1],recurrenceStartDate:'2026-10-19',recurrenceEndDate:'2026-11-02'};
  assert.deepEqual(calendarEventOccurrences([{...event,eventDate:undefined,slots:[recurring]}]).map(item => item.date), ['2026-10-19','2026-10-26','2026-11-02']);
  assert.deepEqual(calendarEventOccurrences([{...event,eventDate:undefined,slots:[{...recurring,date:'2026-10-26',recurrenceMaterialized:true}]}]).map(item => item.date), ['2026-10-26'], 'materialized shifts stay on their actual date');
  const {useAttendanceSetupPage} = await server.ssrLoadModule('/src/features/attendance/useAttendanceSetupPage.ts');
  let eventReads = 0;
  const calendar = useAttendanceSetupPage(async () => {eventReads++; return events;});
  assert.equal(eventReads, 0, 'overview does not fetch calendar events');
  await Promise.all([calendar.loadCalendarEvents(),calendar.loadCalendarEvents()]);
  calendar.selectDate('2026-10-21');
  assert.equal(calendar.selectedDateEvents.value[0].title, 'Testarrangement');
  calendar.shiftMonth(1);
  await calendar.loadCalendarEvents();
  assert.equal(eventReads, 1, 'month/tab changes reuse a single read');
  let attempts = 0;
  const retry = useAttendanceSetupPage(async () => {if (++attempts === 1) throw Error('offline'); return [event];});
  await retry.loadCalendarEvents();
  assert.ok(retry.eventsError.value);
  await retry.loadCalendarEvents();
  assert.equal(retry.eventsError.value, '');
  assert.equal(retry.eventsByDate.value.get('2026-10-21').length, 1);
  const roster = await server.ssrLoadModule('/src/features/roster/roster.data.ts');
  const member = (id, branchId = 'junior', team = 'Mandagshold', weekday = 'Mandag') => ({id, name: `Test ${id}`, initials: id.toUpperCase(), branchId, team, weekday, birthYear: 2015, active: true});
  roster.rosterMembers.splice(0, roster.rosterMembers.length, member('a'), member('b'), member('c', 'junior', 'Tirsdagshold', 'Tirsdag'));
  const {attendanceRecords, saveAttendance, toggleRecordedArrival, membersForMeeting, isAttendanceDate} = await server.ssrLoadModule('/src/features/attendance/attendance.records.ts');
  const {summarizeAttendance} = await server.ssrLoadModule('/src/features/attendance/attendance.stats.ts');
  const {scheduledAttendanceMeetings} = await server.ssrLoadModule('/src/features/attendance/attendance.schedule.ts');
  const {getAttendanceMeetings} = await server.ssrLoadModule('/src/features/attendance/attendance.data.ts');
  const {useAttendanceDashboard} = await server.ssrLoadModule('/src/features/attendance/useAttendanceDashboard.ts');
  const planBranch = {id:'junior',label:'Junior',active:true,meetingDays:['Mandag','Tirsdag'],meetingSchedules:[{weekday:'Tirsdag',startTime:'16:30',endTime:'18:00'}],seasonStartDate:'2026-10-01',seasonEndDate:'2026-10-31'};
  const planTeam = {id:'planned-monday',branchId:'junior',label:'Mandagshold',weekday:'Mandag',active:true,startTime:'17:00',endTime:'18:30',seasonStartDate:'2026-10-05',seasonEndDate:'2026-10-26'};
  const planned = scheduledAttendanceMeetings([planBranch],[planTeam],roster.rosterMembers,'2026-10-01','2026-10-31');
  assert.deepEqual(planned.map(meeting => meeting.date), ['2026-10-05','2026-10-12','2026-10-19','2026-10-26'], 'weekly meetings include season boundaries and survive the DST transition');
  assert.ok(planned.every(meeting => meeting.time === '17:00–18:30' && meeting.capacity === 2));
  assert.equal(scheduledAttendanceMeetings([planBranch],[planTeam],[],'2026-10-04').length, 0);
  assert.equal(scheduledAttendanceMeetings([planBranch],[planTeam],[],'2026-10-27').length, 0);
  assert.equal(scheduledAttendanceMeetings([planBranch],[{...planTeam,active:false}],[],'2026-10-05').length, 0);
  assert.equal(scheduledAttendanceMeetings([{...planBranch,active:false}],[planTeam],[],'2026-10-05').length, 0);
  assert.equal(scheduledAttendanceMeetings([planBranch],[{...planTeam,startTime:'19:00'}],[],'2026-10-05').length, 0);
  const fallback = scheduledAttendanceMeetings([planBranch],[{...planTeam,weekday:'Tirsdag',label:'Tirsdagshold',startTime:'',endTime:'',seasonStartDate:'',seasonEndDate:''}],roster.rosterMembers,'2026-10-01','2026-10-31');
  assert.deepEqual(fallback.map(meeting => meeting.date), ['2026-10-06','2026-10-13','2026-10-20','2026-10-27']);
  assert.ok(fallback.every(meeting => meeting.time === '16:30–18:00' && meeting.capacity === 1));
  const yearChange = scheduledAttendanceMeetings([planBranch],[{...planTeam,seasonStartDate:'2026-12-28',seasonEndDate:'2027-01-11'}],[],'2026-12-01','2027-02-01');
  assert.deepEqual(yearChange.map(meeting => meeting.date), ['2026-12-28','2027-01-04','2027-01-11']);
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
  const junior = roster.rosterBranches.find(branch => branch.id === 'junior');
  junior.meetingDays = ['Mandag','Tirsdag'];
  const configuredTeam = roster.rosterTeams.find(team => team.id === mondayId);
  Object.assign(configuredTeam, {startTime:'17:00',endTime:'18:30',seasonStartDate:'2026-10-05',seasonEndDate:'2026-10-26'});
  const storedBeforePlanning = values.get(key);
  const scheduled = getAttendanceMeetings('2026-10-12');
  assert.equal(scheduled.length, 1);
  assert.equal(values.get(key), storedBeforePlanning, 'displaying the schedule must not write attendance');
  saveAttendance({meeting:{...scheduled[0],id:'legacy-plan-record'},expectedMembers:membersForMeeting(scheduled[0]),presentMemberIds:['b'],completedAt:'2026-10-21T10:00:00Z'});
  configuredTeam.startTime = '18:00';
  configuredTeam.endTime = '19:30';
  assert.equal(getAttendanceMeetings('2026-10-12').length, 1, 'saved and planned versions of the same team/date must not duplicate');
  assert.equal(getAttendanceMeetings('2026-10-12')[0].time, '17:00–18:30', 'completed history retains the original time');
  assert.equal(getAttendanceMeetings('2026-10-26')[0].time, '18:00–19:30', 'unregistered meetings follow schedule edits');
  assert.equal(getAttendanceMeetings('2026-11-02').length, 0, 'no scheduled meetings outside the season');
  const savedRecordCount = attendanceRecords.length;
  server.moduleGraph.invalidateAll();
  const reloaded = await server.ssrLoadModule('/src/features/attendance/attendance.records.ts');
  assert.equal(reloaded.attendanceRecords.length, savedRecordCount);
  assert.deepEqual(reloaded.attendanceRecords.find(item => item.meeting.id === 'm4').presentMemberIds, ['a','b']);
  values.set(key, JSON.stringify([record('from-other-tab','2026-10-21',['b'])]));
  listeners.get('storage')({key});
  assert.equal(reloaded.attendanceRecords[0].meeting.id, 'from-other-tab');
  const {signupAttendanceTarget} = await server.ssrLoadModule('/src/features/attendance/attendance.signups.ts');
  const signupSlot = {id:'signup-a',label:'Lejr',time:'17:00–19:00',external:false};
  const signupEvent = {...event,date:'2026-10-21',times:[],signups:[signupSlot]};
  const signupRows = [
    {id:'first',eventId:event.id,slotId:signupSlot.id,name:'Test tilmeldt'},
    {id:'second',eventId:event.id,slotId:signupSlot.id,name:'Test gruppe',groupSize:3},
    {id:'wait',eventId:event.id,slotId:signupSlot.id,name:'Test venteliste',waitlist:true},
    {id:'other-slot',eventId:event.id,slotId:'other',name:'Anden sektion'},
    {id:'other-event',eventId:'other',slotId:signupSlot.id,name:'Andet arrangement'},
  ];
  const signupTarget = signupAttendanceTarget(signupEvent, signupSlot, signupRows);
  assert.deepEqual(signupTarget.expectedMembers.map(member => member.id).sort(), ['signup:first','signup:second']);
  assert.ok(signupTarget.expectedMembers.some(member => member.name.includes('3 deltagere')));
  const inheritedSignup = calendarEventOccurrences([{...event,slots:[{...shift,id:'signup-a',componentType:'signup',date:''}]}]);
  assert.equal(inheritedSignup[0].signups[0].id, 'signup-a', 'undated signup sections inherit the event date');
  globalThis.__attendanceTestRoute = {query:{date:signupEvent.date,event:signupEvent.id,slot:signupSlot.id}};
  let signupReads = 0;
  const signupCheckIn = useAttendancePage(async () => { signupReads++; return signupTarget; });
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
  assert.equal(signupCheckIn.isSignupAttendance.value, true);
  assert.equal(signupCheckIn.dayMeetings.value.length, 1);
  assert.equal(signupCheckIn.meetingSummary.value.total, 2, 'only confirmed signups, never the branch roster');
  assert.equal(signupCheckIn.filteredMembers.value.some(member => member.id === 'a'), false);
  const signupId = signupTarget.meeting.id;
  signupCheckIn.toggleArrival(signupId, 'a');
  assert.equal(attendanceRecords.some(record => record.meeting.id === signupId), false, 'non-signups cannot check in');
  signupCheckIn.toggleArrival(signupId, 'signup:first');
  assert.equal(signupCheckIn.meetingSummary.value.arrived, 1);
  signupCheckIn.setSearchTerm('gruppe');
  assert.equal(signupCheckIn.filteredMembers.value.length, 1);
  assert.equal(signupCheckIn.meetingSummary.value.total, 2, 'search never alters totals');
  assert.equal(signupReads, 1, 'check-in and search do not fetch again');
  assert.equal(getAttendanceMeetings(signupEvent.date).some(meeting => meeting.id === signupId), false, 'signup attendance never becomes a branch meeting');
  const refreshedTarget = signupAttendanceTarget(signupEvent,signupSlot,signupRows.filter(signup => signup.id !== 'first'));
  const refreshedCheckIn = useAttendancePage(async () => refreshedTarget);
  await new Promise(resolve => setTimeout(resolve, 0)); await nextTick();
  assert.equal(refreshedCheckIn.meetingSummary.value.total, 1, 'cancelled signups disappear on reopening a draft');
  assert.equal(refreshedCheckIn.meetingSummary.value.arrived, 0);
  refreshedCheckIn.toggleArrival(signupId, 'signup:second');
  assert.deepEqual(attendanceRecords.find(record => record.meeting.id === signupId).expectedMembers.map(member => member.id), ['signup:second']);
  const finalized = attendanceRecords.find(record => record.meeting.id === signupId);
  saveAttendance({...finalized,completedAt:'2026-10-21T12:00:00Z'});
  refreshedCheckIn.toggleArrival(signupId,'signup:second');
  assert.equal(refreshedCheckIn.meetingSummary.value.arrived, 1, 'completed signup history cannot be changed by kiosk taps');
  let failSignupLoad = true;
  const retryCheckIn = useAttendancePage(async () => { if (failSignupLoad) throw Error('offline'); return signupTarget; });
  await new Promise(resolve => setTimeout(resolve,0)); await nextTick();
  assert.ok(retryCheckIn.loadError.value);
  assert.equal(retryCheckIn.dayMeetings.value.length, 0, 'a failed signup load must never fall back to a branch roster');
  failSignupLoad = false; retryCheckIn.retryLoad();
  await new Promise(resolve => setTimeout(resolve,0)); await nextTick();
  assert.equal(retryCheckIn.loadError.value, '');
  assert.equal(retryCheckIn.dayMeetings.value.length, 1);
  roster.rosterBranches.splice(0,roster.rosterBranches.length,planBranch);
  roster.rosterTeams.splice(0,roster.rosterTeams.length,{...planTeam,id:'calendar-tuesday',weekday:'Tirsdag',label:'Tirsdagshold'});
  const unifiedCalendar = useAttendanceSetupPage(async () => [{...event,eventDate:'2026-10-20',slots:[{...shift,id:'signup-a',componentType:'signup',date:''}]}]);
  await unifiedCalendar.loadCalendarEvents();
  unifiedCalendar.selectDate('2026-10-20');
  assert.equal(unifiedCalendar.canOpenAttendance.value, true);
  const teamEntry = unifiedCalendar.dayEntries.value.find(entry => entry.query?.meeting);
  const signupEntry = unifiedCalendar.dayEntries.value.find(entry => entry.query?.slot);
  assert.ok(teamEntry && signupEntry, 'teams and signup sections share the day list');
  unifiedCalendar.selectEntry(teamEntry.id);
  assert.equal(unifiedCalendar.openAttendance().query.meeting, teamEntry.id, 'common action opens the chosen team');
  unifiedCalendar.selectEntry(signupEntry.id);
  assert.deepEqual(unifiedCalendar.openAttendance().query, {date:'2026-10-20',event:event.id,slot:'signup-a'}, 'same action opens signup attendance on mixed days');
  unifiedCalendar.selectDate('2026-10-22');
  assert.equal(unifiedCalendar.canOpenAttendance.value, false);
  assert.equal(unifiedCalendar.openAttendance(), undefined, 'empty days cannot open an unrelated list');
  const signupOnlyCalendar = useAttendanceSetupPage(async () => [{...event,eventDate:'2026-10-31',slots:[{...shift,id:'signup-only',componentType:'signup',date:''}]}]);
  await signupOnlyCalendar.loadCalendarEvents(); signupOnlyCalendar.selectDate('2026-10-31');
  assert.equal(signupOnlyCalendar.canOpenAttendance.value, true, 'signup-only days enable the common primary action');
  assert.equal(signupOnlyCalendar.openAttendance().query.slot, 'signup-only');
  const externalCalendar = useAttendanceSetupPage(async () => [{...event,eventDate:'2026-10-31',slots:[{...shift,id:'external',componentType:'signup',date:'',registrationMode:'memberService'}]}]);
  await externalCalendar.loadCalendarEvents(); externalCalendar.selectDate('2026-10-31');
  assert.equal(externalCalendar.canOpenAttendance.value, false, 'external lists never enable local attendance');
  console.log('PASS: signup check-in, confirmed-only lists, groups, cancellations, retry, ISO weeks, event occurrences, schedule days/times/seasons, inclusive boundaries, DST/year change, schedule edits, historical snapshots, attendance rates, absence streaks, filters, drafts, team eligibility, transfers, correction, failed saves, reload and synchronization between tabs.');
} finally {
  await server.close();
  globalThis.Date = ActualDate;
  delete globalThis.window;
  delete globalThis.__attendanceTestRoute;
}
