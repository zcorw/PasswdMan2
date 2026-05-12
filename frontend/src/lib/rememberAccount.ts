const REMEMBERED_ACCOUNT_KEY = 'passwdman2.rememberedAccount';

export function loadRememberedAccount(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_ACCOUNT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveRememberedAccount(identifier: string): void {
  const normalized = identifier.trim();
  if (!normalized) {
    clearRememberedAccount();
    return;
  }

  window.localStorage.setItem(REMEMBERED_ACCOUNT_KEY, normalized);
}

export function clearRememberedAccount(): void {
  window.localStorage.removeItem(REMEMBERED_ACCOUNT_KEY);
}
