import { ScheduleRepository } from "@/domain/repositories/schedule-repository";
import { MemberRepository } from "@/domain/repositories/member-repository";
import { AttendanceRepository } from "@/domain/repositories/attendance-repository";
import { MassSchedule, ScheduleAssignment } from "@/domain/entities/schedule";
import { toPublicMember, PublicMember } from "@/domain/entities/member";
import { summarizeAttendance } from "@/domain/entities/attendance";
import { NotFoundError, ValidationError } from "@/domain/errors/app-error";
import { pickCandidates, scoreMember, ScoredMember } from "@/application/services/candidate-scoring.service";
import { computeMonthlySchedule } from "@/application/services/monthly-schedule.service";

export interface PublicScheduleItem {
  schedule: MassSchedule;
  officers: PublicMember[];
}

/**
 * Orchestrates schedule creation and candidate generation. Depends only on
 * repository ports (DIP) — no Supabase import here.
 */
export class ScheduleUseCases {
  constructor(
    private readonly scheduleRepo: ScheduleRepository,
    private readonly memberRepo: MemberRepository,
    private readonly attendanceRepo: AttendanceRepository,
  ) {}

  createDraft(input: Omit<MassSchedule, "id" | "status">): Promise<MassSchedule> {
    if (input.officerCount <= 0) throw new ValidationError("Jumlah petugas harus lebih dari 0.");
    return this.scheduleRepo.create({ ...input, status: "draft" });
  }

  /**
   * Generates every schedule slot for a calendar month from the church's fixed
   * weekly pattern (Selasa/Jumat/Sabtu/Minggu), skipping dates that already
   * have a schedule so re-running this is always safe. Pengurus edits/removes
   * individual dates afterward — nothing here is final until saved+published.
   */
  async generateMonthlyDrafts(year: number, month1to12: number, createdBy: string): Promise<number> {
    const lastDay = new Date(year, month1to12, 0).getDate();
    const [massTypes, existing] = await Promise.all([
      this.scheduleRepo.listMassTypes(),
      this.scheduleRepo.findMany({
        from: `${year}-${String(month1to12).padStart(2, "0")}-01`,
        to: `${year}-${String(month1to12).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
      }),
    ]);

    const planned = computeMonthlySchedule(year, month1to12);
    let created = 0;

    for (const item of planned) {
      const massType = massTypes.find((t) => t.name === item.massTypeName);
      if (!massType) continue; // mass type not configured yet — skip rather than fail the whole batch

      const alreadyExists = existing.some((s) => s.date === item.date && s.massTypeId === massType.id);
      if (alreadyExists) continue;

      await this.scheduleRepo.create({
        date: item.date,
        time: item.time,
        massTypeId: massType.id,
        officerCount: massType.defaultOfficerCount,
        genderComposition: { mode: "none" },
        status: "draft",
        createdBy,
      });
      created += 1;
    }

    return created;
  }

  async deleteDraft(scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) throw new NotFoundError("Jadwal", scheduleId);
    if (schedule.status !== "draft") throw new ValidationError("Jadwal yang sudah dipublikasikan tidak bisa dihapus.");
    await this.scheduleRepo.delete(scheduleId);
  }

  cleanupPastSchedules(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    return this.scheduleRepo.deleteBefore(today);
  }

  /** Generates ranked candidates per spec section 5 — pengurus reviews before saving. */
  async generateCandidates(scheduleId: string): Promise<{ candidates: ScoredMember[]; compositionUnmet: boolean }> {
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) throw new NotFoundError("Jadwal", scheduleId);

    const [members, counts] = await Promise.all([
      this.memberRepo.findAll({ status: "active" }),
      this.scheduleRepo.countAssignmentsByMember(periodStart(schedule.date), schedule.date),
    ]);

    const scored = await Promise.all(
      members.map(async (member) => {
        const records = await this.attendanceRepo.listRecordsByMember(member.id);
        const attendance = records.length ? summarizeAttendance(member.id, records) : undefined;
        return scoreMember({
          member,
          attendance,
          assignmentCountInPeriod: counts[member.id] ?? 0,
          alreadyBookedOnDate: false, // ponytail: same-date conflict check deferred, add when multi-mass-per-day scheduling lands
        });
      }),
    );

    return pickCandidates(scored, schedule.officerCount, schedule.genderComposition);
  }

  /** Pengurus's final, edited list is what gets persisted — system never auto-publishes. */
  async saveAssignments(scheduleId: string, memberIds: string[]): Promise<void> {
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) throw new NotFoundError("Jadwal", scheduleId);
    if (memberIds.length === 0) throw new ValidationError("Minimal satu petugas harus dipilih.");

    const assignments: Omit<ScheduleAssignment, "id" | "scheduleId">[] = memberIds.map((memberId, i) => ({
      memberId,
      order: i + 1,
      status: "assigned",
    }));
    await this.scheduleRepo.saveAssignments(scheduleId, assignments);
  }

  async publish(scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepo.findById(scheduleId);
    if (!schedule) throw new NotFoundError("Jadwal", scheduleId);
    const assignments = await this.scheduleRepo.listAssignments(scheduleId);
    if (assignments.length === 0) throw new ValidationError("Jadwal belum memiliki petugas.");
    await this.scheduleRepo.updateStatus(scheduleId, "published");
  }

  /** Pengurus-facing listing (any status) — reuses the same repo method as listPublished. */
  listAll(filter?: Parameters<ScheduleRepository["findMany"]>[0]): Promise<MassSchedule[]> {
    return this.scheduleRepo.findMany(filter);
  }

  listMassTypes() {
    return this.scheduleRepo.listMassTypes();
  }

  listAssignments(scheduleId: string) {
    return this.scheduleRepo.listAssignments(scheduleId);
  }

  /** Public, unauthenticated view — only published schedules, only safe member fields. */
  async listPublished(from: string, to: string): Promise<PublicScheduleItem[]> {
    const schedules = await this.scheduleRepo.findMany({ status: "published", from, to });
    const items = await Promise.all(
      schedules.map(async (schedule) => {
        const assignments = await this.scheduleRepo.listAssignments(schedule.id);
        const officers = await Promise.all(
          assignments
            .sort((a, b) => a.order - b.order)
            .map((a) => this.memberRepo.findById(a.memberId)),
        );
        return {
          schedule,
          officers: officers.filter((m): m is NonNullable<typeof m> => m !== null).map(toPublicMember),
        };
      }),
    );
    return items;
  }
}

/** Fairness window: assignments in the last 60 days count toward the score. */
function periodStart(dateIso: string): string {
  const d = new Date(dateIso);
  d.setDate(d.getDate() - 60);
  return d.toISOString().slice(0, 10);
}