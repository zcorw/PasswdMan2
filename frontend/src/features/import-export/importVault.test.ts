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

  it('rejects files without an item array', () => {
    expect(() => parseImportedVaultFile('{}')).toThrow('Import file must contain an items array.');
  });

  it('rejects items without required sensitive fields', () => {
    expect(() => parseImportedVaultFile(JSON.stringify({ items: [{ title: 'GitHub' }] }))).toThrow(
      'Item 1 needs a primary password.',
    );
  });
});

