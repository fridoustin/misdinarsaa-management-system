import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { buildContainer } from "@/lib/container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function formatDateId(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export default async function PublicJadwalPage() {
  const supabase = await createSupabaseServerClient();
  const { schedules } = buildContainer(supabase);

  const today = new Date().toISOString().slice(0, 10);
  const to = new Date();
  to.setDate(to.getDate() + 30);

  const items = await schedules.listPublished(today, to.toISOString().slice(0, 10));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-24">
      <h1 className="text-2xl font-semibold">Jadwal Misdinar</h1>
      <p className="mt-1 text-sm text-foreground/70">30 hari ke depan.</p>

      <div className="mt-6 flex flex-col gap-3">
        {items.length === 0 && (
          <EmptyState title="Belum ada jadwal" description="Jadwal akan tampil di sini setelah dipublikasikan pengurus." />
        )}
        {items.map(({ schedule, officers }) => (
          <Card key={schedule.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading font-semibold">{formatDateId(schedule.date)}</p>
                <p className="text-sm text-foreground/70">{schedule.time} WITA · {officers.length} Petugas</p>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-primary">Lihat petugas</summary>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-foreground/80">
                {officers.map((o) => (
                  <li key={o.id}>{o.nickname}</li>
                ))}
              </ul>
            </details>
          </Card>
        ))}
      </div>
    </main>
  );
}
