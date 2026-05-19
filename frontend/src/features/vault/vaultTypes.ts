export interface VaultRecord {
  encryptedData: string;
  encryptedVaultKey: string;
  id: string;
  name: string;
  revision: number;
  updatedAt: string;
}

export interface VaultSyncPayload {
  encryptedData: string;
  encryptedVaultKey?: string;
}

export interface VaultKeyState {
  error: string | null;
  encryptedVaultKey: string | null;
  status: 'locked' | 'unlocked';
  vaultKey: Uint8Array | null;
}

