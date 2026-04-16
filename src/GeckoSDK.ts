import { Keypair } from "@solana/web3.js";
import { HttpClient } from "./core/HttpClient";
import { TransactionSender } from "./core/TransactionSender";
import { VaultClient } from "./clients/VaultClient";
import { CreatorClient } from "./clients/CreatorClient";
import { MilestoneClient } from "./clients/MilestoneClient";
import {
  GeckoConfig,
  CreateCampaignParams,
  CreateCampaignResult,
} from "./types/index";

/**
 * GeckoSDK — the main entry point for brand partners.
 *
 * @example
 * ```typescript
 * const gecko = new GeckoSDK({
 *   apiBase: "https://api.geckovision.tech",
 *   apiKey: process.env.GECKO_API_KEY!,
 *   signer: companyKeypair,
 *   network: "mainnet-beta",
 * });
 *
 * const { vaultAddress } = await gecko.createCampaign({
 *   creators: [{ address: creatorWallet, allocationBps: 10000 }],
 *   amount: 5000_000000,
 *   cliffDays: 30,
 *   endDays: 90,
 *   oracleSource: "shikenso",
 *   advancePayment: true,
 * });
 * ```
 */
export class GeckoSDK {
  readonly vault: VaultClient;
  readonly creator: CreatorClient;
  readonly milestone: MilestoneClient;

  private readonly http: HttpClient;
  private readonly sender: TransactionSender;

  constructor(private readonly config: GeckoConfig) {
    this.http = new HttpClient(config.apiBase, config.apiKey);
    this.sender = new TransactionSender({
      signer: config.signer,
      network: config.network,
      rpcUrl: config.rpcUrl,
    });
    this.vault = new VaultClient(this.http, this.sender);
    this.creator = new CreatorClient(this.http);
    this.milestone = new MilestoneClient(this.http);
  }

  /**
   * Create a fully configured campaign in two sponsor-signed transactions.
   *
   * Flow:
   *   1. initAndDeposit   — creates vault + funds it (partner signs)
   *   2. addCreator(s)    — adds each creator to the vault (partner signs per creator)
   *   3. triggerAutomation — Gecko automation creates + releases advance milestone (no partner signature)
   */
  async createCampaign(params: CreateCampaignParams): Promise<CreateCampaignResult> {
    const {
      creators,
      amount,
      cliffDays,
      endDays,
      oracleSource: _oracleSource,
      advancePayment = true,
      mintAddress,
    } = params;

    if (creators.length === 0) {
      throw new Error("createCampaign requires at least one creator");
    }

    const totalBps = creators.reduce((sum, c) => sum + c.allocationBps, 0);
    if (totalBps !== 10000) {
      throw new Error(`Creator allocations must sum to 10000 bps, got ${totalBps}`);
    }

    const generatedCampaignId = Math.floor(Date.now() / 1000);

    const sponsorAddress =
      this.config.signer instanceof Keypair
        ? this.config.signer.publicKey.toBase58()
        : (() => { throw new Error("signTransaction fn: provide sponsorAddress explicitly"); })();

    const signatures: string[] = [];

    // Step 1: initAndDeposit (1 tx)
    const { signature: initSig, vaultAddress, campaignId } = await this.vault.initAndDeposit({
      sponsorAddress,
      campaignId: generatedCampaignId,
      cliffDays,
      endDays,
      amount,
      mintAddress,
    });
    signatures.push(initSig);

    // Step 2: add each creator (1 tx per creator — batch in Sprint 2)
    for (const creator of creators) {
      const { signature: addSig } = await this.vault.addCreator({
        sponsorAddress,
        campaignId,
        creatorAddress: creator.address,
        allocationBps: creator.allocationBps,
      });
      signatures.push(addSig);
    }

    // Step 3: trigger advance payment via Gecko automation (no partner signature)
    if (advancePayment) {
      for (const creator of creators) {
        await this.milestone.triggerAutomation({
          vaultAddress,
          sponsorAddress,
          campaignId,
          creatorAddress: creator.address,
          payoutBps: 1000,
          mintAddress,
        });
      }
    }

    return { vaultAddress, campaignId, signatures };
  }
}
