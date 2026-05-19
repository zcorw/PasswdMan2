import { z } from 'zod';

import type { LoginFormErrors } from './loginValidation';

export interface RegisterFormValues {
  email: string;
  masterPassword: string;
  password: string;
}

export interface RegisterFormErrors extends LoginFormErrors {
  masterPassword?: string;
}

const registerFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .min(3, 'Enter a valid email address.')
    .max(320, 'Enter a valid email address.')
    .email('Enter a valid email address.'),
  masterPassword: z
    .string()
    .min(1, 'Master password is required.')
    .min(6, 'Master password must be 6-256 characters.')
    .max(256, 'Master password must be 6-256 characters.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(6, 'Password must be 6-256 characters.')
    .max(256, 'Password must be 6-256 characters.'),
});

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const result = registerFormSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<RegisterFormErrors>((errors, issue) => {
    const field = issue.path[0];
    if ((field === 'email' || field === 'password' || field === 'masterPassword') && !errors[field]) {
      errors[field] = issue.message;
    }
    return errors;
  }, {});
}

export function hasRegisterFormErrors(errors: RegisterFormErrors): boolean {
  return Boolean(errors.email || errors.password || errors.masterPassword);
}
