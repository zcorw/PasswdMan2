import { apiRequest } from '../../lib/apiClient';
import { encryptedPost } from '../../lib/encryptedApiClient';
import type {
  AuthSessionResult,
  LoginCredentials,
  LogoutResult,
  RegisterCredentials,
  RegisterResult,
} from './authTypes';

export function login(credentials: LoginCredentials): Promise<AuthSessionResult> {
  return encryptedPost<AuthSessionResult>('/api/auth/login', credentials);
}

export function register(credentials: RegisterCredentials): Promise<RegisterResult> {
  return encryptedPost<RegisterResult>('/api/auth/register', credentials);
}

export function logout(): Promise<LogoutResult> {
  return apiRequest<LogoutResult>('/api/auth/logout', { method: 'POST' });
}

export function currentSession(): Promise<AuthSessionResult> {
  return apiRequest<AuthSessionResult>('/api/auth/session');
}

