import { decryptItemSecret, type PasswordItemSecret } from '../../lib/vaultCrypto';
import type { PasswordItemApi } from '../vault/itemsApi';

export interface ExportedVaultFile {
  exportedAt: string;
  format: 'passwdman2-encrypted-items';
  items: PasswordItemApi[];
  version: 1;
}

export function createExportFile(items: PasswordItemApi[], exportedAt = new Date().toISOString()): ExportedVaultFile {
  return {
    exportedAt,
    format: 'passwdman2-encrypted-items',
    items,
    version: 1,
  };
}

export function createExportBlob(exportFile: ExportedVaultFile): Blob {
  return new Blob([JSON.stringify(exportFile, null, 2)], { type: 'application/json' });
}

export function createExportFilename(exportedAt = new Date().toISOString()): string {
  return `passwdman2-export-${exportedAt.slice(0, 10)}.csv`;
}

export const CSV_EXPORT_HEADERS = [
  'name',
  'login_uri',
  'login_username',
  'login_password',
  'remark',
  'fields',
  'folder',
  'type',
  'passwdman2_secondary_passwords',
  'passwdman2_totp_secret',
  'passwdman2_secure_note',
  'passwdman2_custom_fields',
  'passwdman2_favorite',
  'passwdman2_status',
] as const;

export function createCsvExport(items: PasswordItemApi[], vaultKey: Uint8Array): string {
  return [
    CSV_EXPORT_HEADERS.join(','),
    ...items.map((item) => createCsvRow(item, vaultKey)),
  ].join('\n');
}

export function createCsvExportBlob(csv: string): Blob {
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

function createCsvRow(item: PasswordItemApi, vaultKey: Uint8Array): string {
  const secret = decryptItemSecret<PasswordItemSecret>(vaultKey, item.encryptedSecret);
  const secondaryPasswords = secret.secondaryPasswords.map((password) => ({
    note: password.note,
    password: password.password,
  }));

  const row: Record<(typeof CSV_EXPORT_HEADERS)[number], string> = {
    fields: toJsonField(secret.customFields),
    folder: '',
    login_password: secret.primaryPassword,
    login_uri: item.url ?? '',
    login_username: item.username ?? '',
    name: item.title,
    passwdman2_custom_fields: toJsonField(secret.customFields),
    passwdman2_favorite: String(item.favorite),
    passwdman2_secondary_passwords: toJsonField(secondaryPasswords),
    passwdman2_secure_note: secret.secureNote ?? '',
    passwdman2_status: item.status,
    passwdman2_totp_secret: secret.totpSecret ?? '',
    remark: secret.secureNote ?? '',
    type: 'login',
  };

  return CSV_EXPORT_HEADERS.map((header) => escapeCsvField(row[header])).join(',');
}

function toJsonField(value: unknown): string {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return '';
  }

  return JSON.stringify(value);
}

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
