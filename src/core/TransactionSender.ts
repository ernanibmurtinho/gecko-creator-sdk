import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { GeckoConfig, SerializedTransaction, SignerFn } from "../types/index";

const RPC_URLS: Record<string, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

/**
 * Signs and submits a Solana transaction returned by the Gecko API.
 * Supports Keypair (server-side) and signTransaction function (browser/Privy).
 */
export class TransactionSender {
  private readonly connection: Connection;
  private readonly signer: Keypair | SignerFn;

  constructor(config: Pick<GeckoConfig, "signer" | "network" | "rpcUrl">) {
    const rpcUrl =
      config.rpcUrl ?? RPC_URLS[config.network ?? "mainnet-beta"];
    this.connection = new Connection(rpcUrl, "confirmed");
    this.signer = config.signer;
  }

  /**
   * Deserialize, sign, and submit a base64 transaction from the Gecko API.
   * Returns the transaction signature.
   */
  async send(serialized: SerializedTransaction): Promise<string> {
    const buf = Buffer.from(serialized.transaction, "base64");
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash("confirmed");

    // Try VersionedTransaction first, fall back to legacy Transaction
    let isVersioned = true;
    let tx: VersionedTransaction | Transaction;

    try {
      tx = VersionedTransaction.deserialize(buf);
    } catch {
      isVersioned = false;
      tx = Transaction.from(buf);
    }

    // Patch blockhash on legacy transactions
    if (!isVersioned) {
      (tx as Transaction).recentBlockhash = blockhash;
    }

    // Sign
    if (this.signer instanceof Keypair) {
      if (isVersioned) {
        (tx as VersionedTransaction).sign([this.signer]);
      } else {
        (tx as Transaction).partialSign(this.signer);
      }
    } else {
      // signTransaction function (Privy, WalletAdapter, etc.)
      tx = await (this.signer as SignerFn)(tx);
    }

    // Submit
    const raw = isVersioned
      ? (tx as VersionedTransaction).serialize()
      : (tx as Transaction).serialize({ requireAllSignatures: false });

    const sig = await this.connection.sendRawTransaction(raw, {
      skipPreflight: false,
      maxRetries: 3,
    });

    await this.connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    return sig;
  }
}
