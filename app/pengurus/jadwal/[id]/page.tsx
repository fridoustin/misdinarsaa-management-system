import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { buildContainer } from "@/lib/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CandidateEditor, CandidateOption } from "@/components/features/candidate-editor";
import { saveAssignmentsArrayAction, publishScheduleAction } from "../actions";

function formatDateId(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default async function JadwalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { schedules, members } = buildContainer(supabase);

  const [schedule, allMembers] = await Promise.all([
    schedules.listAll().then((list) => list.find((s) => s.id === id) ?? null),
    members.list({ status: "active" }),
  ]);

  if (!schedule) notFound();

  const memberById = new Map(allMembers.map((m) => [m.id, m]));

  // Already-saved assignments take precedence over a fresh generation, so reopening
  // a schedule shows what was saved rather than silently re-generating.
  const savedAssignments = await schedules.listAssignments(id);
  let candidates: CandidateOption[];
  let compositionUnmet = false;

  if (savedAssignments.length > 0) {
    candidates = savedAssignments
      .sort((a, b) => a.order - b.order)
      .map((a) => {
        const m = memberById.get(a.memberId);
        return {
          memberId: a.memberId,
          fullName: m?.fullName ?? "(anggota tidak ditemukan)",
          nickname: m?.nickname ?? "-",
          gender: m?.gender ?? "L",
          score: 0,
          reasons: a.status === "swapped" ? ["Hasil pertukaran tugas"] : ["Tersimpan"],
        };
      });
  } else {
    const generated = await schedules.generateCandidates(id);
    compositionUnmet = generated.compositionUnmet;
    candidates = generated.candidates.map((c) => ({
      memberId: c.member.id,
      fullName: c.member.fullName,
      nickname: c.member.nickname,
      gender: c.member.gender,
      score: c.score,
      reasons: c.reasons,
    }));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{formatDateId(schedule.date)}</h1>
          <p className="text-sm text-foreground/70">{schedule.time} WITA · {schedule.officerCount} petugas dibutuhkan</p>
        </div>
        <Badge tone={schedule.status === "published" ? "success" : "warning"}>
          {schedule.status === "published" ? "Published" : "Draft"}
        </Badge>
      </div>

      <CandidateEditor
        initialCandidates={candidates}
        allMembers={allMembers.map((m) => ({ id: m.id, fullName: m.fullName, nickname: m.nickname, gender: m.gender }))}
        compositionUnmet={compositionUnmet}
        onSave={saveAssignmentsArrayAction.bind(null, id)}
      />

      {schedule.status === "draft" && savedAssignments.length > 0 && (
        <Card className="flex items-center justify-between">
          <p className="text-sm">Jadwal sudah memiliki petugas. Publikasikan agar tampil di halaman publik.</p>
          <form action={publishScheduleAction.bind(null, id)}>
            <Button type="submit">Publikasikan</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
