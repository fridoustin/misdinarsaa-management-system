import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export type Role = "pengurus" | "admin";

export interface CurrentUser {
  id: string;
  fullName: string;
  role: Role;
}

/**
 * Single place that resolves "who is logged in and what's their role".
 * Every server component/action asks this instead of querying Supabase auth directly.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return null;

  return { id: profile.id, fullName: profile.full_name, role: profile.role as Role };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
