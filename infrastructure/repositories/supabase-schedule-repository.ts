import { SupabaseClient } from "@supabase/supabase-js";
import { ScheduleRepository } from "@/domain/repositories/schedule-repository";
import { MassSchedule, MassType, ScheduleAssignment, ScheduleStatus } from "@/domain/entities/schedule";
import { Database } from "@/infrastructure/supabase/database.types";
import { AppError } from "@/domain/errors/app-error";

type ScheduleRow = Database["public"]["Tables"]["mass_schedules"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["schedule_assignments"]["Row"];

function scheduleToEntity(row: ScheduleRow): MassSchedule {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    massTypeId: row.mass_type_id,
    officerCount: row.officer_count,
    genderComposition: row.gender_composition as unknown as MassSchedule["genderComposition"],
    status: row.status,
    createdBy: row.created_by,
  };
}

function assignmentToEntity(row: AssignmentRow): ScheduleAssignment {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    memberId: row.member_id,
    order: row.order,
    status: row.status,
    originalMemberId: row.original_member_id ?? undefined,
  };
}

export class SupabaseScheduleRepository implements ScheduleRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findById(id: string): Promise<MassSchedule | null> {
    const { data, error } = await this.db.from("mass_schedules").select("*").eq("id", id).maybeSingle();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return data ? scheduleToEntity(data) : null;
  }

  async findMany(filter?: { status?: ScheduleStatus; from?: string; to?: string }): Promise<MassSchedule[]> {
    let query = this.db.from("mass_schedules").select("*").order("date").order("time");
    if (filter?.status) query = query.eq("status", filter.status);
    if (filter?.from) query = query.gte("date", filter.from);
    if (filter?.to) query = query.lte("date", filter.to);
    const { data, error } = await query;
    if (error) throw new AppError(error.message, "DB_ERROR");
    return (data ?? []).map(scheduleToEntity);
  }

  async create(schedule: Omit<MassSchedule, "id">): Promise<MassSchedule> {
    const { data, error } = await this.db
      .from("mass_schedules")
      .insert({
        date: schedule.date,
        time: schedule.time,
        mass_type_id: schedule.massTypeId,
        officer_count: schedule.officerCount,
        gender_composition: schedule.genderComposition as unknown as Record<string, unknown>,
        status: schedule.status,
        created_by: schedule.createdBy,
      })
      .select("*")
      .single();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return scheduleToEntity(data);
  }

  async updateStatus(id: string, status: ScheduleStatus): Promise<void> {
    const { error } = await this.db.from("mass_schedules").update({ status }).eq("id", id);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("mass_schedules").delete().eq("id", id);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async listAssignments(scheduleId: string): Promise<ScheduleAssignment[]> {
    const { data, error } = await this.db
      .from("schedule_assignments")
      .select("*")
      .eq("schedule_id", scheduleId)
      .order("order");
    if (error) throw new AppError(error.message, "DB_ERROR");
    return (data ?? []).map(assignmentToEntity);
  }

  async saveAssignments(
    scheduleId: string,
    assignments: Omit<ScheduleAssignment, "id" | "scheduleId">[],
  ): Promise<void> {
    // Replace-all is the simplest correct model for "pengurus edits then saves" (spec section 4).
    const del = await this.db.from("schedule_assignments").delete().eq("schedule_id", scheduleId);
    if (del.error) throw new AppError(del.error.message, "DB_ERROR");

    const rows = assignments.map((a) => ({
      schedule_id: scheduleId,
      member_id: a.memberId,
      order: a.order,
      status: a.status,
      original_member_id: a.originalMemberId ?? null,
    }));
    const { error } = await this.db.from("schedule_assignments").insert(rows);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async replaceAssignmentMember(assignmentId: string, newMemberId: string, originalMemberId: string): Promise<void> {
    const { error } = await this.db
      .from("schedule_assignments")
      .update({ member_id: newMemberId, status: "swapped", original_member_id: originalMemberId })
      .eq("id", assignmentId);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async listMassTypes(): Promise<MassType[]> {
    const { data, error } = await this.db.from("mass_types").select("*").order("name");
    if (error) throw new AppError(error.message, "DB_ERROR");
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, defaultOfficerCount: r.default_officer_count }));
  }

  async countAssignmentsByMember(from: string, to: string): Promise<Record<string, number>> {
    // Two simple queries beat one hard-to-type join (ponytail: fine at this data scale).
    const { data: inRange, error: rangeError } = await this.db
      .from("mass_schedules")
      .select("id")
      .gte("date", from)
      .lte("date", to);
    if (rangeError) throw new AppError(rangeError.message, "DB_ERROR");

    const scheduleIds = (inRange ?? []).map((s) => s.id);
    if (scheduleIds.length === 0) return {};

    const { data, error } = await this.db
      .from("schedule_assignments")
      .select("member_id")
      .in("schedule_id", scheduleIds);
    if (error) throw new AppError(error.message, "DB_ERROR");

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.member_id] = (counts[row.member_id] ?? 0) + 1;
    }
    return counts;
  }

  async deleteBefore(date: string): Promise<number> {
    const { data: toRemove, error: selectError } = await this.db
      .from("mass_schedules").select("id").lt("date", date);
    if (selectError) throw new AppError(selectError.message, "DB_ERROR");
    if (!toRemove || toRemove.length === 0) return 0;
    const { error } = await this.db.from("mass_schedules").delete().lt("date", date);
    if (error) throw new AppError(error.message, "DB_ERROR");
    return toRemove.length;
  }
}
