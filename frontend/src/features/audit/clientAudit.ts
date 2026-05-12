export type ClientAuditAction = 'import.opened' | 'export.opened';

export interface ClientAuditEvent {
  id: string;
  action: ClientAuditAction;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}

const auditStorageKey = 'passwdman2.clientAuditEvents';
const sensitiveKeyParts = ['password', 'secret', 'token', 'key', 'cipher', 'encrypted', 'recovery'];

export function sanitizeClientAuditMetadata(metadata: Record<string, unknown> = {}) {
  return Object.entries(metadata).reduce<Record<string, string | number | boolean | null>>((safeMetadata, [key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/-/g, '_');
    if (sensitiveKeyParts.some((part) => normalizedKey.includes(part))) {
      return safeMetadata;
    }
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      safeMetadata[normalizedKey] = value as string | number | boolean | null;
    }
    return safeMetadata;
  }, {});
}

export function recordClientAuditEvent(action: ClientAuditAction, metadata: Record<string, unknown> = {}) {
  const currentEvents = JSON.parse(localStorage.getItem(auditStorageKey) ?? '[]') as ClientAuditEvent[];
  const event: ClientAuditEvent = {
    id: crypto.randomUUID(),
    action,
    metadata: sanitizeClientAuditMetadata(metadata),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(auditStorageKey, JSON.stringify([event, ...currentEvents].slice(0, 100)));
  return event;
}
