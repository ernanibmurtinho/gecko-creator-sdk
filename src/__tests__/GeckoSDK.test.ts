import { GeckoSDK } from "../GeckoSDK";
import { Keypair } from "@solana/web3.js";

// Mock all clients to avoid real network calls
jest.mock("../clients/VaultClient");
jest.mock("../clients/CreatorClient");
jest.mock("../clients/MilestoneClient");
jest.mock("../core/HttpClient");
jest.mock("../core/TransactionSender");

import { VaultClient } from "../clients/VaultClient";
import { HttpClient } from "../core/HttpClient";

const MockVaultClient = VaultClient as jest.MockedClass<typeof VaultClient>;
const MockHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("GeckoSDK.createCampaign", () => {
  const keypair = Keypair.generate();
  let sdk: GeckoSDK;

  beforeEach(() => {
    sdk = new GeckoSDK({
      apiBase: "https://api.geckovision.tech",
      apiKey: "test-key",
      signer: keypair,
      network: "devnet",
    });

    // Mock vault client
    (MockVaultClient.prototype.initAndDeposit as jest.Mock).mockResolvedValue({
      signature: "initSig",
      vaultAddress: "vaultABC",
      campaignId: 123,
    });
    (MockVaultClient.prototype.addCreators as jest.Mock).mockResolvedValue({
      signatures: ["addCreatorsSig"],
    });

    // Mock http.post for set-live call
    const mockHttpInstance = (MockHttpClient as jest.MockedClass<typeof HttpClient>).mock.instances[0] as jest.Mocked<HttpClient>;
    mockHttpInstance.post.mockResolvedValue({ success: true, results: [] });
  });

  it("returns vaultAddress, campaignId, and all signatures", async () => {
    const result = await sdk.createCampaign({
      creators: [{ address: "Creator111111111111111111111111111111111", allocationBps: 10000 }],
      amount: 5_000_000_000,
      cliffDays: 1,
      endDays: 2,
      oracleSource: "shikenso",
      advancePayment: true,
    });

    expect(result.vaultAddress).toBe("vaultABC");
    expect(result.campaignId).toBe(123);
    expect(result.signatures).toContain("initSig");
    expect(result.signatures).toContain("addCreatorsSig");
  });

  it("skips advance payment when advancePayment=false", async () => {
    await sdk.createCampaign({
      creators: [{ address: "Creator111111111111111111111111111111111", allocationBps: 10000 }],
      amount: 1_000_000,
      cliffDays: 1,
      endDays: 2,
      oracleSource: "manual",
      advancePayment: false,
    });

    expect(MockVaultClient.prototype.addCreators).toHaveBeenCalled();
    // Verify set-live was NOT called
    const mockHttpInstance = (MockHttpClient as jest.MockedClass<typeof HttpClient>).mock.instances[0] as jest.Mocked<HttpClient>;
    expect(mockHttpInstance.post).not.toHaveBeenCalledWith(expect.stringContaining("set-live"), expect.anything());
  });
});
