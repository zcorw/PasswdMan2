import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { ApiClientError, isUnauthorizedApiError } from '../../lib/apiClient';
import * as authApi from './authApi';
import type {
  AuthSessionResult,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  RegisterResult,
} from './authTypes';

type AuthAction =
  | { type: 'auth-error'; error: string }
  | { type: 'auth-success'; result: AuthSessionResult }
  | { type: 'loading' }
  | { type: 'unauthenticated' };

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthSessionResult>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<RegisterResult>;
  restoreSession: () => Promise<void>;
}

const initialAuthState: AuthState = {
  error: null,
  session: null,
  status: 'loading',
  user: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'loading':
      return { ...state, error: null, status: 'loading' };
    case 'auth-success':
      return {
        error: null,
        session: action.result.session,
        status: 'authenticated',
        user: action.result.user,
      };
    case 'unauthenticated':
      return {
        error: null,
        session: null,
        status: 'unauthenticated',
        user: null,
      };
    case 'auth-error':
      return {
        error: action.error,
        session: null,
        status: 'unauthenticated',
        user: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const restoreSession = useCallback(async () => {
    dispatch({ type: 'loading' });
    try {
      const result = await authApi.currentSession();
      dispatch({ result, type: 'auth-success' });
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        dispatch({ type: 'unauthenticated' });
        return;
      }
      dispatch({ error: getAuthErrorMessage(error), type: 'auth-error' });
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'loading' });
    try {
      const result = await authApi.login(credentials);
      dispatch({ result, type: 'auth-success' });
      return result;
    } catch (error) {
      dispatch({ error: getAuthErrorMessage(error), type: 'auth-error' });
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => authApi.register(credentials), []);

  const logout = useCallback(async () => {
    await authApi.logout();
    dispatch({ type: 'unauthenticated' });
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      register,
      restoreSession,
    }),
    [login, logout, register, restoreSession, state],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Authentication request failed';
}

