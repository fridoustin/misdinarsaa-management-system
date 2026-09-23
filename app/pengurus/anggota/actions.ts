"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { buildContainer } from "@/lib/container";
import { requireUser } from "@/lib/auth";
import { Gender } from "@/domain/entities/member";

export async function createMemberAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { members } = buildContainer(supabase);

  await members.create({
    fullName: String(formData.get("fullName") ?? ""),
    nickname: String(formData.get("nickname") ?? ""),
    gender: String(formData.get("gender") ?? "L") as Gender,
    levelId: String(formData.get("levelId") ?? ""),
    status: "active",
    joinedYear: Number(formData.get("joinedYear") ?? new Date().getFullYear()),
  });

  void user; // recorded for future audit-log use-case (spec section 27)
  revalidatePath("/pengurus/anggota");
}

export async function deactivateMemberAction(id: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { members } = buildContainer(supabase);
  await members.deactivate(id);
  revalidatePath("/pengurus/anggota");
}
