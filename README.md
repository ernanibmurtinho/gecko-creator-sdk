# gecko-creator-sdk

[![npm](https://img.shields.io/npm/v/gecko-creator-sdk?color=14F195)](https://www.npmjs.com/package/gecko-creator-sdk)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana)](https://explorer.solana.com/?cluster=devnet)
[![Anchor](https://img.shields.io/badge/Anchor-0.32-9945FF)](https://www.anchor-lang.com/)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)

**gecko-creator-sdk** is the TypeScript SDK for the Gecko protocol — launch a creator campaign on Solana in 10 lines of code. Brands lock campaign budgets in smart contract vaults; creators earn a guaranteed floor yield automatically. No trust required: the on-chain program enforces every rule.

---

## Quickstart

```bash
npm install gecko-creator-sdk
```

```typescript
import { GeckoClient } from "gecko-creator-sdk"

const gecko = new GeckoClient({
  rpcUrl: "https://api.devnet.solana.com",
  apiUrl: "https://api.gecko.xyz",
  wallet: yourWalletAdapter,         // any @solana/wallet-adapter compatible wallet
})

// Create a campaign and fund it atomically
const { vaultAddress } = await gecko.createCampaign({
  campaignId: Date.now(),            // unique u32 per sponsor wallet
  usdcMint: USDC_MINT,
  depositAmount: 5_000_000n,         // 5 USDC (6 decimals)
  cliffDays: 30,
  creators: [
    { wallet: "8xH...creator1", allocationBps: 6000 },
    { wallet: "3kY...creator2", allocationBps: 4000 },
  ],
})

console.log("Vault:", vaultAddress)  // funds locked, campaign live
```

---

## The problem

Creator marketing is **trust-based**: brands fear creators ghosting; creators fear brands renegotiating or ghosting pay. Deals run on email, screenshots, and PDFs — not enforceable commitment.

---

## The solution

**Lock the brand's commitment from day one.** Funds sit in an on-chain vault; early withdrawal is rejected by the program (`CliffNotElapsed`), not by policy. Creators earn yield automatically; brands cannot pull funds arbitrarily.

| Side | Before | With Gecko |
|------|--------|------------|
| Brand | Upfront risk, weak recourse | **On-chain lock** + full audit trail |
| Creator | Net-30 → net-never | **Guaranteed floor yield** from day one |

---

## API reference

### `GeckoClient`

```typescript
const gecko = new GeckoClient(config: GeckoClientConfig)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rpcUrl` | `string` | — | Solana RPC endpoint |
| `apiUrl` | `string` | — | Gecko API base URL |
| `wallet` | `WalletAdapter` | — | Signing wallet (never holds keys) |
| `programId` | `string` | devnet default | gecko-vault program ID |

---

### `gecko.createCampaign(input)`

Atomically initializes a vault and deposits funds in a single transaction (`init_and_deposit`).

```typescript
const { vaultAddress, signature } = await gecko.createCampaign({
  campaignId: number,           // unique u32 per sponsor — use Date.now() or a counter
  usdcMint: string,             // SPL USDC mint address
  depositAmount: bigint,        // lamport-equivalent (USDC has 6 decimals)
  cliffDays: number,            // minimum 30 days in production
  creators: CreatorInput[],     // array — see below
})
```

**`CreatorInput`**

```typescript
{ wallet: string, allocationBps: number }
// allocationBps values across all creators must sum to 10_000 (100%)
```

---

### `gecko.addCreators(vaultAddress, creators)`

Batch-adds up to 5 creators per transaction. Useful for building squads incrementally.

```typescript
await gecko.addCreators("vault...", [
  { wallet: "creator3...", allocationBps: 2000 },
  { wallet: "creator4...", allocationBps: 1000 },
])
```

---

### `gecko.getVault(vaultAddress)`

Returns deserialized on-chain vault state.

```typescript
const vault = await gecko.getVault(vaultAddress)
// vault.principal      — locked USDC (string, u64)
// vault.cliffTs        — Unix seconds
// vault.memberCount    — number of creators
// vault.status         — "Active" | "Closed"
```

---

### `gecko.getCreatorEarnings(creatorWallet)`

Returns earnings across all vaults the creator participates in.

```typescript
const earnings = await gecko.getCreatorEarnings("creator...")
// earnings[].vaultAddress
// earnings[].totalReceived   — string (u64, 6 decimals)
// earnings[].allocationBps
```

---

### `gecko.closeVault(vaultAddress)`

Closes a vault after the cliff period. Returns principal to sponsor (or distributes per program rules). Rejected on-chain if `now < cliffTs`.

```typescript
await gecko.closeVault(vaultAddress)
```

---

## Batch limits

| Operation | Creators per tx | Notes |
|-----------|----------------|-------|
| `createCampaign` | up to 5 | `init_and_deposit` + `addCreators` batch |
| `addCreators` | up to 5 | Each creator = one `add_creator` instruction |
| `allocation_bps` total | must equal 10,000 | Enforced by on-chain program |

---

## Architecture

The SDK is a thin layer over the Gecko API — it never constructs raw Anchor instructions itself. The API builds unsigned transactions; the SDK signs them via the provided wallet adapter and submits to Solana.

```
Your app
   │
   ▼
gecko-creator-sdk
   │ POST /vaults/init-and-deposit (etc.)
   ▼
Gecko API  ──► Builds unsigned tx
   │
   ◄── { transaction: base64 }
   │
gecko-creator-sdk  ──► wallet.signTransaction()
   │
   ▼
Solana RPC  ──► sendRawTransaction → confirmed
```

---

## Program ID (devnet)

```
Eeyc1AXnQxmbMoKhJRz8g6soBpCkjwfi79DrhWwNeSh3
```

[Explorer (devnet)](https://explorer.solana.com/address/Eeyc1AXnQxmbMoKhJRz8g6soBpCkjwfi79DrhWwNeSh3?cluster=devnet)

---

## Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5 |
| On-chain client | `@coral-xyz/anchor` 0.32, `@solana/web3.js` 1.x |
| Token standard | SPL Token (USDC / USDT) |
| Auth | Any `@solana/wallet-adapter` compatible wallet |
| Runtime | Node.js ≥ 18 / browser |

---

## License

See [LICENSE](LICENSE).

---

*Gecko — enforcement-first creator campaigns on Solana · Anchor · Helius · Privy*
