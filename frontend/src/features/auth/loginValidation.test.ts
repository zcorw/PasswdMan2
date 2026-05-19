import { describe, expect, it } from 'vitest';

import { hasLoginFormErrors, validateLoginForm } from './loginValidation';

describe('loginValidation', () => {
  it('requires email and password', () => {
    const errors = validateLoginForm({ email: '', password: '' });

    expect(errors).toEqual({
      email: 'Email is required.',
      password: 'Password is required.',
    });
    expect(hasLoginFormErrors(errors)).toBe(true);
  });

  it('validates email format and password length', () => {
    expect(validateLoginForm({ email: 'invalid', password: 'short' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Password must be 12-256 characters.',
    });
  });

  it('accepts valid login form values', () => {
    const errors = validateLoginForm({
      email: 'alice@example.com',
      password: 'correct horse battery staple',
    });

    expect(errors).toEqual({});
    expect(hasLoginFormErrors(errors)).toBe(false);
  });
});

