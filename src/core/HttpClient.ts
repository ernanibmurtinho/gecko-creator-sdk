import { SerializedTransaction } from "../types/index";

/**
 * Authenticated HTTP client for the Gecko API.
 * Attaches x-api-key header to all requests.
 */
export class HttpClient {
  constructor(
    private readonly apiBase: string,
    private readonly apiKey: string
  ) {}

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(
        (err as { error?: string }).error ?? `HTTP ${res.status} on POST ${path}`
      );
    }

    return res.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      headers: { "x-api-key": this.apiKey },
    });

    if (!res.ok) {
      if (res.status === 404) return null as T;
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(
        (err as { error?: string }).error ?? `HTTP ${res.status} on GET ${path}`
      );
    }

    return res.json() as Promise<T>;
  }

  /** Build a tx and return the unsigned SerializedTransaction from the API */
  async buildTx(path: string, body: unknown): Promise<SerializedTransaction> {
    return this.post<SerializedTransaction>(path, body);
  }
}
