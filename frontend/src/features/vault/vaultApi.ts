import { apiRequest } from '../../lib/apiClient';
import type { VaultRecord, VaultSyncPayload } from './vaultTypes';

export function getVault(): Promise<{ vault: VaultRecord }> {
  return apiRequest<{ vault: VaultRecord }>('/api/vault');
}

export function syncVault(payload: VaultSyncPayload): Promise<{ vault: VaultRecord }> {
  return apiRequest<{ vault: VaultRecord }>('/api/vault', {
    body: payload,
    method: 'PUT',
  });
}

