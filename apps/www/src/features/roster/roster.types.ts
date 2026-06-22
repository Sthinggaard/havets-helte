export type BranchId = 'junior' | 'ulv' | 'trop' | 'soespejder';

export interface Branch {
  id: BranchId;
  label: string;
  ageRange: string;
  focus: string;
  meetingDays: string[];
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  branchId: BranchId;
  weekday: string;
  active: boolean;
  birthYear: number;
  team: string;
}
