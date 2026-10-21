import type { Member } from '../roster/roster.types';
import type { AttendanceRecord } from './attendance.types';

export function summarizeAttendance(members: Member[], records: AttendanceRecord[]) {
  const history = new Map<string, Array<{ meetingId: string; date: string; present: boolean }>>();
  for (const record of records.filter(item => item.completedAt).sort((a, b) => b.meeting.date.localeCompare(a.meeting.date))) {
    const present = new Set(record.presentMemberIds);
    for (const id of new Set(record.expectedMembers.map(member => member.id))) {
      const meetings = history.get(id) ?? [];
      meetings.push({ meetingId: record.meeting.id, date: record.meeting.date, present: present.has(id) });
      history.set(id, meetings);
    }
  }
  return members.map(member => {
    const meetings = history.get(member.id) ?? [];
    const present = meetings.filter(meeting => meeting.present).length;
    const firstPresent = meetings.findIndex(meeting => meeting.present);
    return {
      member, meetings, present, absent: meetings.length - present,
      total: meetings.length,
      rate: meetings.length ? Math.round(100 * present / meetings.length) : null,
      lastPresent: meetings.find(meeting => meeting.present)?.date ?? null,
      consecutiveAbsences: firstPresent === -1 ? meetings.length : firstPresent,
    };
  });
}
