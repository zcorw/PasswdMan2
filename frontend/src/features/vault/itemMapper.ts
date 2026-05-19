import { decryptItemSecret, type PasswordItemSecret } from '../../lib/vaultCrypto';
import type { VaultItem } from '../../types/vault';
import type { PasswordItemApi } from './itemsApi';

export class VaultItemDecryptError extends Error {
  constructor(message = 'Vault Key is required to decrypt item secrets') {
    super(message);
    this.name = 'VaultItemDecryptError';
  }
}

export function mapApiItemToVaultItem(item: PasswordItemApi, vaultKey: Uint8Array): VaultItem {
  const secret = decryptItemSecret<PasswordItemSecret>(vaultKey, item.encryptedSecret);

  return {
    category: 'vault',
    id: item.id,
    primaryPassword: secret.primaryPassword,
    secondaryPasswords: secret.secondaryPasswords.map((password) => ({
      id: password.id,
      note: password.note,
      sortOrder: password.sortOrder,
      value: password.password,
    })),
    title: item.title,
    updatedAt: formatUpdatedAt(item.updatedAt),
    url: item.url ?? '',
    username: item.username ?? '',
  };
}

export function mapApiItemsToVaultItems(items: PasswordItemApi[], vaultKey: Uint8Array | null): VaultItem[] {
  if (!vaultKey) {
    throw new VaultItemDecryptError();
  }

  return items.map((item) => mapApiItemToVaultItem(item, vaultKey));
}

function formatUpdatedAt(value: string): string {
  return `Saved ${new Date(value).toLocaleDateString()}`;
}

