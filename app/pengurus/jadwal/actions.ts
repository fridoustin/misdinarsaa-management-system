"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { buildContainer } from "@/lib/container";
import { requireUser } from "@/lib/auth";
import { GenderComposition } from "@/domain/entities/schedule";

export async function createScheduleAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);

  const compositionMode = String(formData.get("compositionMode") ?? "none") as GenderComposition["mode"];

  const schedule = await schedules.createDraft({
    date: String(formData.get("date")),
    time: String(formData.get("time")),
    massTypeId: String(formData.get("massTypeId")),
    officerCount: Number(formData.get("officerCount")),
    genderComposition: { mode: compositionMode },
    createdBy: user.id,
  });

  redirect(`/pengurus/jadwal/${schedule.id}`);
}

export async function saveAssignmentsAction(scheduleId: string, formData: FormData) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);

  const memberIds = formData.getAll("memberId").map(String).filter(Boolean);
  await schedules.saveAssignments(scheduleId, memberIds);
  revalidatePath(`/pengurus/jadwal/${scheduleId}`);
}

/** Same use-case as saveAssignmentsAction, callable directly with an array — used by the client CandidateEditor. */
export async function saveAssignmentsArrayAction(scheduleId: string, memberIds: string[]) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);
  await schedules.saveAssignments(scheduleId, memberIds);
  revalidatePath(`/pengurus/jadwal/${scheduleId}`);
}

export async function publishScheduleAction(scheduleId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);
  await schedules.publish(scheduleId);
  revalidatePath(`/pengurus/jadwal/${scheduleId}`);
  revalidatePath("/jadwal");
}

export async function generateMonthlyAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  await schedules.generateMonthlyDrafts(year, month, user.id);

  revalidatePath("/pengurus/jadwal");
  redirect("/pengurus/jadwal");
}

export async function deleteDraftAction(scheduleId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);
  await schedules.deleteDraft(scheduleId);
  revalidatePath("/pengurus/jadwal");
}
