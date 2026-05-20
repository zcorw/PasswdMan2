import type { SecondaryPassword } from '../../types/vault';

export interface ImportedVaultItem {
  customFields?: Array<Record<string, string>>;
  favorite?: boolean;
  primaryPassword: string;
  secureNote?: string;
  secondaryPasswords: SecondaryPassword[];
  status?: 'active' | 'archived';
  title: string;
  totpSecret?: string;
  url?: string;
  username?: string;
}

export interface ImportedVaultFile {
  items: ImportedVaultItem[];
}

const MAX_IMPORT_ITEMS = 1000;
const CSV_HEADERS = [
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

type CsvRow = Record<(typeof CSV_HEADERS)[number], string> & Record<string, string>;

export function parseImportedVaultFile(rawText: string): ImportedVaultFile {
  if (rawText.trimStart().startsWith('{')) {
    const parsed = JSON.parse(rawText) as unknown;
    return validateImportedVaultFile(parsed);
  }

  return parseImportedVaultCsv(rawText);
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

export function parseImportedVaultCsv(rawCsv: string): ImportedVaultFile {
  const rows = parseCsv(rawCsv);
  if (rows.length === 0) {
    throw new Error('Import CSV must contain a header row.');
  }

  const headers = rows[0].map((header, index) => normalizeHeader(header, index));
  for (const header of CSV_HEADERS.slice(0, 8)) {
    if (!headers.includes(header)) {
      throw new Error(`Import CSV is missing required column "${header}".`);
    }
  }

  const items = rows
    .slice(1)
    .map((row) => toCsvRow(headers, row))
    .filter(hasImportableCsvContent)
    .map(validateImportedCsvRow);

  if (items.length > MAX_IMPORT_ITEMS) {
    throw new Error(`Import file must contain ${MAX_IMPORT_ITEMS} or fewer items.`);
  }

  return { items };
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
    customFields: Array.isArray(item.customFields) ? item.customFields : undefined,
    favorite: typeof item.favorite === 'boolean' ? item.favorite : undefined,
    primaryPassword: item.primaryPassword,
    secureNote: item.secureNote,
    secondaryPasswords: secondaryPasswords.map((password, secondaryIndex) =>
      validateSecondaryPassword(password, index, secondaryIndex),
    ),
    status: item.status === 'archived' ? 'archived' : item.status === 'active' ? 'active' : undefined,
    title: item.title.trim(),
    totpSecret: item.totpSecret,
    url: item.url?.trim(),
    username: item.username?.trim(),
  };
}

function validateImportedCsvRow(row: CsvRow, index: number): ImportedVaultItem {
  const title = row.name.trim();
  const primaryPassword = row.login_password;

  if (!title || title.length > 120) {
    throw new Error(`CSV row ${index + 2} needs a name of 120 characters or fewer.`);
  }
  if (!primaryPassword) {
    throw new Error(`CSV row ${index + 2} needs a login_password.`);
  }

  const secondaryPasswords = parseSecondaryPasswords(row.passwdman2_secondary_passwords, index);
  const customFields = row.passwdman2_custom_fields.trim()
    ? parseCustomFields(row.passwdman2_custom_fields, index, 'passwdman2_custom_fields')
    : parseLegacyFields(row.fields, index);
  const status = row.passwdman2_status.trim();

  return {
    customFields,
    favorite: parseBoolean(row.passwdman2_favorite),
    primaryPassword,
    secureNote: optionalText(row.passwdman2_secure_note || row.remark),
    secondaryPasswords,
    status: status === 'archived' ? 'archived' : 'active',
    title,
    totpSecret: optionalText(row.passwdman2_totp_secret),
    url: optionalText(row.login_uri),
    username: optionalText(row.login_username),
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

function parseSecondaryPasswords(value: string, rowIndex: number): SecondaryPassword[] {
  if (!value.trim()) {
    return [];
  }

  const parsed = parseJsonField(value, `CSV row ${rowIndex + 2} passwdman2_secondary_passwords`);
  if (!Array.isArray(parsed)) {
    throw new Error(`CSV row ${rowIndex + 2} passwdman2_secondary_passwords must be a JSON array.`);
  }

  return parsed.map((password, index) => {
    if (!password || typeof password !== 'object') {
      throw new Error(`Secondary password ${index + 1} in CSV row ${rowIndex + 2} must be an object.`);
    }

    const candidate = password as { note?: unknown; password?: unknown; value?: unknown };
    const valueText = typeof candidate.password === 'string' ? candidate.password : candidate.value;
    return validateSecondaryPassword(
      {
        id: `imported-secondary-${rowIndex + 1}-${index + 1}`,
        note: candidate.note,
        sortOrder: index,
        value: valueText,
      },
      rowIndex,
      index,
    );
  });
}

function parseCustomFields(
  value: string,
  rowIndex: number,
  fieldName = 'custom fields',
): Array<Record<string, string>> | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = parseJsonField(value, `CSV row ${rowIndex + 2} ${fieldName}`);
  if (!Array.isArray(parsed)) {
    throw new Error(`CSV row ${rowIndex + 2} ${fieldName} must be a JSON array.`);
  }

  return parsed.map((field) => {
    if (!field || typeof field !== 'object' || Array.isArray(field)) {
      throw new Error(`CSV row ${rowIndex + 2} ${fieldName} must contain objects.`);
    }

    return Object.fromEntries(
      Object.entries(field as Record<string, unknown>).map(([key, fieldValue]) => [key, String(fieldValue)]),
    );
  });
}

function parseLegacyFields(value: string, rowIndex: number): Array<Record<string, string>> | undefined {
  if (!value.trim()) {
    return undefined;
  }

  try {
    return parseCustomFields(value, rowIndex, 'fields');
  } catch {
    return undefined;
  }
}

function parseJsonField(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must contain valid JSON.`);
  }
}

function parseBoolean(value: string): boolean {
  return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase());
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseCsv(rawCsv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < rawCsv.length; index += 1) {
    const char = rawCsv[index];
    const nextChar = rawCsv[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  row.push(field);
  if (row.length > 1 || row[0]) {
    rows.push(row);
  }

  return rows;
}

function toCsvRow(headers: string[], row: string[]): CsvRow {
  const value = {} as CsvRow;
  headers.forEach((header, index) => {
    value[header] = row[index] ?? '';
  });

  for (const header of CSV_HEADERS) {
    value[header] ??= '';
  }

  return value;
}

function normalizeHeader(header: string, index: number): string {
  const trimmed = header.trim();
  return index === 0 ? trimmed.replace(/^\uFEFF/, '') : trimmed;
}

function hasImportableCsvContent(row: CsvRow): boolean {
  return [
    row.name,
    row.login_uri,
    row.login_username,
    row.login_password,
    row.remark,
    row.passwdman2_secondary_passwords,
    row.passwdman2_totp_secret,
    row.passwdman2_secure_note,
    row.passwdman2_custom_fields,
    row.passwdman2_favorite,
    row.passwdman2_status,
  ].some((value) => value.trim().length > 0);
}
