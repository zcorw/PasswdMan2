export interface AuthUser {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  expiresAt: string;
}

export interface AuthVaultSummary {
  id: string;
  name: string;
  encryptedVaultKey: string;
  revision: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  encryptedVaultKey: string;
}

export interface AuthSessionResult {
  user: AuthUser;
  session: AuthSession;
}

export interface RegisterResult {
  user: AuthUser;
  vault: AuthVaultSummary;
}

export interface LogoutResult {
  loggedOut: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  error: string | null;
  session: AuthSession | null;
  status: AuthStatus;
  user: AuthUser | null;
}

