"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CandidateOption {
  memberId: string;
  fullName: string;
  nickname: string;
  gender: "L" | "P";
  score: number;
  reasons: string[];
}

export interface MemberOption {
  id: string;
  fullName: string;
  nickname: string;
  gender: "L" | "P";
}

/**
 * Pengurus keeps full control over the generated list (spec section 4):
 * remove, re-add, or reorder before saving. Nothing here auto-publishes.
 */
export function CandidateEditor({
  initialCandidates,
  allMembers,
  compositionUnmet,
  onSave,
}: {
  initialCandidates: CandidateOption[];
  allMembers: MemberOption[];
  compositionUnmet: boolean;
  onSave: (memberIds: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<CandidateOption[]>(initialCandidates);
  const [addingId, setAddingId] = useState("");
  const [pending, startTransition] = useTransition();

  const availableToAdd = allMembers.filter((m) => !selected.some((s) => s.memberId === m.id));

  function remove(memberId: string) {
    setSelected((s) => s.filter((c) => c.memberId !== memberId));
  }

  function add() {
    const member = allMembers.find((m) => m.id === addingId);
    if (!member) return;
    setSelected((s) => [...s, { memberId: member.id, fullName: member.fullName, nickname: member.nickname, gender: member.gender, score: 0, reasons: ["Ditambahkan manual"] }]);
    setAddingId("");
  }

  function move(index: number, dir: -1 | 1) {
    setSelected((s) => {
      const next = [...s];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading font-semibold">Kandidat Petugas ({selected.length})</h2>
        {compositionUnmet && <Badge tone="warning">Komposisi gender tidak terpenuhi penuh</Badge>}
      </div>

      <ul className="flex flex-col gap-2">
        {selected.map((c, i) => (
          <li key={c.memberId} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">{i + 1}. {c.fullName} <span className="text-foreground/60">({c.nickname})</span></p>
              <p className="text-xs text-foreground/60">{c.reasons.join(" · ")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" onClick={() => move(i, -1)} aria-label="Naikkan urutan">↑</Button>
              <Button variant="ghost" onClick={() => move(i, 1)} aria-label="Turunkan urutan">↓</Button>
              <Button variant="destructive" onClick={() => remove(c.memberId)}>Hapus</Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <select
          value={addingId}
          onChange={(e) => setAddingId(e.target.value)}
          className="rounded-xl border border-border px-3 py-2 text-sm"
        >
          <option value="">Tambah anggota lain...</option>
          {availableToAdd.map((m) => (
            <option key={m.id} value={m.id}>{m.fullName} ({m.nickname})</option>
          ))}
        </select>
        <Button variant="secondary" onClick={add} disabled={!addingId}>Tambah</Button>

        <div className="ml-auto">
          <Button
            disabled={pending || selected.length === 0}
            onClick={() => startTransition(() => onSave(selected.map((c) => c.memberId)))}
          >
            {pending ? "Menyimpan..." : "Simpan Jadwal"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
