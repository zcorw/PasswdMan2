import { describe, expect, it } from 'vitest';

import { vaultKeyReducer } from './vaultKeyStore';
import type { VaultKeyState } from './vaultTypes';

const lockedState: VaultKeyState = {
  encryptedVaultKey: null,
  error: null,
  status: 'locked',
  vaultKey: null,
};

describe('vaultKeyStore', () => {
  it('stores an unlocked in-memory Vault Key', () => {
    const vaultKey = new Uint8Array(32);

    expect(
      vaultKeyReducer(lockedState, {
        encryptedVaultKey: 'encrypted-vault-key',
        type: 'unlocked',
        vaultKey,
      }),
    ).toEqual({
      encryptedVaultKey: 'encrypted-vault-key',
      error: null,
      status: 'unlocked',
      vaultKey,
    });
  });

  it('clears Vault Key material from state', () => {
    const nextState = vaultKeyReducer(
      {
        encryptedVaultKey: 'encrypted-vault-key',
        error: null,
        status: 'unlocked',
        vaultKey: new Uint8Array(32),
      },
      { type: 'clear' },
    );

    expect(nextState).toEqual(lockedState);
  });

  it('stores errors without retaining Vault Key material', () => {
    const nextState = vaultKeyReducer(
      {
        encryptedVaultKey: 'encrypted-vault-key',
        error: null,
        status: 'unlocked',
        vaultKey: new Uint8Array(32),
      },
      { error: 'decrypt failed', type: 'error' },
    );

    expect(nextState).toEqual({
      encryptedVaultKey: null,
      error: 'decrypt failed',
      status: 'locked',
      vaultKey: null,
    });
  });
});

