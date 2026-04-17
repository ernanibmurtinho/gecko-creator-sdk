import { HttpClient } from "../core/HttpClient";
import { ReputationAccountState, SquadScoreState } from "../types/index";

export class CreatorClient {
  constructor(private readonly http: HttpClient) {}

  /** Get a creator's per-vault score. Returns null if no score account exists. */
  async getScore(
    vaultAddress: string,
    creatorAddress: string
  ): Promise<SquadScoreState | null> {
    return this.http.get<SquadScoreState>(
      `/scores/${vaultAddress}/${creatorAddress}`
    );
  }

  /** Get a creator's global on-chain reputation. Returns null if not initialized. */
  async getReputation(creatorAddress: string): Promise<ReputationAccountState | null> {
    return this.http.get<ReputationAccountState>(
      `/reputation/${creatorAddress}`
    );
  }
}
