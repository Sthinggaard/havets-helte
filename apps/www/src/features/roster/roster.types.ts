export type BranchId = string;

export interface Branch {
  id: BranchId;
  label: string;
  active: boolean;
  minAge: number;
  maxAge: number;
  focus: string;
  meetingDays: string[];
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  imageUrl?: string;
  branchId: BranchId;
  weekday: string;
  active: boolean;
  birthYear: number;
  team: string;
}
