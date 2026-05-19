import { describe, expect, it } from 'vitest';

import { createExportFilename, createExportFile } from './exportVault';

describe('exportVault', () => {
  it('creates an encrypted item export file without decrypted password fields', () => {
    const exportFile = createExportFile(
      [
        {
          createdAt: '2026-05-18T09:00:00Z',
          encryptedSecret: 'encrypted-secret',
          favorite: false,
          id: 'item-id',
          status: 'active',
          title: 'GitHub',
          updatedAt: '2026-05-18T09:00:00Z',
          url: 'https://github.com',
          username: 'pack.william',
        },
      ],
      '2026-05-18T09:00:00Z',
    );

    expect(exportFile).toEqual({
      exportedAt: '2026-05-18T09:00:00Z',
      format: 'passwdman2-encrypted-items',
      items: [
        {
          createdAt: '2026-05-18T09:00:00Z',
          encryptedSecret: 'encrypted-secret',
          favorite: false,
          id: 'item-id',
          status: 'active',
          title: 'GitHub',
          updatedAt: '2026-05-18T09:00:00Z',
          url: 'https://github.com',
          username: 'pack.william',
        },
      ],
      version: 1,
    });
    expect(JSON.stringify(exportFile)).not.toContain('primaryPassword');
  });

  it('creates a stable export filename for the export date', () => {
    expect(createExportFilename('2026-05-18T09:00:00Z')).toBe('passwdman2-export-2026-05-18.json');
  });
});

