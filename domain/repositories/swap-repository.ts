import { SwapRequest, SwapStatus } from "../entities/swap-request";

export interface SwapRepository {
  create(request: Omit<SwapRequest, "id" | "createdAt">): Promise<SwapRequest>;
  findById(id: string): Promise<SwapRequest | null>;
  updateStatus(id: string, status: SwapStatus, decidedBy?: string): Promise<void>;
  listPending(): Promise<SwapRequest[]>;
}
