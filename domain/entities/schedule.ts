export type ScheduleStatus = "draft" | "published";

export interface MassType {
  id: string;
  name: string; // "Sabtu Sore", "Minggu Pagi", dst — configurable
  defaultOfficerCount: number;
}

export interface GenderComposition {
  mode: "balanced" | "male_only" | "female_only" | "none";
  maleCount?: number;
  femaleCount?: number;
}

export interface MassSchedule {
  id: string;
  date: string; // ISO date
  time: string; // "07:00"
  massTypeId: string;
  officerCount: number;
  genderComposition: GenderComposition;
  status: ScheduleStatus;
  createdBy: string;
}

export type AssignmentStatus = "assigned" | "swapped";

export interface ScheduleAssignment {
  id: string;
  scheduleId: string;
  memberId: string;
  order: number;
  status: AssignmentStatus;
  originalMemberId?: string; // set when this slot resulted from an approved swap
}
