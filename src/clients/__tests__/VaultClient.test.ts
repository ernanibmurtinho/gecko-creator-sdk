import { VaultClient } from "../VaultClient";
import { HttpClient } from "../../core/HttpClient";
import { TransactionSender } from "../../core/TransactionSender";

jest.mock("../../core/HttpClient");
jest.mock("../../core/TransactionSender");

const MockHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;
const MockSender = TransactionSender as jest.MockedClass<typeof TransactionSender>;

describe("VaultClient", () => {
  let client: VaultClient;
  let mockHttp: jest.Mocked<HttpClient>;
  let mockSender: jest.Mocked<TransactionSender>;

  beforeEach(() => {
    mockHttp = new MockHttpClient("", "") as jest.Mocked<HttpClient>;
    mockSender = new MockSender({ signer: {} as any }) as jest.Mocked<TransactionSender>;
    client = new VaultClient(mockHttp, mockSender);
  });

  it("initAndDeposit calls /vaults/init-and-deposit and returns signature", async () => {
    mockHttp.buildTx.mockResolvedValueOnce({ transaction: "base64tx", meta: { vault: "abc", campaignId: "123" } });
    mockSender.send.mockResolvedValueOnce("sig123");

    const result = await client.initAndDeposit({
      sponsorAddress: "Hxv5FUM5gFGWBzMnhbqs7rTd7XEaFBYbBuT7mFNuP9cB",
      campaignId: 123,
      cliffDays: 30,
      endDays: 90,
      amount: 5_000_000_000,
    });

    expect(mockHttp.buildTx).toHaveBeenCalledWith("/vaults/init-and-deposit", expect.objectContaining({ campaignId: 123 }));
    expect(result.signature).toBe("sig123");
    expect(result.vaultAddress).toBe("abc");
  });

  it("addCreator calls /vaults/creators/add and returns signature", async () => {
    mockHttp.buildTx.mockResolvedValueOnce({ transaction: "base64tx", meta: {} });
    mockSender.send.mockResolvedValueOnce("sig456");

    const result = await client.addCreator({
      sponsorAddress: "Hxv5FUM5gFGWBzMnhbqs7rTd7XEaFBYbBuT7mFNuP9cB",
      campaignId: 123,
      creatorAddress: "Creator11111111111111111111111111111111111",
      allocationBps: 10000,
    });

    expect(result.signature).toBe("sig456");
  });

  it("addCreators calls /vaults/:id/creators/batch and returns signatures", async () => {
    mockHttp.buildTx.mockResolvedValueOnce({ transaction: "base64tx", meta: { vault: "abc", creatorCount: "2" } });
    mockSender.send.mockResolvedValueOnce("batchSig");

    const result = await client.addCreators({
      vaultAddress: "abc",
      sponsorAddress: "Hxv5FUM5gFGWBzMnhbqs7rTd7XEaFBYbBuT7mFNuP9cB",
      campaignId: 123,
      creators: [
        { address: "Creator1111111111111111111111111111111111111", allocationBps: 5000 },
        { address: "Creator2222222222222222222222222222222222222", allocationBps: 5000 },
      ],
    });

    expect(mockHttp.buildTx).toHaveBeenCalledWith(
      "/vaults/abc/creators/batch",
      expect.objectContaining({
        creators: expect.arrayContaining([expect.objectContaining({ allocationBps: 5000 })]),
      }),
    );
    expect(result.signatures).toContain("batchSig");
  });
});
