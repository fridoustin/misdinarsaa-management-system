export type AttendanceActivityType = "rapat" | "latihan" | "kegiatan" | "lainnya";

export interface AttendanceSession {
  id: string;
  type: AttendanceActivityType;
  date: string; // ISO date
  createdBy: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  memberId: string;
  present: boolean;
}

export interface AttendanceSummary {
  memberId: string;
  total: number;
  present: number;
  absent: number;
  percentage: number; // 0-100
}

export function summarizeAttendance(memberId: string, records: AttendanceRecord[]): AttendanceSummary {
  const total = records.length;
  const present = records.filter((r) => r.present).length;
  return {
    memberId,
    total,
    present,
    absent: total - present,
    percentage: total === 0 ? 0 : Math.round((present / total) * 100),
  };
}
