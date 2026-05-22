import { describe, expect, it } from 'vitest';

import {
  VAULT_IDLE_LOCK_TIMEOUT_MS,
  getVaultIdleLockDelay,
  hasVaultIdleTimedOut,
  vaultKeyReducer,
} from './vaultKeyStore';
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

  it('uses a five minute idle lock timeout', () => {
    expect(VAULT_IDLE_LOCK_TIMEOUT_MS).toBe(5 * 60 * 1000);
  });

  it('locks immediately when vault activity is past the idle timeout', () => {
    expect(
      getVaultIdleLockDelay({
        lastActivityAt: 1_000,
        now: 1_000 + VAULT_IDLE_LOCK_TIMEOUT_MS + 1,
        timeoutMs: VAULT_IDLE_LOCK_TIMEOUT_MS,
      }),
    ).toBe(0);
  });

  it('returns the remaining delay when vault activity is still fresh', () => {
    expect(
      getVaultIdleLockDelay({
        lastActivityAt: 1_000,
        now: 1_000 + 30_000,
        timeoutMs: VAULT_IDLE_LOCK_TIMEOUT_MS,
      }),
    ).toBe(VAULT_IDLE_LOCK_TIMEOUT_MS - 30_000);
  });

  it('treats the first activity after a long pause as timed out', () => {
    expect(
      hasVaultIdleTimedOut({
        lastActivityAt: 1_000,
        now: 1_000 + VAULT_IDLE_LOCK_TIMEOUT_MS + 1,
        timeoutMs: VAULT_IDLE_LOCK_TIMEOUT_MS,
      }),
    ).toBe(true);
  });
});
