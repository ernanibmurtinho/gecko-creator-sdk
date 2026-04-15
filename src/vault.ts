import type { GeckoConfig, VaultParams } from "./types"

export async function createVault(
  params: VaultParams,
  config: GeckoConfig,
): Promise<{ transaction: string; campaignId: string }> {
  const res = await fetch(`${config.apiBase}/vault/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gecko-Partner": config.partnerSlug,
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json() as { error: string }
    throw new Error(err.error ?? "Failed to build vault transaction")
  }
  return res.json() as Promise<{ transaction: string; campaignId: string }>
}
