import type { SecondaryPassword } from '../../types/vault';

export function normalizeSecondaryPasswordOrder(passwords: SecondaryPassword[]) {
  return passwords.map((password, index) => ({ ...password, sortOrder: index }));
}

export function createSecondaryPassword(index: number, id = `secondary-${index + 1}`): SecondaryPassword {
  return {
    id,
    note: '',
    value: '',
    sortOrder: index,
  };
}

function getNextSecondaryPasswordId(passwords: SecondaryPassword[]) {
  const ids = new Set(passwords.map((password) => password.id));
  let nextIndex = passwords.length + 1;

  while (ids.has(`secondary-${nextIndex}`)) {
    nextIndex += 1;
  }

  return `secondary-${nextIndex}`;
}

export function updateSecondaryPassword(
  passwords: SecondaryPassword[],
  nextPassword: SecondaryPassword,
) {
  return normalizeSecondaryPasswordOrder(
    passwords.map((password) => (password.id === nextPassword.id ? nextPassword : password)),
  );
}

export function deleteSecondaryPassword(passwords: SecondaryPassword[], passwordId: string) {
  return normalizeSecondaryPasswordOrder(passwords.filter((password) => password.id !== passwordId));
}

export function addSecondaryPassword(passwords: SecondaryPassword[], id?: string) {
  return normalizeSecondaryPasswordOrder([
    ...passwords,
    createSecondaryPassword(passwords.length, id ?? getNextSecondaryPasswordId(passwords)),
  ]);
}

export function moveSecondaryPassword(
  passwords: SecondaryPassword[],
  passwordId: string,
  direction: 'up' | 'down',
) {
  const currentIndex = passwords.findIndex((password) => password.id === passwordId);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= passwords.length) {
    return normalizeSecondaryPasswordOrder(passwords);
  }

  const nextPasswords = [...passwords];
  const [movedPassword] = nextPasswords.splice(currentIndex, 1);
  nextPasswords.splice(targetIndex, 0, movedPassword);

  return normalizeSecondaryPasswordOrder(nextPasswords);
}
