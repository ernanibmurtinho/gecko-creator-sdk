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
    let message = "Failed to build vault transaction"
    try {
      const err = await res.json() as { error?: string }
      if (err.error) message = err.error
    } catch {
      // non-JSON body (gateway error, etc.) — keep default message
    }
    throw new Error(message)
  }
  return res.json() as Promise<{ transaction: string; campaignId: string }>
}
