import { describe, expect, it } from 'vitest';

import { encryptItemSecret, generateVaultKey } from '../../lib/vaultCrypto';
import { mapApiItemToVaultItem, mapApiItemsToVaultItems, VaultItemDecryptError } from './itemMapper';
import type { PasswordItemApi } from './itemsApi';

describe('itemMapper', () => {
  it('maps and decrypts API items into UI vault items', () => {
    const vaultKey = generateVaultKey();
    const apiItem = makeApiItem({
      encryptedSecret: encryptItemSecret(vaultKey, {
        primaryPassword: 'primary-secret',
        secondaryPasswords: [
          {
            id: 'secondary-1',
            note: 'Recovery',
            password: 'secondary-secret',
            sortOrder: 0,
          },
        ],
      }),
    });

    expect(mapApiItemToVaultItem(apiItem, vaultKey)).toMatchObject({
      id: 'item-id',
      primaryPassword: 'primary-secret',
      secondaryPasswords: [
        {
          id: 'secondary-1',
          note: 'Recovery',
          sortOrder: 0,
          value: 'secondary-secret',
        },
      ],
      title: 'GitHub',
      url: 'https://github.com',
      username: 'pack.william',
    });
  });

  it('requires an unlocked Vault Key when mapping item lists', () => {
    expect(() => mapApiItemsToVaultItems([makeApiItem()], null)).toThrow(VaultItemDecryptError);
  });
});

function makeApiItem(overrides: Partial<PasswordItemApi> = {}): PasswordItemApi {
  return {
    createdAt: '2026-05-18T09:00:00Z',
    encryptedSecret: '{}',
    favorite: false,
    id: 'item-id',
    status: 'active',
    title: 'GitHub',
    updatedAt: '2026-05-18T09:00:00Z',
    url: 'https://github.com',
    username: 'pack.william',
    ...overrides,
  };
}

