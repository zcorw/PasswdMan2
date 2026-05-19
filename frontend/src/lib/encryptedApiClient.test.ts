import { x25519 } from '@noble/curves/ed25519';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearServerPublicKeyCache,
  encryptedPatch,
  encryptedPost,
  getServerPublicKey,
} from './encryptedApiClient';
import { TRANSPORT_ALGORITHM, type ServerPublicKey } from './cryptoTransport';

describe('encryptedApiClient', () => {
  afterEach(() => {
    clearServerPublicKeyCache();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('fetches and caches the server public key', async () => {
    const serverKey = createServerPublicKey({ expiresAt: '2099-01-01T00:00:00Z' });
    const { fetchMock } = mockFetchResponses(jsonEnvelope(200, serverKey));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getServerPublicKey()).resolves.toEqual(serverKey);
    await expect(getServerPublicKey()).resolves.toEqual(serverKey);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(new URL(getFetchRequest(fetchMock).url).pathname).toBe('/api/crypto/server-public-key');
  });

  it('encrypts POST payloads before sending them to encrypted endpoints', async () => {
    const serverKey = createServerPublicKey();
    const { fetchMock, requestBodies } = mockFetchResponses(
      jsonEnvelope(200, serverKey),
      jsonEnvelope(201, { created: true }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await encryptedPost<{ created: boolean }>('/api/auth/register', {
      email: 'alice@example.com',
      password: 'correct horse battery staple',
    });

    expect(result).toEqual({ created: true });
    const request = getFetchRequest(fetchMock, 1);
    const body = JSON.parse(requestBodies[1]);
    expect(request.method).toBe('POST');
    expect(body).toMatchObject({
      algorithm: TRANSPORT_ALGORITHM,
      keyId: serverKey.keyId,
    });
    expect(body.clientPublicKey).toEqual(expect.any(String));
    expect(body.ciphertext).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toContain('alice@example.com');
  });

  it('uses PATCH for encryptedPatch requests', async () => {
    const { fetchMock } = mockFetchResponses(
      jsonEnvelope(200, createServerPublicKey()),
      jsonEnvelope(200, { updated: true }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await encryptedPatch('/api/items/item-id', { title: 'GitHub' });

    expect(getFetchRequest(fetchMock, 1).method).toBe('PATCH');
  });

  it('refreshes an expired cached key before encrypting a request', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T00:00:00Z'));

    const expiredKey = createServerPublicKey({
      expiresAt: '2026-05-17T23:59:59Z',
      keyId: 'expired-key',
    });
    const freshKey = createServerPublicKey({
      expiresAt: '2026-05-19T00:00:00Z',
      keyId: 'fresh-key',
    });
    const { fetchMock, requestBodies } = mockFetchResponses(
      jsonEnvelope(200, expiredKey),
      jsonEnvelope(200, freshKey),
      jsonEnvelope(200, { ok: true }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getServerPublicKey();
    await encryptedPost('/api/auth/login', { email: 'alice@example.com', password: 'password value' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const body = JSON.parse(requestBodies[2]);
    expect(body.keyId).toBe('fresh-key');
  });

  it('retries once when the backend rejects an expired key id', async () => {
    const staleKey = createServerPublicKey({ keyId: 'stale-key' });
    const freshKey = createServerPublicKey({ keyId: 'fresh-key' });
    const { fetchMock, requestBodies } = mockFetchResponses(
      jsonEnvelope(200, staleKey),
      jsonEnvelope(400, null, { code: 'INVALID_KEY_ID', message: 'unknown or expired keyId' }, 'req_invalid_key'),
      jsonEnvelope(200, freshKey),
      jsonEnvelope(200, { loggedIn: true }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(encryptedPost('/api/auth/login', { email: 'alice@example.com' })).resolves.toEqual({
      loggedIn: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const retryBody = JSON.parse(requestBodies[3]);
    expect(retryBody.keyId).toBe('fresh-key');
  });
});

function createServerPublicKey(overrides: Partial<ServerPublicKey> = {}): ServerPublicKey {
  const privateKey = x25519.utils.randomPrivateKey();
  return {
    algorithm: TRANSPORT_ALGORITHM,
    expiresAt: '2099-01-01T00:00:00Z',
    keyId: 'server-key',
    publicKey: bytesToBase64(x25519.getPublicKey(privateKey)),
    ...overrides,
  };
}

function jsonEnvelope(status: number, data: unknown, error: unknown = null, requestId = 'req_test'): Response {
  return new Response(
    JSON.stringify({
      data,
      error,
      requestId,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status,
    },
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function mockFetchResponses(...responses: Response[]): {
  fetchMock: ReturnType<typeof vi.fn>;
  requestBodies: string[];
} {
  const requestBodies: string[] = [];
  const queue = [...responses];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    requestBodies.push(await getRequestBody(input));
    const response = queue.shift();
    if (!response) {
      throw new Error('No mocked response available');
    }
    return response;
  });

  return { fetchMock, requestBodies };
}

function getFetchRequest(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Request {
  const [input, init] = fetchMock.mock.calls[callIndex] as [RequestInfo | URL, RequestInit | undefined];
  return input instanceof Request ? input : new Request(input, init);
}

async function getRequestBody(input: RequestInfo | URL): Promise<string> {
  return input instanceof Request ? input.clone().text() : '';
}
