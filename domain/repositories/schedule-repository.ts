import { MassSchedule, MassType, ScheduleAssignment, ScheduleStatus } from "../entities/schedule";

export interface ScheduleRepository {
  findById(id: string): Promise<MassSchedule | null>;
  findMany(filter?: { status?: ScheduleStatus; from?: string; to?: string }): Promise<MassSchedule[]>;
  create(schedule: Omit<MassSchedule, "id">): Promise<MassSchedule>;
  updateStatus(id: string, status: ScheduleStatus): Promise<void>;
  delete(id: string): Promise<void>;

  listAssignments(scheduleId: string): Promise<ScheduleAssignment[]>;
  saveAssignments(scheduleId: string, assignments: Omit<ScheduleAssignment, "id" | "scheduleId">[]): Promise<void>;
  replaceAssignmentMember(assignmentId: string, newMemberId: string, originalMemberId: string): Promise<void>;

  listMassTypes(): Promise<MassType[]>;

  /** Assignment counts per member within a date range — feeds the fairness score. */
  countAssignmentsByMember(from: string, to: string): Promise<Record<string, number>>;
  deleteBefore(date: string): Promise<number>;
}
