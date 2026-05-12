export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  createdAt: string;
  metadata: Record<string, string>;
}

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    action: 'password.secondary.copied',
    resourceType: 'password_item',
    createdAt: 'Just now',
    metadata: { item: 'GitHub' },
  },
  {
    id: 'audit-2',
    action: 'item.updated',
    resourceType: 'password_item',
    createdAt: '8 min ago',
    metadata: { item: 'GitHub' },
  },
  {
    id: 'audit-3',
    action: 'auth.login',
    resourceType: 'session',
    createdAt: '24 min ago',
    metadata: { device: 'Mobile PWA' },
  },
];
