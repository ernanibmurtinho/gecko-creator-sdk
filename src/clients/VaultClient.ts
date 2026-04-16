import { HttpClient } from "../core/HttpClient";
import { TransactionSender } from "../core/TransactionSender";
import { VaultState } from "../types/index";

export interface InitAndDepositParams {
  sponsorAddress: string;
  campaignId: number;
  cliffDays: number;
  endDays: number;
  amount: number;
  mintAddress?: string;
}

export interface AddCreatorParams {
  sponsorAddress: string;
  campaignId: number;
  creatorAddress: string;
  allocationBps: number;
}

export class VaultClient {
  constructor(
    private readonly http: HttpClient,
    private readonly sender: TransactionSender
  ) {}

  /** Initialize vault and deposit funds atomically. Returns signature + vaultAddress. */
  async initAndDeposit(
    params: InitAndDepositParams
  ): Promise<{ signature: string; vaultAddress: string; campaignId: number }> {
    const serialized = await this.http.buildTx("/vaults/init-and-deposit", params);
    const signature = await this.sender.send(serialized);
    return {
      signature,
      vaultAddress: serialized.meta.vault,
      campaignId: Number(serialized.meta.campaignId),
    };
  }

  /** Add a single creator to a vault. */
  async addCreator(
    params: AddCreatorParams
  ): Promise<{ signature: string }> {
    const serialized = await this.http.buildTx("/vaults/creators/add", params);
    const signature = await this.sender.send(serialized);
    return { signature };
  }

  /** Fetch on-chain vault state. Returns null if vault does not exist. */
  async get(vaultAddress: string): Promise<VaultState | null> {
    return this.http.get<VaultState>(`/vaults/${vaultAddress}`);
  }
}
