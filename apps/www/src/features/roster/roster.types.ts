export type BranchId = string;

export interface BranchMeetingDay {
  weekday: string;
  startTime: string;
  endTime: string;
}

export interface Branch {
  id: BranchId;
  label: string;
  active: boolean;
  minAge: number;
  maxAge: number;
  focus: string;
  meetingDays: string[];
  meetingSchedules?: BranchMeetingDay[];
}

export interface RosterTeam {
  id: string;
  branchId: BranchId;
  label: string;
  weekday: string;
  startTime: string;
  endTime: string;
  seasonStartDate: string;
  seasonEndDate: string;
  active: boolean;
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
