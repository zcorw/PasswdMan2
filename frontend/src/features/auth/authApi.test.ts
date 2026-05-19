import { afterEach, describe, expect, it, vi } from 'vitest';

import { currentSession, login, logout, register } from './authApi';
import { clearServerPublicKeyCache } from '../../lib/encryptedApiClient';
import { TRANSPORT_ALGORITHM, type ServerPublicKey } from '../../lib/cryptoTransport';

describe('authApi', () => {
  afterEach(() => {
    clearServerPublicKeyCache();
    vi.unstubAllGlobals();
  });

  it('loads the current session with the plain API client', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonEnvelope(200, sessionResult()));
    vi.stubGlobal('fetch', fetchMock);

    await expect(currentSession()).resolves.toEqual(sessionResult());
    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/auth/session');
    expect(request.credentials).toBe('include');
  });

  it('logs out with a plain POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonEnvelope(200, { loggedOut: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(logout()).resolves.toEqual({ loggedOut: true });
    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/auth/logout');
    expect(request.method).toBe('POST');
  });

  it('sends login through the encrypted API client', async () => {
    const { fetchMock, requestBodies } = mockFetchResponses(
      jsonEnvelope(200, serverPublicKey()),
      jsonEnvelope(200, sessionResult()),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(login({ email: 'alice@example.com', password: 'correct horse battery staple' })).resolves.toEqual(
      sessionResult(),
    );

    const body = JSON.parse(requestBodies[1]);
    expect(new URL(getFetchRequest(fetchMock, 1).url).pathname).toBe('/api/auth/login');
    expect(body.algorithm).toBe(TRANSPORT_ALGORITHM);
    expect(JSON.stringify(body)).not.toContain('correct horse battery staple');
  });

  it('sends registration through the encrypted API client', async () => {
    const registerResult = {
      user: sessionResult().user,
      vault: {
        encryptedVaultKey: 'encrypted-vault-key',
        id: 'vault-id',
        name: 'Personal Vault',
        revision: 1,
      },
    };
    const { fetchMock, requestBodies } = mockFetchResponses(
      jsonEnvelope(200, serverPublicKey()),
      jsonEnvelope(201, registerResult),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      register({
        email: 'alice@example.com',
        encryptedVaultKey: 'encrypted-vault-key',
        password: 'correct horse battery staple',
      }),
    ).resolves.toEqual(registerResult);

    const body = JSON.parse(requestBodies[1]);
    expect(new URL(getFetchRequest(fetchMock, 1).url).pathname).toBe('/api/auth/register');
    expect(body.algorithm).toBe(TRANSPORT_ALGORITHM);
    expect(JSON.stringify(body)).not.toContain('encrypted-vault-key');
  });
});

function sessionResult() {
  return {
    session: {
      expiresAt: '2026-05-18T10:00:00Z',
      id: 'session-id',
    },
    user: {
      createdAt: '2026-05-18T09:00:00Z',
      email: 'alice@example.com',
      id: 'user-id',
      status: 'active',
    },
  };
}

function serverPublicKey(): ServerPublicKey {
  return {
    algorithm: TRANSPORT_ALGORITHM,
    expiresAt: '2099-01-01T00:00:00Z',
    keyId: 'server-key',
    publicKey: 'P+Ma2dw1hrVv16YlnKVT7Eq8JqD1Z1WBwqot8bl6oBw=',
  };
}

function jsonEnvelope(status: number, data: unknown, error: unknown = null): Response {
  return new Response(
    JSON.stringify({
      data,
      error,
      requestId: 'req_auth',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status,
    },
  );
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
