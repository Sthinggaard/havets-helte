import type { BranchId } from '../roster/roster.types';

export type MemberStatusFilter = 'all' | 'active' | 'inactive';

export interface MemberProfile {
  id: string;
  name: string;
  initials: string;
  branchId: BranchId;
  branchLabel: string;
  weekday: string;
  active: boolean;
  birthYear: number;
  team: string;
}
