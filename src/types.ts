export interface GeckoConfig {
  apiBase: string        // default: https://app.gecko.xyz/gecko-api
  partnerSlug: string
}

export interface VaultParams {
  brandWallet: string
  creatorWallet: string
  amount: string            // USDC amount as string (6 decimals)
  cliffDays: number         // minimum 1 on devnet, 30 on mainnet
  oracleSource?: string     // "manual" | "shikenso" | "custom"
  milestoneThreshold?: number // 0–100 score required to release
}

export interface VaultResult {
  vaultAddress: string
  signature: string
  campaignId: string
}

export interface GeckoVaultProps {
  partnerSlug: string
  brandWallet: string
  creatorWallet: string
  amount: number | string
  oracleSource?: string
  onSuccess?: (result: VaultResult) => void
  onError?: (error: Error) => void
  className?: string
}
