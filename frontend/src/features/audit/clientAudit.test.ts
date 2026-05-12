import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { recordClientAuditEvent, sanitizeClientAuditMetadata } from './clientAudit';

describe('client audit events', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    });
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'audit-event-id'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sanitizes sensitive metadata before recording', () => {
    expect(
      sanitizeClientAuditMetadata({
        screen: 'settings',
        password: 'plain-password',
        encryptedSecret: 'ciphertext',
        token: 'session-token',
      }),
    ).toEqual({ screen: 'settings' });
  });

  it('records import and export entry events without sensitive metadata', () => {
    const event = recordClientAuditEvent('export.opened', {
      screen: 'vault',
      vaultKey: 'secret-key',
    });

    expect(event).toEqual({
      id: 'audit-event-id',
      action: 'export.opened',
      metadata: { screen: 'vault' },
      createdAt: expect.any(String),
    });
    expect(localStorage.setItem).toHaveBeenCalledOnce();
  });
});
