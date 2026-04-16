import { MilestoneClient } from "../MilestoneClient";
import { HttpClient } from "../../core/HttpClient";

jest.mock("../../core/HttpClient");
const MockHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("MilestoneClient", () => {
  let client: MilestoneClient;
  let mockHttp: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttp = new MockHttpClient("", "") as jest.Mocked<HttpClient>;
    client = new MilestoneClient(mockHttp);
  });

  it("triggerAutomation calls the automation endpoint and returns sigs", async () => {
    mockHttp.post.mockResolvedValueOnce({
      success: true,
      createSig: "createSig123",
      releaseSig: "releaseSig456",
    });

    const result = await client.triggerAutomation({
      vaultAddress: "vault111",
      sponsorAddress: "sponsor111",
      campaignId: 123,
      creatorAddress: "creator111",
      payoutBps: 1000,
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      "/milestones/vault111/automation",
      expect.objectContaining({ payoutBps: 1000 })
    );
    expect(result.createSig).toBe("createSig123");
    expect(result.releaseSig).toBe("releaseSig456");
  });
});
