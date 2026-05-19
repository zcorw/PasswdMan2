import { z } from 'zod';

import type { SecondaryPassword } from '../../types/vault';

export interface ItemFormValues {
  primaryPassword: string;
  secondaryPasswords: SecondaryPassword[];
  title: string;
  url: string;
  username: string;
}

export interface ItemFormErrors {
  primaryPassword?: string;
  secondaryPasswords?: string;
  title?: string;
  url?: string;
  username?: string;
}

const secondaryPasswordSchema = z.object({
  id: z.string(),
  note: z.string().trim().min(1).max(120),
  sortOrder: z.number(),
  value: z.string().min(1),
});

const itemFormSchema = z.object({
  primaryPassword: z.string().min(1, 'Main password is required.'),
  secondaryPasswords: z.array(secondaryPasswordSchema).max(20, 'Use 20 or fewer secondary passwords.'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(120, 'Title must be 120 characters or fewer.'),
  url: z.string().max(2048, 'URL must be 2048 characters or fewer.'),
  username: z.string().max(320, 'Username must be 320 characters or fewer.'),
});

export function validateItemForm(values: ItemFormValues): ItemFormErrors {
  const result = itemFormSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<ItemFormErrors>((errors, issue) => {
    const field = issue.path[0];
    if (field === 'secondaryPasswords') {
      errors.secondaryPasswords =
        errors.secondaryPasswords ??
        (issue.path.length > 1
          ? 'Each secondary password needs a note, value, and note length of 120 or fewer.'
          : issue.message);
    }
    if ((field === 'title' || field === 'url' || field === 'username' || field === 'primaryPassword') && !errors[field]) {
      errors[field] = issue.message;
    }
    return errors;
  }, {});
}

export function hasItemFormErrors(errors: ItemFormErrors): boolean {
  return Boolean(errors.title || errors.url || errors.username || errors.primaryPassword || errors.secondaryPasswords);
}
