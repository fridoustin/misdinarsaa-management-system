import { SupabaseClient } from "@supabase/supabase-js";
import { MemberRepository } from "@/domain/repositories/member-repository";
import { Member, MemberLevel, MemberStatus } from "@/domain/entities/member";
import { Database } from "@/infrastructure/supabase/database.types";
import { AppError } from "@/domain/errors/app-error";

type Row = Database["public"]["Tables"]["members"]["Row"];

/** Row <-> entity mapping lives ONLY here — no other file touches raw Supabase rows for members. */
function toEntity(row: Row): Member {
  return {
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname,
    gender: row.gender,
    levelId: row.level_id,
    status: row.status,
    joinedYear: row.joined_year,
    photoUrl: row.photo_url ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
  };
}

function toRow(m: Omit<Member, "id">): Database["public"]["Tables"]["members"]["Insert"] {
  return {
    full_name: m.fullName,
    nickname: m.nickname,
    gender: m.gender,
    level_id: m.levelId,
    status: m.status,
    joined_year: m.joinedYear,
    photo_url: m.photoUrl ?? null,
    phone: m.phone ?? null,
    address: m.address ?? null,
  };
}

export class SupabaseMemberRepository implements MemberRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Member | null> {
    const { data, error } = await this.db.from("members").select("*").eq("id", id).maybeSingle();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return data ? toEntity(data) : null;
  }

  async findAll(filter?: { status?: MemberStatus }): Promise<Member[]> {
    let query = this.db.from("members").select("*").order("full_name");
    if (filter?.status) query = query.eq("status", filter.status);
    const { data, error } = await query;
    if (error) throw new AppError(error.message, "DB_ERROR");
    return (data ?? []).map(toEntity);
  }

  async create(member: Omit<Member, "id">): Promise<Member> {
    const { data, error } = await this.db.from("members").insert(toRow(member)).select("*").single();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return toEntity(data);
  }

  async update(id: string, patch: Partial<Omit<Member, "id">>): Promise<Member> {
    const row: Database["public"]["Tables"]["members"]["Update"] = {
      ...(patch.fullName !== undefined && { full_name: patch.fullName }),
      ...(patch.nickname !== undefined && { nickname: patch.nickname }),
      ...(patch.gender !== undefined && { gender: patch.gender }),
      ...(patch.levelId !== undefined && { level_id: patch.levelId }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.joinedYear !== undefined && { joined_year: patch.joinedYear }),
      ...(patch.photoUrl !== undefined && { photo_url: patch.photoUrl }),
      ...(patch.phone !== undefined && { phone: patch.phone }),
      ...(patch.address !== undefined && { address: patch.address }),
    };
    const { data, error } = await this.db.from("members").update(row).eq("id", id).select("*").single();
    if (error) throw new AppError(error.message, "DB_ERROR");
    return toEntity(data);
  }

  async setStatus(id: string, status: MemberStatus): Promise<void> {
    const { error } = await this.db.from("members").update({ status }).eq("id", id);
    if (error) throw new AppError(error.message, "DB_ERROR");
  }

  async listLevels(): Promise<MemberLevel[]> {
    const { data, error } = await this.db.from("member_levels").select("*").order("rank");
    if (error) throw new AppError(error.message, "DB_ERROR");
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, rank: r.rank }));
  }
}
