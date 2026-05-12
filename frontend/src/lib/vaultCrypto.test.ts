import { describe, expect, it, vi } from 'vitest';

import {
  decryptItemSecret,
  decryptVaultKey,
  encryptItemSecret,
  encryptVaultKey,
  generateVaultKey,
  type PasswordItemSecret,
} from './vaultCrypto';

describe('vaultCrypto', () => {
  it('roundtrips an encrypted Vault Key with the master password', async () => {
    const vaultKey = generateVaultKey();
    const encryptedVaultKey = await encryptVaultKey('main password value', vaultKey);

    const decryptedVaultKey = await decryptVaultKey('main password value', encryptedVaultKey);

    expect(Array.from(decryptedVaultKey)).toEqual(Array.from(vaultKey));
    expect(encryptedVaultKey).not.toContain('main password value');
  });

  it('rejects an incorrect master password', async () => {
    const vaultKey = generateVaultKey();
    const encryptedVaultKey = await encryptVaultKey('main password value', vaultKey);

    await expect(decryptVaultKey('wrong password value', encryptedVaultKey)).rejects.toThrow();
  });

  it('roundtrips password item secret JSON with secondary passwords', () => {
    const vaultKey = generateVaultKey();
    const secret: PasswordItemSecret = {
      primaryPassword: 'primary-secret',
      secondaryPasswords: [
        {
          id: 'local-secondary-1',
          password: 'secondary-secret',
          note: 'payment password',
          sortOrder: 1,
        },
      ],
      secureNote: 'encrypted note',
    };

    const encryptedSecret = encryptItemSecret(vaultKey, secret);
    const decryptedSecret = decryptItemSecret(vaultKey, encryptedSecret);

    expect(decryptedSecret).toEqual(secret);
    expect(encryptedSecret).not.toContain('primary-secret');
    expect(encryptedSecret).not.toContain('secondary-secret');
    expect(encryptedSecret).not.toContain('payment password');
  });

  it('does not write key material to localStorage', async () => {
    const setItemSpy = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      removeItem: vi.fn(),
      setItem: setItemSpy,
    });

    const vaultKey = generateVaultKey();
    const encryptedVaultKey = await encryptVaultKey('main password value', vaultKey);
    encryptItemSecret(vaultKey, { primaryPassword: 'secret', secondaryPasswords: [] });

    expect(encryptedVaultKey).toBeTruthy();
    expect(setItemSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
