export interface SecondaryPassword {
  id: string;
  note: string;
  value: string;
}

export interface VaultItem {
  id: string;
  title: string;
  url: string;
  username: string;
  primaryPassword: string;
  category: string;
  updatedAt: string;
  secondaryPasswords: SecondaryPassword[];
}
