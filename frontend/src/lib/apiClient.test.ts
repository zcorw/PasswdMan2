import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest, ApiClientError, isUnauthorizedApiError } from './apiClient';

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns data from a successful response envelope and includes credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        data: { status: 'ok' },
        error: null,
        requestId: 'req_success',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiRequest<{ status: string }>('/api/health');

    expect(data).toEqual({ status: 'ok' });
    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/health');
    expect(request.credentials).toBe('include');
  });

  it('serializes object bodies as JSON and sets the content type header', async () => {
    let requestBody = '';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestBody = await getRequestBody(input);
      return jsonResponse(200, {
        data: { id: 'item-id' },
        error: null,
        requestId: 'req_post',
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/api/items', {
      body: { title: 'GitHub' },
      method: 'POST',
    });

    const request = getFetchRequest(fetchMock);
    expect(requestBody).toBe(JSON.stringify({ title: 'GitHub' }));
    expect(request.headers.get('Content-Type')).toBe('application/json');
  });

  it('throws structured errors from an error response envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          data: null,
          error: { code: 'UNAUTHENTICATED', message: 'login required' },
          requestId: 'req_unauthorized',
        }),
      ),
    );

    await expect(apiRequest('/api/vault')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      message: 'login required',
      requestId: 'req_unauthorized',
      status: 401,
    });

    try {
      await apiRequest('/api/vault');
    } catch (error) {
      expect(isUnauthorizedApiError(error)).toBe(true);
      expect(error).toBeInstanceOf(ApiClientError);
    }
  });

  it('throws an invalid JSON error when the response is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('not-json', {
          headers: { 'Content-Type': 'text/plain' },
          status: 502,
        }),
      ),
    );

    await expect(apiRequest('/api/broken')).rejects.toMatchObject({
      code: 'INVALID_JSON',
      status: 502,
    });
  });

  it('throws an invalid envelope error when required envelope fields are missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { status: 'ok' })));

    await expect(apiRequest('/api/invalid-envelope')).rejects.toMatchObject({
      code: 'INVALID_ENVELOPE',
      status: 200,
    });
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

function getFetchRequest(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Request {
  const [input, init] = fetchMock.mock.calls[callIndex] as [RequestInfo | URL, RequestInit | undefined];
  return input instanceof Request ? input : new Request(input, init);
}

async function getRequestBody(input: RequestInfo | URL): Promise<string> {
  return input instanceof Request ? input.clone().text() : '';
}
