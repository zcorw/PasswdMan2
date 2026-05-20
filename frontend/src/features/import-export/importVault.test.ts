import { describe, expect, it } from 'vitest';

import { parseImportedVaultFile } from './importVault';

describe('importVault', () => {
  it('parses a valid import file', () => {
    expect(
      parseImportedVaultFile(
        JSON.stringify({
          items: [
            {
              primaryPassword: 'primary-secret',
              secondaryPasswords: [{ note: 'Recovery', value: 'secondary-secret' }],
              title: 'GitHub',
              url: 'https://github.com',
              username: 'pack.william',
            },
          ],
        }),
      ),
    ).toEqual({
      items: [
        {
          primaryPassword: 'primary-secret',
          secondaryPasswords: [
            {
              id: 'imported-secondary-1-1',
              note: 'Recovery',
              sortOrder: 0,
              value: 'secondary-secret',
            },
          ],
          title: 'GitHub',
          url: 'https://github.com',
          username: 'pack.william',
        },
      ],
    });
  });

  it('parses the CSV import template with original and PasswdMan2 fields', () => {
    expect(
      parseImportedVaultFile(
        [
          'name,login_uri,login_username,login_password,remark,fields,folder,type,passwdman2_secondary_passwords,passwdman2_totp_secret,passwdman2_secure_note,passwdman2_custom_fields,passwdman2_favorite,passwdman2_status',
          'GitHub,https://github.com,pack.william,primary-secret,old note,,dev,login,"[{""note"":""Recovery"",""password"":""secondary-secret""}]",totp-secret,secure note,"[{""label"":""Email"",""value"":""pack@example.com""}]",true,archived',
        ].join('\n'),
      ),
    ).toEqual({
      items: [
        {
          customFields: [{ label: 'Email', value: 'pack@example.com' }],
          favorite: true,
          primaryPassword: 'primary-secret',
          secureNote: 'secure note',
          secondaryPasswords: [
            {
              id: 'imported-secondary-1-1',
              note: 'Recovery',
              sortOrder: 0,
              value: 'secondary-secret',
            },
          ],
          status: 'archived',
          title: 'GitHub',
          totpSecret: 'totp-secret',
          url: 'https://github.com',
          username: 'pack.william',
        },
      ],
    });
  });

  it('ignores empty CSV template rows', () => {
    expect(
      parseImportedVaultFile(
        ['name,login_uri,login_username,login_password,remark,fields,folder,type', ',,,,,,,', ',,,,,,,'].join('\n'),
      ),
    ).toEqual({ items: [] });
  });

  it('accepts the original 8-column password-tmp CSV format', () => {
    expect(
      parseImportedVaultFile(
        [
          '\uFEFFname,login_uri,login_username,login_password,remark,fields,folder,type',
          'GitHub,https://github.com,pack.william,primary-secret,secure note,,dev,login',
          ',,,,,,,',
        ].join('\n'),
      ),
    ).toEqual({
      items: [
        {
          customFields: undefined,
          favorite: false,
          primaryPassword: 'primary-secret',
          secureNote: 'secure note',
          secondaryPasswords: [],
          status: 'active',
          title: 'GitHub',
          totpSecret: undefined,
          url: 'https://github.com',
          username: 'pack.william',
        },
      ],
    });
  });

  it('ignores non-json legacy fields values from the original 8-column CSV format', () => {
    expect(
      parseImportedVaultFile(
        [
          'name,login_uri,login_username,login_password,remark,fields,folder,type',
          'GitHub,https://github.com,pack.william,primary-secret,secure note,legacy field text,dev,login',
        ].join('\n'),
      ),
    ).toEqual({
      items: [
        {
          customFields: undefined,
          favorite: false,
          primaryPassword: 'primary-secret',
          secureNote: 'secure note',
          secondaryPasswords: [],
          status: 'active',
          title: 'GitHub',
          totpSecret: undefined,
          url: 'https://github.com',
          username: 'pack.william',
        },
      ],
    });
  });

  it('ignores legacy template rows that only contain unused folder or type values', () => {
    expect(
      parseImportedVaultFile(
        [
          'name,login_uri,login_username,login_password,remark,fields,folder,type',
          ',,,,,,folder,login',
          ',,,,,,,login',
        ].join('\n'),
      ),
    ).toEqual({ items: [] });
  });

  it('rejects files without an item array', () => {
    expect(() => parseImportedVaultFile('{}')).toThrow('Import file must contain an items array.');
  });

  it('rejects items without required sensitive fields', () => {
    expect(() => parseImportedVaultFile(JSON.stringify({ items: [{ title: 'GitHub' }] }))).toThrow(
      'Item 1 needs a primary password.',
    );
  });

  it('rejects CSV rows without required password fields', () => {
    expect(() =>
      parseImportedVaultFile('name,login_uri,login_username,login_password,remark,fields,folder,type\nGitHub,,,,,,,'),
    ).toThrow('CSV row 2 needs a login_password.');
  });
});
