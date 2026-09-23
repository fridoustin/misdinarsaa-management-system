import { MemberRepository } from "@/domain/repositories/member-repository";
import { Member, MemberStatus } from "@/domain/entities/member";
import { NotFoundError, ValidationError } from "@/domain/errors/app-error";

/**
 * One class, one collaborator (SRP + DIP): depends only on the MemberRepository
 * port. Swap the Supabase implementation for anything else without touching this file.
 */
export class MemberUseCases {
  constructor(private readonly repo: MemberRepository) {}

  list(filter?: { status?: MemberStatus }): Promise<Member[]> {
    return this.repo.findAll(filter);
  }

  async getOrThrow(id: string): Promise<Member> {
    const member = await this.repo.findById(id);
    if (!member) throw new NotFoundError("Anggota", id);
    return member;
  }

  create(input: Omit<Member, "id">): Promise<Member> {
    if (!input.fullName.trim()) throw new ValidationError("Nama lengkap wajib diisi.");
    if (!input.levelId) throw new ValidationError("Tingkatan wajib dipilih.");
    return this.repo.create(input);
  }

  async update(id: string, patch: Partial<Omit<Member, "id">>): Promise<Member> {
    await this.getOrThrow(id);
    return this.repo.update(id, patch);
  }

  async deactivate(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.repo.setStatus(id, "inactive");
  }

  async activate(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.repo.setStatus(id, "active");
  }

  listLevels() {
    return this.repo.listLevels();
  }
}
