import type { SecondaryPassword } from '../../types/vault';

export interface ImportedVaultItem {
  primaryPassword: string;
  secondaryPasswords: SecondaryPassword[];
  title: string;
  url?: string;
  username?: string;
}

export interface ImportedVaultFile {
  items: ImportedVaultItem[];
}

const MAX_IMPORT_ITEMS = 100;

export function parseImportedVaultFile(rawJson: string): ImportedVaultFile {
  const parsed = JSON.parse(rawJson) as unknown;
  return validateImportedVaultFile(parsed);
}

export function validateImportedVaultFile(value: unknown): ImportedVaultFile {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { items?: unknown }).items)) {
    throw new Error('Import file must contain an items array.');
  }

  const items = (value as { items: unknown[] }).items;
  if (items.length > MAX_IMPORT_ITEMS) {
    throw new Error(`Import file must contain ${MAX_IMPORT_ITEMS} or fewer items.`);
  }

  return {
    items: items.map(validateImportedVaultItem),
  };
}

function validateImportedVaultItem(value: unknown, index: number): ImportedVaultItem {
  if (!value || typeof value !== 'object') {
    throw new Error(`Item ${index + 1} must be an object.`);
  }

  const item = value as Partial<ImportedVaultItem>;
  if (!isNonEmptyString(item.title) || item.title.length > 120) {
    throw new Error(`Item ${index + 1} needs a title of 120 characters or fewer.`);
  }
  if (!isNonEmptyString(item.primaryPassword)) {
    throw new Error(`Item ${index + 1} needs a primary password.`);
  }
  if (item.url !== undefined && typeof item.url !== 'string') {
    throw new Error(`Item ${index + 1} URL must be text.`);
  }
  if (item.username !== undefined && typeof item.username !== 'string') {
    throw new Error(`Item ${index + 1} username must be text.`);
  }

  const secondaryPasswords = Array.isArray(item.secondaryPasswords) ? item.secondaryPasswords : [];
  if (secondaryPasswords.length > 20) {
    throw new Error(`Item ${index + 1} has too many secondary passwords.`);
  }

  return {
    primaryPassword: item.primaryPassword,
    secondaryPasswords: secondaryPasswords.map((password, secondaryIndex) =>
      validateSecondaryPassword(password, index, secondaryIndex),
    ),
    title: item.title.trim(),
    url: item.url?.trim(),
    username: item.username?.trim(),
  };
}

function validateSecondaryPassword(value: unknown, itemIndex: number, secondaryIndex: number): SecondaryPassword {
  if (!value || typeof value !== 'object') {
    throw new Error(`Secondary password ${secondaryIndex + 1} in item ${itemIndex + 1} must be an object.`);
  }

  const password = value as Partial<SecondaryPassword>;
  if (!isNonEmptyString(password.note) || password.note.length > 120) {
    throw new Error(`Secondary password ${secondaryIndex + 1} in item ${itemIndex + 1} needs a note.`);
  }
  if (!isNonEmptyString(password.value)) {
    throw new Error(`Secondary password ${secondaryIndex + 1} in item ${itemIndex + 1} needs a value.`);
  }

  return {
    id: isNonEmptyString(password.id) ? password.id : `imported-secondary-${itemIndex + 1}-${secondaryIndex + 1}`,
    note: password.note,
    sortOrder: typeof password.sortOrder === 'number' ? password.sortOrder : secondaryIndex,
    value: password.value,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

