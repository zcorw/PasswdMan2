export interface SecondaryPasswordDraft {
  id: string;
  note: string;
}

export interface VaultItem {
  id: string;
  title: string;
  url: string;
  username: string;
  favorite: boolean;
  status: 'active' | 'archived';
  updatedAt: string;
  secondaryPasswords: SecondaryPasswordDraft[];
}

export const initialVaultItems: VaultItem[] = [
  {
    id: 'github',
    title: 'GitHub',
    url: 'https://github.com',
    username: 'pack.william',
    favorite: true,
    status: 'active',
    updatedAt: '2026-05-12T09:30:00Z',
    secondaryPasswords: [
      { id: 'github-payment', note: 'Payment password' },
      { id: 'github-recovery', note: 'Recovery password' },
    ],
  },
  {
    id: 'bank',
    title: 'North Bank',
    url: 'https://bank.example.com',
    username: 'william.primary',
    favorite: false,
    status: 'active',
    updatedAt: '2026-05-11T18:20:00Z',
    secondaryPasswords: [{ id: 'bank-pin', note: 'Card PIN' }],
  },
];

export function createItemId(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug || 'item'}-${Date.now().toString(36)}`;
}
