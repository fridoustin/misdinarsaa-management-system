import { Member } from "@/domain/entities/member";
import { GenderComposition } from "@/domain/entities/schedule";
import { AttendanceSummary } from "@/domain/entities/attendance";

export interface ScoringInput {
  member: Member;
  attendance?: AttendanceSummary;
  assignmentCountInPeriod: number; // fairness input
  alreadyBookedOnDate: boolean; // conflicting assignment same date
}

export interface ScoredMember {
  member: Member;
  score: number;
  reasons: string[]; // human-readable, shown to pengurus if needed
}

const MAX_ASSIGNMENTS_FOR_FAIRNESS = 10; // ponytail: fixed normalization window, revisit if periods grow

/**
 * Simple, transparent scoring per spec section 5. Kept as one pure function so
 * both "generate candidates" and any future re-ranking reuse identical logic.
 */
export function scoreMember(input: ScoringInput): ScoredMember {
  const reasons: string[] = [];
  let score = 0;

  if (input.alreadyBookedOnDate) {
    return { member: input.member, score: -Infinity, reasons: ["Sudah bertugas di tanggal ini"] };
  }

  const attendancePct = input.attendance?.percentage ?? 100; // no history yet = neutral, not penalized
  score += attendancePct * 0.4;
  if (input.attendance) reasons.push(`Kehadiran ${attendancePct}%`);

  const fairness = Math.max(0, MAX_ASSIGNMENTS_FOR_FAIRNESS - input.assignmentCountInPeriod);
  score += fairness * 4; // fewer recent assignments -> higher score
  reasons.push(`${input.assignmentCountInPeriod} tugas dalam periode ini`);

  return { member: input.member, score, reasons };
}

/**
 * Picks the top-N candidates honoring gender composition as a soft constraint.
 * Never throws when composition can't be fully satisfied — returns the best
 * available and lets the caller surface a notice (spec section 6).
 */
export function pickCandidates(
  scored: ScoredMember[],
  count: number,
  composition: GenderComposition,
): { candidates: ScoredMember[]; compositionUnmet: boolean } {
  const eligible = scored.filter((s) => s.score > -Infinity).sort((a, b) => b.score - a.score);

  if (composition.mode === "none") {
    return { candidates: eligible.slice(0, count), compositionUnmet: false };
  }

  if (composition.mode === "male_only" || composition.mode === "female_only") {
    const wanted = composition.mode === "male_only" ? "L" : "P";
    const filtered = eligible.filter((s) => s.member.gender === wanted);
    return { candidates: filtered.slice(0, count), compositionUnmet: filtered.length < count };
  }

  // balanced
  const wantMale = composition.maleCount ?? Math.ceil(count / 2);
  const wantFemale = composition.femaleCount ?? Math.floor(count / 2);
  const males = eligible.filter((s) => s.member.gender === "L").slice(0, wantMale);
  const females = eligible.filter((s) => s.member.gender === "P").slice(0, wantFemale);
  let candidates = [...males, ...females];
  const unmet = males.length < wantMale || females.length < wantFemale;

  if (candidates.length < count) {
    const rest = eligible.filter((s) => !candidates.includes(s));
    candidates = [...candidates, ...rest.slice(0, count - candidates.length)];
  }

  return { candidates: candidates.slice(0, count), compositionUnmet: unmet };
}
