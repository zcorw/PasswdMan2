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
  return `passwdman2-export-${exportedAt.slice(0, 10)}.json`;
}

