import { apiRequest } from '../../lib/apiClient';
import { encryptedPatch, encryptedPost } from '../../lib/encryptedApiClient';

export interface PasswordItemApi {
  createdAt: string;
  encryptedSecret: string;
  favorite: boolean;
  id: string;
  status: string;
  title: string;
  updatedAt: string;
  url: string | null;
  username: string | null;
}

export interface ItemListResponse {
  items: PasswordItemApi[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface ItemResponse {
  item: PasswordItemApi;
}

export interface ItemListParams {
  favorite?: boolean;
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: 'updatedAtDesc' | 'titleAsc' | 'createdAtDesc';
  status?: 'active' | 'archived' | 'all';
}

export interface ItemSavePayload {
  encryptedSecret: string;
  favorite?: boolean;
  status?: 'active' | 'archived';
  title?: string;
  url?: string | null;
  username?: string | null;
}

export function listItems(params: ItemListParams = {}): Promise<ItemListResponse> {
  return apiRequest<ItemListResponse>(`/api/items${toQueryString(params)}`);
}

export function getItem(itemId: string): Promise<ItemResponse> {
  return apiRequest<ItemResponse>(`/api/items/${itemId}`);
}

export function createItem(payload: Required<Pick<ItemSavePayload, 'encryptedSecret' | 'title'>> & ItemSavePayload) {
  return encryptedPost<ItemResponse>('/api/items', payload);
}

export function updateItem(itemId: string, payload: ItemSavePayload): Promise<ItemResponse> {
  return encryptedPatch<ItemResponse>(`/api/items/${itemId}`, payload);
}

export function deleteItem(itemId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/api/items/${itemId}`, { method: 'DELETE' });
}

function toQueryString(params: ItemListParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

