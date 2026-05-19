import { apiRequest } from '../../lib/apiClient';
import type { ClientAuditAction } from './clientAudit';

export interface AuditLogEntry {
  action: string;
  createdAt: string;
  id: string;
  ipAddress: string | null;
  metadata: Record<string, string | number | boolean | null>;
  resourceId: string | null;
  resourceType: string | null;
  userAgent: string | null;
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface AuditEventPayload {
  action: ClientAuditAction;
  metadata?: Record<string, string | number | boolean | null>;
  resourceId?: string;
  resourceType?: string;
}

export function listAuditLogs(page = 1, pageSize = 20): Promise<AuditLogListResponse> {
  return apiRequest<AuditLogListResponse>(`/api/audit/logs?page=${page}&pageSize=${pageSize}`);
}

export function recordAuditEvent(payload: AuditEventPayload): Promise<unknown> {
  return apiRequest('/api/audit/events', {
    body: payload,
    method: 'POST',
  });
}
