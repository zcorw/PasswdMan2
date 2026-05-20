import { describe, expect, it } from 'vitest';

import { generateVaultKey, encryptItemSecret } from '../../lib/vaultCrypto';
import { createCsvExport, createExportFilename, createExportFile } from './exportVault';

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
    expect(createExportFilename('2026-05-18T09:00:00Z')).toBe('passwdman2-export-2026-05-18.csv');
  });

  it('creates a CSV export that preserves the template fields and adds PasswdMan2 fields', () => {
    const vaultKey = generateVaultKey();
    const encryptedSecret = encryptItemSecret(vaultKey, {
      customFields: [{ label: 'Email', value: 'pack@example.com' }],
      primaryPassword: 'primary-secret',
      secondaryPasswords: [{ id: 'secondary-id', note: 'Recovery', password: 'secondary-secret', sortOrder: 0 }],
      secureNote: 'secure note',
      totpSecret: 'totp-secret',
    });

    const csv = createCsvExport(
      [
        {
          createdAt: '2026-05-18T09:00:00Z',
          encryptedSecret,
          favorite: true,
          id: 'item-id',
          status: 'archived',
          title: 'GitHub',
          updatedAt: '2026-05-18T09:00:00Z',
          url: 'https://github.com',
          username: 'pack.william',
        },
      ],
      vaultKey,
    );

    expect(csv.split('\n')[0]).toBe(
      'name,login_uri,login_username,login_password,remark,fields,folder,type,passwdman2_secondary_passwords,passwdman2_totp_secret,passwdman2_secure_note,passwdman2_custom_fields,passwdman2_favorite,passwdman2_status',
    );
    expect(csv).toContain('GitHub,https://github.com,pack.william,primary-secret,secure note');
    expect(csv).toContain('passwdman2_secondary_passwords');
    expect(csv).toContain('true,archived');
  });
});
