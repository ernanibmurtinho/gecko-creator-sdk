import { HttpClient } from "../HttpClient";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("HttpClient", () => {
  const client = new HttpClient("https://api.geckovision.tech", "test-key");

  beforeEach(() => mockFetch.mockReset());

  it("attaches x-api-key header on POST", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: "ok" }),
    });

    await client.post("/test", { foo: "bar" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.geckovision.tech/test",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
      })
    );
  });

  it("throws with API error message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid params" }),
    });

    await expect(client.post("/test", {})).rejects.toThrow("Invalid params");
  });

  it("returns null on GET 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await client.get("/nonexistent");
    expect(result).toBeNull();
  });
});
