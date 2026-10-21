import { reactive } from 'vue';
import { rosterMembers, rosterStorageVersion, rosterTeams } from '../roster/roster.data';
import { isAttendanceDate, toIsoDate } from './attendanceCalendar';
import type { AttendanceRecord, Meeting } from './attendance.types';

const storageKey = `sankthans.attendance.${rosterStorageVersion}`;

export { isAttendanceDate } from './attendanceCalendar';

function loadRecords(): AttendanceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((record): record is AttendanceRecord => {
      if (!record || typeof record !== 'object') return false;
      const { meeting, expectedMembers, presentMemberIds, completedAt } = record;
      return !!meeting && typeof meeting.id === 'string' && typeof meeting.date === 'string' && isAttendanceDate(meeting.date)
        && typeof meeting.branchId === 'string' && typeof meeting.title === 'string' && typeof meeting.weekday === 'string'
        && Array.isArray(expectedMembers) && expectedMembers.every(member => member && typeof member.id === 'string' && typeof member.name === 'string')
        && Array.isArray(presentMemberIds) && presentMemberIds.every(id => typeof id === 'string' && expectedMembers.some(member => member.id === id))
        && (completedAt === null || (typeof completedAt === 'string' && Number.isFinite(Date.parse(completedAt))));
    }).filter((record, index, records) => records.findIndex(other => other.meeting.id === record.meeting.id) === index);
  } catch {
    return [];
  }
}

export const attendanceRecords = reactive<AttendanceRecord[]>(loadRecords());

if (typeof window !== 'undefined') {
  const syncRecords = (event: StorageEvent) => {
    if (event.key === storageKey) attendanceRecords.splice(0, attendanceRecords.length, ...loadRecords());
  };
  window.addEventListener('storage', syncRecords);
  import.meta.hot?.dispose(() => window.removeEventListener('storage', syncRecords));
}

export function membersForMeeting(meeting: Meeting) {
  const saved = attendanceRecords.find(record => record.meeting.id === meeting.id);
  if (saved) return saved.expectedMembers;
  const team = rosterTeams.find(item => item.id === meeting.teamId);
  return rosterMembers.filter(member => member.active && member.branchId === meeting.branchId
    && (team ? member.team === team.label && member.weekday === team.weekday : member.weekday === meeting.weekday))
    .map(member => ({ id: member.id, name: member.name }));
}

// Write first: failed local storage must never look like a successful save.
export function saveAttendance(record: AttendanceRecord) {
  const ids = new Set(record.expectedMembers.map(member => member.id));
  if (!isAttendanceDate(record.meeting.date) || !ids.size) throw new Error('Vælg en dato og et hold med medlemmer.');
  if (record.completedAt && record.meeting.date > toIsoDate(new Date())) throw new Error('Fremtidige møder kan ikke afsluttes.');
  const normalized: AttendanceRecord = {
    meeting: { ...record.meeting },
    expectedMembers: [...new Map(record.expectedMembers.map(member => [member.id, { ...member }])).values()],
    presentMemberIds: [...new Set(record.presentMemberIds)].filter(id => ids.has(id)),
    completedAt: record.completedAt,
  };
  const records = attendanceRecords.filter(item => item.meeting.id !== normalized.meeting.id);
  records.push(normalized);
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    throw new Error('Fremmødet kunne ikke gemmes på denne enhed. Prøv igen.');
  }
  attendanceRecords.splice(0, attendanceRecords.length, ...records);
}

export function toggleRecordedArrival(meeting: Meeting, memberId: string) {
  const record = attendanceRecords.find(item => item.meeting.id === meeting.id);
  if (record?.completedAt) return;
  const expectedMembers = record?.expectedMembers ?? membersForMeeting(meeting);
  if (!expectedMembers.some(member => member.id === memberId)) return;
  const present = record?.presentMemberIds ?? [];
  saveAttendance({
    meeting, expectedMembers,
    presentMemberIds: present.includes(memberId) ? present.filter(id => id !== memberId) : [...present, memberId],
    completedAt: null,
  });
}
