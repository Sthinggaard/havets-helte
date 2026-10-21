import { rosterBranches, rosterMembers, rosterTeams } from '../roster/roster.data';
import { attendanceRecords } from './attendance.records';
import { scheduledAttendanceMeetings } from './attendance.schedule';

export function getAttendanceMeetings(from: string, to = from) {
  const planned = scheduledAttendanceMeetings(rosterBranches, rosterTeams, rosterMembers, from, to);
  const meetings = new Map(planned.map(meeting => [meeting.id, meeting]));
  for (const record of attendanceRecords) {
    if (record.meeting.date < from || record.meeting.date > to) continue;
    // Saved registrations retain their original time and member list when a schedule changes.
    const matching = planned.find(meeting => meeting.id === record.meeting.id
      || (meeting.date === record.meeting.date && (record.meeting.teamId
        ? meeting.teamId === record.meeting.teamId
        : meeting.branchId === record.meeting.branchId && meeting.weekday === record.meeting.weekday)));
    if (matching) meetings.delete(matching.id);
    meetings.set(record.meeting.id, {
      ...record.meeting, teamId: record.meeting.teamId ?? matching?.teamId,
      capacity: record.expectedMembers.length,
    });
  }
  return [...meetings.values()];
}
