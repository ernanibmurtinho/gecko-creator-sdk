import { HttpClient } from "../core/HttpClient";

export interface TriggerAutomationParams {
  vaultAddress: string;
  sponsorAddress: string;
  campaignId: number;
  creatorAddress: string;
  payoutBps?: number;
  mintAddress?: string;
}

export class MilestoneClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Ask Gecko automation to create a score_threshold=0 milestone and release it.
   * Used for advance payments. Gecko's automation keypair signs — no partner signature required.
   */
  async triggerAutomation(
    params: TriggerAutomationParams
  ): Promise<{ createSig: string; releaseSig: string }> {
    const { vaultAddress, ...body } = params;
    return this.http.post<{ createSig: string; releaseSig: string }>(
      `/milestones/${vaultAddress}/automation`,
      { ...body, payoutBps: body.payoutBps ?? 1000 }
    );
  }
}
