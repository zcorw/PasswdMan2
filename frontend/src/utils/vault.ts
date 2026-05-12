import type { VaultItem } from '../types/vault';

export function maskSecret(value: string) {
  return value.replace(/./g, '\u2022');
}

export function getVaultItem(items: VaultItem[], itemId: string | undefined) {
  return items.find((item) => item.id === itemId) ?? items[0];
}

export function normalizeExternalUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
