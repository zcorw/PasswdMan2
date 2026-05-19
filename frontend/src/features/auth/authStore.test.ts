import { describe, expect, it } from 'vitest';

import { authReducer } from './authStore';
import type { AuthState } from './authTypes';

const unauthenticatedState: AuthState = {
  error: null,
  session: null,
  status: 'unauthenticated',
  user: null,
};

describe('authStore', () => {
  it('stores authenticated session state', () => {
    const nextState = authReducer(unauthenticatedState, {
      result: {
        session: { expiresAt: '2026-05-18T10:00:00Z', id: 'session-id' },
        user: { createdAt: '2026-05-18T09:00:00Z', email: 'alice@example.com', id: 'user-id', status: 'active' },
      },
      type: 'auth-success',
    });

    expect(nextState).toEqual({
      error: null,
      session: { expiresAt: '2026-05-18T10:00:00Z', id: 'session-id' },
      status: 'authenticated',
      user: { createdAt: '2026-05-18T09:00:00Z', email: 'alice@example.com', id: 'user-id', status: 'active' },
    });
  });

  it('clears session state when unauthenticated', () => {
    const nextState = authReducer(
      {
        error: null,
        session: { expiresAt: '2026-05-18T10:00:00Z', id: 'session-id' },
        status: 'authenticated',
        user: { createdAt: '2026-05-18T09:00:00Z', email: 'alice@example.com', id: 'user-id', status: 'active' },
      },
      { type: 'unauthenticated' },
    );

    expect(nextState).toEqual(unauthenticatedState);
  });

  it('stores auth errors as unauthenticated state', () => {
    const nextState = authReducer(unauthenticatedState, {
      error: 'login required',
      type: 'auth-error',
    });

    expect(nextState).toEqual({
      error: 'login required',
      session: null,
      status: 'unauthenticated',
      user: null,
    });
  });
});

