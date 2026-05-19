import { afterEach, describe, expect, it, vi } from 'vitest';

import { getVault, syncVault } from './vaultApi';

describe('vaultApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the current vault', async () => {
    const vault = vaultRecord();
    const fetchMock = vi.fn().mockResolvedValue(jsonEnvelope(200, { vault }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getVault()).resolves.toEqual({ vault });
    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/vault');
    expect(request.credentials).toBe('include');
  });

  it('syncs encrypted vault data and encrypted Vault Key', async () => {
    const vault = { ...vaultRecord(), encryptedData: 'encrypted-data-v2', revision: 2 };
    let requestBody = '';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestBody = await getRequestBody(input);
      return jsonEnvelope(200, { vault });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      syncVault({
        encryptedData: 'encrypted-data-v2',
        encryptedVaultKey: 'encrypted-vault-key-v2',
      }),
    ).resolves.toEqual({ vault });

    const request = getFetchRequest(fetchMock);
    expect(request.method).toBe('PUT');
    expect(requestBody).toBe(
      JSON.stringify({
        encryptedData: 'encrypted-data-v2',
        encryptedVaultKey: 'encrypted-vault-key-v2',
      }),
    );
  });
});

function vaultRecord() {
  return {
    encryptedData: '',
    encryptedVaultKey: 'encrypted-vault-key-v1',
    id: 'vault-id',
    name: 'Personal Vault',
    revision: 1,
    updatedAt: '2026-05-18T09:00:00Z',
  };
}

function jsonEnvelope(status: number, data: unknown): Response {
  return new Response(
    JSON.stringify({
      data,
      error: null,
      requestId: 'req_vault',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status,
    },
  );
}

function getFetchRequest(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Request {
  const [input, init] = fetchMock.mock.calls[callIndex] as [RequestInfo | URL, RequestInit | undefined];
  return input instanceof Request ? input : new Request(input, init);
}

async function getRequestBody(input: RequestInfo | URL): Promise<string> {
  return input instanceof Request ? input.clone().text() : '';
}
