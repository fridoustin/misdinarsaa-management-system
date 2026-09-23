import { Member, MemberLevel, MemberStatus } from "../entities/member";

/**
 * Port. Application layer depends on this interface only — never on Supabase.
 * Any storage (Supabase today, something else tomorrow) implements it (Liskov-safe).
 */
export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findAll(filter?: { status?: MemberStatus }): Promise<Member[]>;
  create(member: Omit<Member, "id">): Promise<Member>;
  update(id: string, patch: Partial<Omit<Member, "id">>): Promise<Member>;
  setStatus(id: string, status: MemberStatus): Promise<void>;
  listLevels(): Promise<MemberLevel[]>;
}
