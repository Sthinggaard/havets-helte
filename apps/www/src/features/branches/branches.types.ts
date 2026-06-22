import type { Branch } from '../roster/roster.types';

export interface BranchCard extends Branch {
  memberCount: number;
}
