import { afterEach, describe, expect, it, vi } from 'vitest';

import { listAuditLogs, recordAuditEvent } from './auditApi';

describe('auditApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records sanitized client audit events through the backend', async () => {
    let requestBody = '';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestBody = await getRequestBody(input);
      return new Response(JSON.stringify({ data: { log: { id: 'log-id' } }, error: null, requestId: 'req_audit' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await recordAuditEvent({
      action: 'password.primary.copied',
      metadata: { slot: 'primary' },
      resourceId: 'item-id',
      resourceType: 'password_item',
    });

    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/audit/events');
    expect(request.method).toBe('POST');
    expect(requestBody).toBe(
      JSON.stringify({
        action: 'password.primary.copied',
        metadata: { slot: 'primary' },
        resourceId: 'item-id',
        resourceType: 'password_item',
      }),
    );
  });

  it('loads audit logs with pagination params', async () => {
    const logs = [
      {
        action: 'auth.login',
        createdAt: '2026-05-18T09:00:00Z',
        id: 'log-id',
        ipAddress: '127.0.0.1',
        metadata: {},
        resourceId: 'session-id',
        resourceType: 'session',
        userAgent: 'Mobile browser',
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { logs, pagination: { page: 2, pageSize: 10, total: 11 } },
          error: null,
          requestId: 'req_audit',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(listAuditLogs(2, 10)).resolves.toEqual({
      logs,
      pagination: { page: 2, pageSize: 10, total: 11 },
    });
    const request = getFetchRequest(fetchMock);
    expect(`${new URL(request.url).pathname}${new URL(request.url).search}`).toBe('/api/audit/logs?page=2&pageSize=10');
    expect(request.credentials).toBe('include');
  });
});

function getFetchRequest(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Request {
  const [input, init] = fetchMock.mock.calls[callIndex] as [RequestInfo | URL, RequestInit | undefined];
  return input instanceof Request ? input : new Request(input, init);
}

async function getRequestBody(input: RequestInfo | URL): Promise<string> {
  return input instanceof Request ? input.clone().text() : '';
}
