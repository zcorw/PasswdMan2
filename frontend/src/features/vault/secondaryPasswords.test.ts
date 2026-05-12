import { describe, expect, it } from 'vitest';

import {
  addSecondaryPassword,
  deleteSecondaryPassword,
  moveSecondaryPassword,
  updateSecondaryPassword,
} from './secondaryPasswords';
import type { SecondaryPassword } from '../../types/vault';

const basePasswords: SecondaryPassword[] = [
  { id: 'one', note: 'Recovery code', value: 'first-secret', sortOrder: 0 },
  { id: 'two', note: 'Deploy token', value: 'second-secret', sortOrder: 1 },
];

describe('secondary password management', () => {
  it('adds an empty secondary password at the end', () => {
    const nextPasswords = addSecondaryPassword(basePasswords, 'three');

    expect(nextPasswords).toEqual([
      ...basePasswords,
      { id: 'three', note: '', value: '', sortOrder: 2 },
    ]);
  });

  it('generates a unique id for new secondary passwords', () => {
    const nextPasswords = addSecondaryPassword([
      { id: 'secondary-2', note: 'Existing', value: 'secret', sortOrder: 0 },
    ]);

    expect(nextPasswords[1]?.id).toBe('secondary-3');
  });

  it('updates note and value while preserving order', () => {
    const nextPasswords = updateSecondaryPassword(basePasswords, {
      id: 'two',
      note: 'Updated token',
      value: 'updated-secret',
      sortOrder: 99,
    });

    expect(nextPasswords[1]).toEqual({
      id: 'two',
      note: 'Updated token',
      value: 'updated-secret',
      sortOrder: 1,
    });
  });

  it('deletes a secondary password and compacts sortOrder', () => {
    const nextPasswords = deleteSecondaryPassword(basePasswords, 'one');

    expect(nextPasswords).toEqual([{ id: 'two', note: 'Deploy token', value: 'second-secret', sortOrder: 0 }]);
  });

  it('moves a secondary password and recalculates sortOrder', () => {
    const nextPasswords = moveSecondaryPassword(basePasswords, 'two', 'up');

    expect(nextPasswords).toEqual([
      { id: 'two', note: 'Deploy token', value: 'second-secret', sortOrder: 0 },
      { id: 'one', note: 'Recovery code', value: 'first-secret', sortOrder: 1 },
    ]);
  });
});
