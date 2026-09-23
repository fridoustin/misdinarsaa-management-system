export type SwapStatus =
  | "pending"
  | "waiting_replacement"
  | "waiting_approval"
  | "approved"
  | "rejected"
  | "cancelled";

export interface SwapRequest {
  id: string;
  assignmentId: string;
  requestedByMemberId: string;
  replacementMemberId?: string;
  status: SwapStatus;
  reason?: string;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

/** Valid forward transitions. Single source of truth — no status logic duplicated elsewhere. */
export const SWAP_TRANSITIONS: Record<SwapStatus, SwapStatus[]> = {
  pending: ["waiting_replacement", "cancelled"],
  waiting_replacement: ["waiting_approval", "cancelled", "rejected"],
  waiting_approval: ["approved", "rejected", "cancelled"],
  approved: [],
  rejected: [],
  cancelled: [],
};

export function canTransition(from: SwapStatus, to: SwapStatus): boolean {
  return SWAP_TRANSITIONS[from].includes(to);
}
