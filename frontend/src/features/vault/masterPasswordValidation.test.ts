import { describe, expect, it } from 'vitest';

import { hasMasterPasswordFormErrors, validateMasterPasswordForm } from './masterPasswordValidation';

describe('masterPasswordValidation', () => {
  it('requires current and new master passwords', () => {
    const errors = validateMasterPasswordForm({
      confirmMasterPassword: '',
      currentMasterPassword: '',
      nextMasterPassword: '',
    });

    expect(errors).toEqual({
      currentMasterPassword: 'Current master password is required.',
      nextMasterPassword: 'New master password is required.',
    });
    expect(hasMasterPasswordFormErrors(errors)).toBe(true);
  });

  it('validates new master password length and confirmation', () => {
    expect(
      validateMasterPasswordForm({
        confirmMasterPassword: 'different password',
        currentMasterPassword: 'old master password',
        nextMasterPassword: '12345',
      }),
    ).toEqual({
      confirmMasterPassword: 'Master passwords do not match.',
      nextMasterPassword: 'New master password must be 6-256 characters.',
    });
  });

  it('accepts valid master password values', () => {
    const errors = validateMasterPasswordForm({
      confirmMasterPassword: 'new master password',
      currentMasterPassword: 'old master password',
      nextMasterPassword: 'new master password',
    });

    expect(errors).toEqual({});
    expect(hasMasterPasswordFormErrors(errors)).toBe(false);
  });
});
