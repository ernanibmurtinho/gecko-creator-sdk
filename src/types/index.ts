import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";

// ─── Config ──────────────────────────────────────────────────────────────────

export interface GeckoConfig {
  /** Gecko API base URL. Production: https://api.geckovision.tech */
  apiBase: string;
  /** Partner API key (x-api-key header) */
  apiKey: string;
  /** Partner's signing keypair or signTransaction function */
  signer: Keypair | SignerFn;
  /** Solana network. Default: "mainnet-beta" */
  network?: "mainnet-beta" | "devnet";
  /** Override Solana RPC URL. If omitted, uses public endpoint for network. */
  rpcUrl?: string;
}

export type SignerFn = (
  tx: Transaction | VersionedTransaction
) => Promise<Transaction | VersionedTransaction>;

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface CreatorInput {
  /** Base58 Solana wallet address */
  address: string;
  /** Allocation in basis points. Must sum to 10000 across all creators. */
  allocationBps: number;
}

export interface CreateCampaignParams {
  creators: CreatorInput[];
  /** USDC amount in base units (6 decimals). e.g. 5000 USDC = 5000_000000 */
  amount: number;
  /** Cliff period in days (minimum 1 on devnet, 30 in production) */
  cliffDays: number;
  /** Campaign end in days from now (must be >= cliffDays) */
  endDays: number;
  /** Oracle source identifier. e.g. "shikenso" | "manual" */
  oracleSource: string;
  /** Whether to fire a 10% advance payment to creators on start. Default: true */
  advancePayment?: boolean;
  /** USDC mint address. Defaults to devnet/mainnet USDC based on network. */
  mintAddress?: string;
}

export interface CreateCampaignResult {
  vaultAddress: string;
  campaignId: number;
  /** Transaction signatures in order: [initAndDeposit, addCreators, ...] */
  signatures: string[];
}

// ─── Vault ───────────────────────────────────────────────────────────────────

export interface VaultState {
  address: string;
  sponsor: string;
  mint: string;
  principal: string;
  totalYieldRouted: string;
  cliffTs: number;
  endTs: number;
  campaignId: number;
  memberCount: number;
  status: "active" | "cliffed" | "closed";
}

// ─── Creator / Score ─────────────────────────────────────────────────────────

export interface SquadScoreState {
  address: string;
  vault: string;
  creator: string;
  score: number;
  campaignsCompleted: number;
  approvalRate: number;
  onTimeDelivery: number;
  updatedAt: number;
}

export interface ReputationAccountState {
  address: string;
  creator: string;
  globalScore: number;
  totalCampaigns: number;
  totalYieldEarned: string;
  lastUpdated: number;
}

// ─── Internal ────────────────────────────────────────────────────────────────

/** Shape returned by Gecko API tx-building endpoints */
export interface SerializedTransaction {
  transaction: string; // base64 unsigned tx
  meta: Record<string, string>;
}
