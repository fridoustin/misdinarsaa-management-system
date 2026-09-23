import { SupabaseClient } from "@supabase/supabase-js";
import { AttendanceRepository } from "@/domain/repositories/attendance-repository";
import { AttendanceActivityType, AttendanceRecord, AttendanceSession } from "@/domain/entities/attendance";
import { Database } from "@/infrastructure/supabase/database.types";
import { AppError } from "@/domain/errors/app-error";

export class SupabaseAttendanceRepository implements AttendanceRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async createSession(session: Omit<AttendanceSession, "id">): Promise<AttendanceSession> {
    const { data, error } = await this.db
      .from("attendance_sessions")
      .insert({ type: session.type, date: session.date, created_by: session.createdBy })
      .select("*")
      .single();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return { id: data.id, type: data.type as AttendanceActivityType, date: data.date, createdBy: data.created_by };
  }

  async saveRecords(sessionId: string, records: Omit<AttendanceRecord, "id" | "sessionId">[]): Promise<void> {
    const rows = records.map((r) => ({ session_id: sessionId, member_id: r.memberId, present: r.present }));
    const { error } = await this.db.from("attendance_records").insert(rows);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async listSessions(filter?: {
    type?: AttendanceActivityType;
    from?: string;
    to?: string;
  }): Promise<AttendanceSession[]> {
    let query = this.db.from("attendance_sessions").select("*").order("date", { ascending: false });
    if (filter?.type) query = query.eq("type", filter.type);
    if (filter?.from) query = query.gte("date", filter.from);
    if (filter?.to) query = query.lte("date", filter.to);
    const { data, error } = await query;
    if (error) throw new AppError(error.message, "DB_ERROR");
    return (data ?? []).map((r) => ({
      id: r.id,
      type: r.type as AttendanceActivityType,
      date: r.date,
      createdBy: r.created_by,
    }));
  }

  async listRecordsByMember(memberId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await this.db.from("attendance_records").select("*").eq("member_id", memberId);
    if (error) throw new AppError(error.message, "DB_ERROR");
    return (data ?? []).map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      memberId: r.member_id,
      present: r.present,
    }));
  }
}
