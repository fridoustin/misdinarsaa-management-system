import { AttendanceActivityType, AttendanceRecord, AttendanceSession } from "../entities/attendance";

export interface AttendanceRepository {
  createSession(session: Omit<AttendanceSession, "id">): Promise<AttendanceSession>;
  saveRecords(sessionId: string, records: Omit<AttendanceRecord, "id" | "sessionId">[]): Promise<void>;
  listSessions(filter?: { type?: AttendanceActivityType; from?: string; to?: string }): Promise<AttendanceSession[]>;
  /** All attendance records for a member, newest first — used for both history view and candidate scoring. */
  listRecordsByMember(memberId: string): Promise<AttendanceRecord[]>;
}
