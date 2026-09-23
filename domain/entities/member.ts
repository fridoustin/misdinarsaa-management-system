export type Gender = "L" | "P";
export type MemberStatus = "active" | "inactive";

export interface MemberLevel {
  id: string;
  name: string; // Junior, Intermediate, Senior — configurable, no hardcoded enum
  rank: number; // for sorting / eligibility comparisons
}

export interface Member {
  id: string;
  fullName: string;
  nickname: string;
  gender: Gender;
  levelId: string;
  status: MemberStatus;
  joinedYear: number;
  photoUrl?: string;
  phone?: string; // internal only, never exposed to public DTO
  address?: string; // internal only, never exposed to public DTO
}

/** Fields safe to expose on public (unauthenticated) endpoints. */
export type PublicMember = Pick<Member, "id" | "fullName" | "nickname" | "photoUrl">;

export function toPublicMember(m: Member): PublicMember {
  return { id: m.id, fullName: m.fullName, nickname: m.nickname, photoUrl: m.photoUrl };
}
