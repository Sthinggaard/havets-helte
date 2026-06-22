export type AttendanceViewMode = 'day' | 'week' | 'month' | 'year';

export type BranchId = 'junior' | 'ulv' | 'trop' | 'soespejder';

export interface Branch {
  id: BranchId;
  label: string;
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  branchId: BranchId;
  weekday: string;
  active: boolean;
}

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

