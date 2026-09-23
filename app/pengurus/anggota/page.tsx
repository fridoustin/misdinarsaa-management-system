import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { buildContainer } from "@/lib/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { createMemberAction, deactivateMemberAction } from "./actions";

export default async function AnggotaPage() {
  const supabase = await createSupabaseServerClient();
  const { members } = buildContainer(supabase);
  const [list, levels] = await Promise.all([members.list(), members.listLevels()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Anggota</h1>
        <p className="text-sm text-foreground/70">{list.length} anggota terdaftar.</p>
      </div>

      <Card>
        <h2 className="mb-3 font-heading font-semibold">Tambah Anggota</h2>
        <form action={createMemberAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="fullName" placeholder="Nama lengkap" required className="rounded-xl border border-border px-3 py-2 text-sm" />
          <input name="nickname" placeholder="Nama panggilan" required className="rounded-xl border border-border px-3 py-2 text-sm" />
          <select name="gender" className="rounded-xl border border-border px-3 py-2 text-sm">
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          <select name="levelId" required className="rounded-xl border border-border px-3 py-2 text-sm">
            <option value="">Pilih tingkatan</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <Button type="submit" className="sm:col-span-2">Simpan Anggota</Button>
        </form>
      </Card>

      {list.length === 0 ? (
        <EmptyState title="Belum ada anggota" description="Tambahkan anggota pertama menggunakan form di atas." />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((m) => (
            <Card key={m.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{m.fullName} <span className="text-foreground/60">({m.nickname})</span></p>
                <p className="text-xs text-foreground/60">{m.gender === "L" ? "Laki-laki" : "Perempuan"} · Bergabung {m.joinedYear}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={m.status === "active" ? "success" : "neutral"}>{m.status === "active" ? "Aktif" : "Nonaktif"}</Badge>
                {m.status === "active" && (
                  <form action={deactivateMemberAction.bind(null, m.id)}>
                    <Button type="submit" variant="ghost">Nonaktifkan</Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
