import { describe, expect, it } from 'vitest';

import { hasItemFormErrors, validateItemForm } from './itemValidation';

describe('itemValidation', () => {
  it('requires a title and main password', () => {
    const errors = validateItemForm({
      primaryPassword: '',
      secondaryPasswords: [],
      title: '',
      url: '',
      username: '',
    });

    expect(errors).toEqual({
      primaryPassword: 'Main password is required.',
      title: 'Title is required.',
    });
    expect(hasItemFormErrors(errors)).toBe(true);
  });

  it('validates field length limits and secondary password rows', () => {
    const errors = validateItemForm({
      primaryPassword: 'secret',
      secondaryPasswords: [{ id: 'secondary-1', note: '', sortOrder: 0, value: '' }],
      title: 'x'.repeat(121),
      url: 'x'.repeat(2049),
      username: 'x'.repeat(321),
    });

    expect(errors).toEqual({
      secondaryPasswords: 'Each secondary password needs a note, value, and note length of 120 or fewer.',
      title: 'Title must be 120 characters or fewer.',
      url: 'URL must be 2048 characters or fewer.',
      username: 'Username must be 320 characters or fewer.',
    });
  });

  it('accepts valid item form values', () => {
    const errors = validateItemForm({
      primaryPassword: 'primary-secret',
      secondaryPasswords: [{ id: 'secondary-1', note: 'Recovery', sortOrder: 0, value: 'secondary-secret' }],
      title: 'GitHub',
      url: 'https://github.com',
      username: 'pack.william',
    });

    expect(errors).toEqual({});
    expect(hasItemFormErrors(errors)).toBe(false);
  });
});

