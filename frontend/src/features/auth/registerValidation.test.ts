import { describe, expect, it } from 'vitest';

import { hasRegisterFormErrors, validateRegisterForm } from './registerValidation';

describe('registerValidation', () => {
  it('requires all registration fields', () => {
    const errors = validateRegisterForm({ email: '', masterPassword: '', password: '' });

    expect(errors).toEqual({
      email: 'Email is required.',
      masterPassword: 'Master password is required.',
      password: 'Password is required.',
    });
    expect(hasRegisterFormErrors(errors)).toBe(true);
  });

  it('validates email, login password, and master password', () => {
    expect(validateRegisterForm({ email: 'invalid', masterPassword: '12345', password: '12345' })).toEqual({
      email: 'Enter a valid email address.',
      masterPassword: 'Master password must be 6-256 characters.',
      password: 'Password must be 6-256 characters.',
    });
  });

  it('accepts valid registration values', () => {
    const errors = validateRegisterForm({
      email: 'alice@example.com',
      masterPassword: 'main password value',
      password: 'correct horse battery staple',
    });

    expect(errors).toEqual({});
    expect(hasRegisterFormErrors(errors)).toBe(false);
  });
});
