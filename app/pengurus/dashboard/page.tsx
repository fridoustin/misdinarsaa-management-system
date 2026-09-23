import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { buildContainer } from "@/lib/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function formatDateId(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { members, schedules } = buildContainer(supabase);

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);

  const [activeMembers, upcoming, drafts] = await Promise.all([
    members.list({ status: "active" }),
    schedules.listPublished(today, in7.toISOString().slice(0, 10)),
    schedules.listAll({ status: "draft" }),
  ]);
  const draftList = drafts.slice(0, 5);

  const stats = [
    { label: "Total Misdinar Aktif", value: activeMembers.length },
    { label: "Petugas Minggu Ini", value: upcoming.reduce((n, i) => n + i.officers.length, 0) },
    { label: "Jadwal Draft", value: drafts.length },
    { label: "Pertukaran Pending", value: 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-foreground/70">Ringkasan kegiatan misdinar.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-2xl font-heading font-semibold text-primary">{s.value}</p>
            <p className="text-xs text-foreground/60">{s.label}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-heading font-semibold">Jadwal Terdekat (Published)</h2>
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 && <p className="text-sm text-foreground/60">Tidak ada jadwal 7 hari ke depan.</p>}
          {upcoming.map(({ schedule, officers }) => (
            <Card key={schedule.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{formatDateId(schedule.date)}</p>
                <p className="text-xs text-foreground/60">{schedule.time} WITA · {officers.length} petugas</p>
              </div>
              <Badge tone="success">Published</Badge>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading font-semibold">Jadwal Draft (Perlu Ditindaklanjuti)</h2>
        <div className="flex flex-col gap-2">
          {draftList.length === 0 && <p className="text-sm text-foreground/60">Tidak ada draft.</p>}
          {draftList.map((d) => (
            <Link key={d.id} href={`/pengurus/jadwal/${d.id}`}>
              <Card className="flex items-center justify-between hover:border-primary">
                <div>
                  <p className="font-medium">{formatDateId(d.date)}</p>
                  <p className="text-xs text-foreground/60">{d.time} WITA</p>
                </div>
                <Badge tone="warning">Draft</Badge>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
