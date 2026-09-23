import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/infrastructure/supabase/database.types";
import { SupabaseMemberRepository } from "@/infrastructure/repositories/supabase-member-repository";
import { SupabaseScheduleRepository } from "@/infrastructure/repositories/supabase-schedule-repository";
import { SupabaseAttendanceRepository } from "@/infrastructure/repositories/supabase-attendance-repository";
import { MemberUseCases } from "@/application/use-cases/member/member-use-cases";
import { ScheduleUseCases } from "@/application/use-cases/schedule/schedule-use-cases";

/**
 * Composition root. Every route/server action gets its use-cases from here —
 * no file outside this one is allowed to `new SupabaseXxxRepository(...)`.
 * Swapping persistence later means editing this file only.
 */
export function buildContainer(db: SupabaseClient<Database>) {
  const memberRepo = new SupabaseMemberRepository(db);
  const scheduleRepo = new SupabaseScheduleRepository(db);
  const attendanceRepo = new SupabaseAttendanceRepository(db);

  return {
    members: new MemberUseCases(memberRepo),
    schedules: new ScheduleUseCases(scheduleRepo, memberRepo, attendanceRepo),
  };
}

export type Container = ReturnType<typeof buildContainer>;
