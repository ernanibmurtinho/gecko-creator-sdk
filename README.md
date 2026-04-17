# @gecko/sdk — On-chain creator campaign SDK for Solana

[![npm](https://img.shields.io/badge/npm-%40gecko%2Fsdk-CB3837?logo=npm)](https://www.npmjs.com/package/@gecko/sdk)
[![Solana](https://img.shields.io/badge/Solana-Mainnet%20%7C%20Devnet-14F195?logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.32-9945FF)](https://www.anchor-lang.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)

**`@gecko/sdk`** lets any Node.js backend create and manage on-chain creator campaigns on Solana in under 10 lines of code. Brands lock campaign budgets in smart contract vaults with **cliff enforcement** — the brand cannot rug creators before the cliff date. Creators earn a guaranteed advance payment from day one, plus performance milestone payouts.

---

## The problem

Creator marketing is **trust-based**: brands fear creators ghosting after briefs; creators fear brands renegotiating or delaying pay after delivery. Deals run on email, screenshots, and PDFs — not verifiable commitment.

---

## The solution

**Lock the brand's commitment from day one.** Funds sit in an on-chain vault. Early withdrawal is rejected by the Solana program (`CliffNotElapsed`), not by policy. Creators work knowing capital cannot be pulled; sponsors get an on-chain audit trail.

| Side | Before | With Gecko |
|------|--------|------------|
| Brand | Upfront risk, weak recourse | **On-chain lock** + audit trail |
| Creator | Net-30 → net-never | **Guaranteed advance** from campaign start |

---

## What this SDK does

The SDK wraps the Gecko API and Solana transaction signing into a single ergonomic interface:

1. **`initAndDeposit`** — creates the vault PDA and funds it in one atomic transaction (brand signs)
2. **`addCreators`** — adds creators to the vault in batches of up to 5 per transaction (brand signs)
3. **`set-live`** — Gecko automation fires the advance payment milestone and `campaign.started` webhook (no brand signature required)

Everything else — reading vault state, querying creator earnings, fetching milestone data — is handled by the client sub-classes.

---

## Installation

```bash
npm install @gecko/sdk
# or
pnpm add @gecko/sdk
```

---

## Quickstart

```typescript
import { GeckoSDK } from "@gecko/sdk"
import { Keypair } from "@solana/web3.js"

const gecko = new GeckoSDK({
  apiBase: "https://api.geckovision.tech",
  apiKey: process.env.GECKO_API_KEY!,
  signer: companyKeypair,          // Keypair — your brand's Solana wallet
  network: "mainnet-beta",         // or "devnet"
})

// Create a campaign: vault + deposit + add creators + fire advance payment
const { vaultAddress, campaignId, signatures } = await gecko.createCampaign({
  creators: [
    { address: "CreatorWalletPubkey...", allocationBps: 6000 },  // 60%
    { address: "CreatorWalletPubkey...", allocationBps: 4000 },  // 40%
  ],
  amount: 5_000_000_000,   // 5,000 USDC (6 decimals)
  cliffDays: 30,           // brand cannot close vault for 30 days
  endDays: 90,             // campaign runs 90 days
  oracleSource: "shikenso",
  advancePayment: true,    // fire advance milestone on campaign start
})

console.log("Vault:", vaultAddress)
console.log("Signatures:", signatures)
```

---

## API reference

### `new GeckoSDK(config)`

| Field | Type | Description |
|-------|------|-------------|
| `apiBase` | `string` | Gecko API base URL |
| `apiKey` | `string` | Partner API key (from partner portal) |
| `signer` | `Keypair` | Brand's Solana keypair — signs vault transactions |
| `network` | `"mainnet-beta" \| "devnet"` | Solana network |
| `rpcUrl` | `string?` | Optional custom RPC endpoint |

### `gecko.createCampaign(params)`

| Field | Type | Description |
|-------|------|-------------|
| `creators` | `{ address: string; allocationBps: number }[]` | Creator wallets + allocation. Must sum to `10000` bps. Max 10 creators. |
| `amount` | `number` | USDC amount in base units (1 USDC = 1_000_000) |
| `cliffDays` | `number` | Days until brand can close vault (min 30 in production) |
| `endDays` | `number` | Campaign duration in days |
| `oracleSource` | `string` | Oracle identifier (e.g. `"shikenso"`, `"manual"`) |
| `advancePayment` | `boolean?` | Fire advance milestone on start (default: `true`) |
| `mintAddress` | `string?` | SPL mint override (defaults to USDC) |

Returns: `{ vaultAddress: string; campaignId: number; signatures: string[] }`

### `gecko.vault`

```typescript
// Read vault state
const state = await gecko.vault.get(vaultAddress)

// Build and sign initAndDeposit
const { signature, vaultAddress } = await gecko.vault.initAndDeposit({ ... })

// Add creators in batch (auto-chunks at 5 per tx)
const { signatures } = await gecko.vault.addCreators({ vaultAddress, creators, ... })
```

### `gecko.creator`

```typescript
const earnings = await gecko.creator.getEarnings(creatorWallet)
const reputation = await gecko.creator.getReputation(creatorWallet)
```

### `gecko.milestone`

```typescript
const milestones = await gecko.milestone.list(vaultAddress)
```

---

## Architecture

```
Your Node.js backend
        │
        │ new GeckoSDK({ apiKey, signer, ... })
        ▼
┌────────────────────────────────────┐
│           GeckoSDK                 │
│  vault     VaultClient             │
│  creator   CreatorClient           │
│  milestone MilestoneClient         │
└──────────┬─────────────────────────┘
           │
    ┌──────┴──────────────┐
    ▼                     ▼
HttpClient           TransactionSender
(Gecko API)          (Solana RPC)
    │                     │
    │ POST /vaults/*       │ sign(Keypair) → sendRawTransaction
    │ ← { tx: base64 } ──►│
    ▼                     ▼
Gecko API :3001      Solana Mainnet/Devnet
```

**The brand's private key never leaves your server.** The Gecko API only builds unsigned transactions.

---

## Batch creator limits

Solana legacy transactions are capped at 1,232 bytes. The SDK automatically chunks arrays larger than 5 into sequential transactions:

```typescript
// 8 creators → 2 txs: [5] then [3]
const { signatures } = await gecko.vault.addCreators({
  vaultAddress,
  creators: eightCreators,
})
// signatures.length === 2
```

---

## Solo vs squad campaigns

| Type | Creators | `allocationBps` |
|------|----------|-----------------|
| Solo | 1 | `10000` (100%) |
| Squad | 2–10 | Must sum to `10000` |

---

## Repository layout

```
gecko-creator-sdk/
├── src/
│   ├── GeckoSDK.ts           # Main entry point
│   ├── index.ts              # Public exports
│   ├── clients/
│   │   ├── VaultClient.ts    # initAndDeposit, addCreators, get
│   │   ├── CreatorClient.ts  # getEarnings, getReputation
│   │   └── MilestoneClient.ts
│   ├── core/
│   │   ├── HttpClient.ts     # Typed fetch + buildTx
│   │   └── TransactionSender.ts
│   ├── types/index.ts
│   └── __tests__/GeckoSDK.test.ts
└── dist/                     # Compiled output (gitignored)
```

---

## Running tests

```bash
npm test
```

Tests mock all network calls — no RPC or API key required.

---

## Program ID (devnet)

```
Eeyc1AXnQxmbMoKhJRz8g6soBpCkjwfi79DrhWwNeSh3
```

[Explorer (devnet)](https://explorer.solana.com/address/Eeyc1AXnQxmbMoKhJRz8g6soBpCkjwfi79DrhWwNeSh3?cluster=devnet)

---

## Related repositories

| Repo | Description |
|------|-------------|
| [`gecko-social-fi-creators-app`](https://github.com/ernanibmurtinho/gecko-social-fi-creators-app) | Next.js frontend — sponsor + creator dashboards |
| [`gecko-social-fi-creators-api`](https://github.com/ernanibmurtinho/gecko-social-fi-creators-api) | Express API — transaction builders, yield automation |
| [`gecko-social-fi-creators-contracts`](https://github.com/ernanibmurtinho/gecko-social-fi-creators-contracts) | Anchor program — gecko-vault |
| [`gecko-social-fi-creators-landing`](https://github.com/ernanibmurtinho/gecko-social-fi-creators-landing) | Landing page — geckovision.tech |

---

## License

ISC — see [LICENSE](LICENSE).

---

*Gecko — enforcement-first creator campaigns on Solana · @gecko/sdk · v0.2.0*
