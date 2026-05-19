import { apiRequest } from '../../lib/apiClient';

export interface ActiveSessionApi {
  createdAt: string;
  expiresAt: string;
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ActiveSessionView {
  createdAt: string;
  current: boolean;
  device: string;
  expiresAt: string;
  id: string;
}

export function listSessions(): Promise<{ sessions: ActiveSessionApi[] }> {
  return apiRequest<{ sessions: ActiveSessionApi[] }>('/api/auth/sessions');
}

export function revokeSession(sessionId: string): Promise<{ revoked: boolean }> {
  return apiRequest<{ revoked: boolean }>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
}

export function mapSessionToView(session: ActiveSessionApi, currentSessionId: string | undefined): ActiveSessionView {
  return {
    createdAt: formatSessionDate(session.createdAt),
    current: session.id === currentSessionId,
    device: session.userAgent || session.ipAddress || 'Unknown device',
    expiresAt: formatSessionDate(session.expiresAt),
    id: session.id,
  };
}

function formatSessionDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

