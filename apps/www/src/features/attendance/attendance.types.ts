import type { BranchId } from '../roster/roster.types';

export type { Branch, BranchId, Member } from '../roster/roster.types';

export interface Meeting {
  id: string;
  date: string;
  time: string;
  title: string;
  branchId: BranchId;
  weekday: string;
  location: string;
  capacity: number;
  summary: string;
  teamId?: string;
}

export interface AttendanceRecord {
  meeting: Meeting;
  expectedMembers: Array<{ id: string; name: string }>;
  presentMemberIds: string[];
  completedAt: string | null;
}
