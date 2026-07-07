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
}
