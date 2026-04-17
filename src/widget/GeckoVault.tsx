import * as React from "react"
import { createVault } from "../vault"
import type { GeckoConfig, GeckoVaultProps, VaultResult } from "../types"

interface State {
  amount: string
  cliffDays: number
  loading: boolean
  error: string | null
}

/**
 * GeckoVault — embeddable campaign vault creation widget.
 *
 * Usage:
 *   <GeckoVault
 *     partnerSlug="your-platform"
 *     brandWallet="BRAND_WALLET_ADDRESS"
 *     creatorWallet="CREATOR_WALLET_ADDRESS"
 *     amount="10000000"          // pre-set USDC (6 decimals), hides amount input
 *     oracleSource="shikenso"
 *     onSuccess={(result) => console.log(result.vaultAddress)}
 *     onError={(err) => console.error(err)}
 *   />
 *
 * If `amount` is provided as a prop the amount field is hidden (controlled mode).
 * If omitted, a text input is shown so the user can enter the amount.
 */
export function GeckoVault({
  partnerSlug,
  brandWallet,
  creatorWallet,
  amount: amountProp,
  oracleSource = "manual",
  onSuccess,
  onError,
  className,
}: GeckoVaultProps) {
  const [state, setState] = React.useState<State>({
    amount: amountProp ?? "",
    cliffDays: 1,
    loading: false,
    error: null,
  })

  const config: GeckoConfig = {
    apiBase: "https://app.gecko.xyz/gecko-api",
    partnerSlug,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState((s) => ({ ...s, loading: true, error: null }))

    try {
      const result = await createVault(
        {
          brandWallet,
          creatorWallet,
          amount: state.amount,
          cliffDays: state.cliffDays,
          oracleSource,
        },
        config,
      )
      // createVault returns { transaction, campaignId } — partner must sign and submit
      // We fire onSuccess with a VaultResult shape populated from what's available
      const vaultResult: VaultResult = {
        vaultAddress: "",   // not known until after signing
        signature: result.transaction,
        campaignId: result.campaignId,
      }
      onSuccess?.(vaultResult)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Vault creation failed")
      setState((s) => ({ ...s, error: error.message }))
      onError?.(error)
    } finally {
      setState((s) => ({ ...s, loading: false }))
    }
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #3f3f46",
    background: "#18181b",
    color: "#f4f4f5",
    fontSize: "14px",
    boxSizing: "border-box",
  }

  const buttonStyle: React.CSSProperties = {
    padding: "10px 16px",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#09090b",
    fontWeight: 600,
    fontSize: "14px",
    cursor: state.loading ? "not-allowed" : "pointer",
    border: "none",
    opacity: state.loading ? 0.7 : 1,
    width: "100%",
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={containerStyle}
      className={className}
    >
      {!amountProp && (
        <div>
          <label style={{ display: "block", marginBottom: "4px", color: "#a1a1aa", fontSize: "12px" }}>
            Campaign Budget (USDC, 6 decimals)
          </label>
          <input
            type="text"
            placeholder="10000000 = 10 USDC"
            value={state.amount}
            onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
            required
            pattern="^\d+$"
            title="Whole number of USDC lamports (6 decimals)"
            style={inputStyle}
          />
        </div>
      )}

      <div>
        <label style={{ display: "block", marginBottom: "4px", color: "#a1a1aa", fontSize: "12px" }}>
          Cliff (days)
        </label>
        <input
          type="number"
          min={1}
          value={state.cliffDays}
          onChange={(e) => setState((s) => ({ ...s, cliffDays: Number(e.target.value) }))}
          required
          style={inputStyle}
        />
      </div>

      {state.error && (
        <p style={{ color: "#f87171", fontSize: "12px", margin: 0 }}>{state.error}</p>
      )}

      <button type="submit" disabled={state.loading} style={buttonStyle}>
        {state.loading ? "Building transaction…" : "Create Vault"}
      </button>

      <p style={{ fontSize: "11px", color: "#52525b", margin: 0, textAlign: "center" }}>
        Powered by Gecko · Oracle-enforced campaign settlement
      </p>
    </form>
  )
}
