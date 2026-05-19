import { z } from 'zod';

export interface MasterPasswordFormValues {
  confirmMasterPassword: string;
  currentMasterPassword: string;
  nextMasterPassword: string;
}

export interface MasterPasswordFormErrors {
  confirmMasterPassword?: string;
  currentMasterPassword?: string;
  nextMasterPassword?: string;
}

const masterPasswordFormSchema = z
  .object({
    confirmMasterPassword: z.string(),
    currentMasterPassword: z.string().min(1, 'Current master password is required.'),
    nextMasterPassword: z
      .string()
      .min(1, 'New master password is required.')
      .min(6, 'New master password must be 6-256 characters.')
      .max(256, 'New master password must be 6-256 characters.'),
  })
  .refine((values) => values.nextMasterPassword === values.confirmMasterPassword, {
    message: 'Master passwords do not match.',
    path: ['confirmMasterPassword'],
  });

export function validateMasterPasswordForm(values: MasterPasswordFormValues): MasterPasswordFormErrors {
  const result = masterPasswordFormSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<MasterPasswordFormErrors>((errors, issue) => {
    const field = issue.path[0];
    if (
      (field === 'currentMasterPassword' || field === 'nextMasterPassword' || field === 'confirmMasterPassword') &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }
    return errors;
  }, {});
}

export function hasMasterPasswordFormErrors(errors: MasterPasswordFormErrors): boolean {
  return Boolean(errors.currentMasterPassword || errors.nextMasterPassword || errors.confirmMasterPassword);
}
