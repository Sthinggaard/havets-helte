import type { Branch, Member, RosterTeam } from '../roster/roster.types';
import { addDays, fromIsoDate, isAttendanceDate, toIsoDate } from './attendanceCalendar';
import type { Meeting } from './attendance.types';

const weekdays = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// A read-only projection of the saved team schedules, limited to the requested dates.
export function scheduledAttendanceMeetings(branches: Branch[], teams: RosterTeam[], members: Member[], from: string, to = from): Meeting[] {
  if (!isAttendanceDate(from) || !isAttendanceDate(to) || to < from) return [];
  const meetings: Meeting[] = [];
  const branchMap = new Map(branches.map(branch => [branch.id, branch]));
  for (const team of teams) {
    const branch = branchMap.get(team.branchId);
    if (!team.active || !branch?.active) continue;
    const schedule = branch.meetingSchedules?.find(day => day.weekday === team.weekday);
    const startTime = team.startTime || schedule?.startTime || '';
    const endTime = team.endTime || schedule?.endTime || '';
    const seasonStartDate = team.seasonStartDate || branch.seasonStartDate || '';
    const seasonEndDate = team.seasonEndDate || branch.seasonEndDate || '';
    const weekday = weekdays.indexOf(team.weekday);
    if (weekday === -1 || !branch.meetingDays.includes(team.weekday)
      || !timePattern.test(startTime) || !timePattern.test(endTime) || endTime <= startTime
      || !isAttendanceDate(seasonStartDate) || !isAttendanceDate(seasonEndDate) || seasonEndDate < seasonStartDate) continue;
    const first = fromIsoDate(from > seasonStartDate ? from : seasonStartDate);
    const last = to < seasonEndDate ? to : seasonEndDate;
    const lastDate = fromIsoDate(last);
    const firstMeeting = addDays(first, (weekday - first.getDay() + 7) % 7);
    const capacity = members.filter(member => member.active && member.branchId === branch.id && member.team === team.label && member.weekday === team.weekday).length;
    for (let date = firstMeeting; date <= lastDate; date = addDays(date, 7)) {
      const isoDate = toIsoDate(date);
      meetings.push({
        id: `attendance-${team.id}-${isoDate}`, date: isoDate, teamId: team.id,
        branchId: branch.id, weekday: team.weekday, title: `${branch.label} · ${team.label}`,
        time: `${startTime}–${endTime}`, seasonStartDate, seasonEndDate,
        capacity, location: '', summary: '',
      });
    }
  }
  return meetings.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title, 'da'));
}
