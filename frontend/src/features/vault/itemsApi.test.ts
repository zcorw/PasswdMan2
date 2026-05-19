import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteItem, getItem, listItems } from './itemsApi';

describe('itemsApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists items with query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonEnvelope(200, { items: [], pagination: { page: 1, pageSize: 20, total: 0 } }));
    vi.stubGlobal('fetch', fetchMock);

    await listItems({ pageSize: 10, q: 'git', sort: 'titleAsc' });

    const request = getFetchRequest(fetchMock);
    expect(`${new URL(request.url).pathname}${new URL(request.url).search}`).toBe('/api/items?pageSize=10&q=git&sort=titleAsc');
    expect(request.credentials).toBe('include');
  });

  it('loads an item detail', async () => {
    const item = { id: 'item-id' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonEnvelope(200, { item })));

    await expect(getItem('item-id')).resolves.toEqual({ item });
  });

  it('deletes an item', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonEnvelope(200, { deleted: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteItem('item-id')).resolves.toEqual({ deleted: true });
    const request = getFetchRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/items/item-id');
    expect(request.method).toBe('DELETE');
  });
});

function jsonEnvelope(status: number, data: unknown): Response {
  return new Response(JSON.stringify({ data, error: null, requestId: 'req_items' }), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

function getFetchRequest(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): Request {
  const [input, init] = fetchMock.mock.calls[callIndex] as [RequestInfo | URL, RequestInit | undefined];
  return input instanceof Request ? input : new Request(input, init);
}
