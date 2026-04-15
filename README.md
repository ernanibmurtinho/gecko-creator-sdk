# @gecko/sdk

Oracle-enforced campaign settlement on Solana. Embed Gecko vaults in any platform.

## Install

```bash
npm install @gecko/sdk
```

## Headless usage

```typescript
import { createVault } from "@gecko/sdk"

const { transaction, campaignId } = await createVault({
  brandWallet: "...",
  creatorWallet: "...",
  amount: "10000000",   // 10 USDC (6 decimals)
  cliffDays: 30,
  oracleSource: "shikenso",
}, {
  apiBase: "https://app.gecko.xyz/gecko-api",
  partnerSlug: "your-platform",
})

// Sign and submit transaction with your wallet adapter
```

## Oracle sources

| Source | Description |
|--------|-------------|
| `manual` | Partner approves milestones manually via API |
| `shikenso` | Auto-score via Shikenso esports analytics |
| `custom` | POST a score to `/api/oracle/score?source=custom` |

## Webhook events

Configure your endpoint at app.gecko.xyz/partner to receive:
- `vault.created` — brand deposited, campaign started
- `milestone.released` — oracle scored delivery, payout released
- `vault.closed` — campaign ended, remaining funds returned
