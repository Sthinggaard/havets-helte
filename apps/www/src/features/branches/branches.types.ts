import type { Branch } from '../roster/roster.types';

export interface BranchCard extends Branch {
  ageRangeLabel: string;
  memberCount: number;
  statusLabel: string;
}
