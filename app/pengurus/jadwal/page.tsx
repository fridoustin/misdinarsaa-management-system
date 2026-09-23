import Link from "next/link";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { buildContainer } from "@/lib/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { generateMonthlyAction, deleteDraftAction } from "./actions";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatDateId(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default async function JadwalListPage() {
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);
  const list = await schedules.listAll();

  // Default pilihan: bulan depan — paling sering dipakai pengurus.
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defaultYear = nextMonthDate.getFullYear();
  const defaultMonth = nextMonthDate.getMonth() + 1;

  const grouped = new Map<string, typeof list>();
  for (const s of list) {
    const key = s.date.slice(0, 7); // yyyy-mm
    grouped.set(key, [...(grouped.get(key) ?? []), s]);
  }
  const groupKeys = [...grouped.keys()].sort();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Jadwal</h1>
        <p className="text-sm text-foreground/70">
          Generate seluruh jadwal misa dalam satu bulan sekaligus (Selasa, Jumat, Sabtu, Minggu).
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-heading font-semibold">Generate Jadwal Bulanan</h2>
        <form action={generateMonthlyAction} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Bulan</label>
            <select name="month" defaultValue={defaultMonth} className="rounded-xl border border-border px-3 py-2 text-sm">
              {BULAN.map((b, i) => (
                <option key={b} value={i + 1}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tahun</label>
            <input
              type="number"
              name="year"
              defaultValue={defaultYear}
              className="w-28 rounded-xl border border-border px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit">Generate Jadwal Bulan Ini</Button>
        </form>
        <p className="mt-3 text-xs text-foreground/60">
          Tanggal yang sudah punya jadwal tidak akan dibuat ulang. Setelah digenerate, buka tiap jadwal untuk
          generate &amp; atur petugasnya, atau hapus tanggal yang tidak diperlukan (misal libur).
        </p>
      </Card>

      {list.length === 0 ? (
        <EmptyState title="Belum ada jadwal petugas untuk periode ini." />
      ) : (
        groupKeys.map((key) => {
          const [y, m] = key.split("-");
          const items = grouped.get(key)!.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
          return (
            <div key={key}>
              <h3 className="mb-2 font-heading font-semibold text-foreground/80">
                {BULAN[Number(m) - 1]} {y}
              </h3>
              <div className="flex flex-col gap-2">
                {items.map((s) => (
                  <Card key={s.id} className="flex items-center justify-between">
                    <Link href={`/pengurus/jadwal/${s.id}`} className="flex-1">
                      <p className="font-medium">{formatDateId(s.date)}</p>
                      <p className="text-xs text-foreground/60">{s.time} WITA · {s.officerCount} petugas</p>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge tone={s.status === "published" ? "success" : "warning"}>
                        {s.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      {s.status === "draft" && (
                        <form action={deleteDraftAction.bind(null, s.id)}>
                          <Button type="submit" variant="ghost">Hapus</Button>
                        </form>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
