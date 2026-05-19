import { afterEach, describe, expect, it, vi } from 'vitest';

import { listSessions, mapSessionToView, revokeSession } from './sessionsApi';

describe('sessionsApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads active sessions', async () => {
    const sessions = [sessionApi()];
    const fetchMock = vi.fn().mockResolvedValue(jsonEnvelope(200, { sessions }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listSessions()).resolves.toEqual({ sessions });
    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/auth/sessions');
    expect(request.credentials).toBe('include');
  });

  it('revokes a selected session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonEnvelope(200, { revoked: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(revokeSession('session-id')).resolves.toEqual({ revoked: true });
    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/auth/sessions/session-id');
    expect(request.method).toBe('DELETE');
  });

  it('marks the current session in the view model', () => {
    expect(mapSessionToView(sessionApi(), 'session-id')).toMatchObject({
      current: true,
      device: 'Mobile browser',
      id: 'session-id',
    });
  });
});

function sessionApi() {
  return {
    createdAt: '2026-05-18T09:00:00Z',
    expiresAt: '2026-05-19T09:00:00Z',
    id: 'session-id',
    ipAddress: '127.0.0.1',
    userAgent: 'Mobile browser',
  };
}

function jsonEnvelope(status: number, data: unknown): Response {
  return new Response(JSON.stringify({ data, error: null, requestId: 'req_sessions' }), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

function getFetchRequest(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Request {
  const [input, init] = fetchMock.mock.calls[callIndex] as [RequestInfo | URL, RequestInit | undefined];
  return input instanceof Request ? input : new Request(input, init);
}
