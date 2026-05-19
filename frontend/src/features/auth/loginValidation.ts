import { z } from 'zod';

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .min(3, 'Enter a valid email address.')
    .max(320, 'Enter a valid email address.')
    .email('Enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(12, 'Password must be 12-256 characters.')
    .max(256, 'Password must be 12-256 characters.'),
});

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  return loginFormSchemaToErrors(loginFormSchema.safeParse(values));
}

export function hasLoginFormErrors(errors: LoginFormErrors): boolean {
  return Boolean(errors.email || errors.password);
}

function loginFormSchemaToErrors(result: ReturnType<typeof loginFormSchema.safeParse>): LoginFormErrors {
  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<LoginFormErrors>((errors, issue) => {
    const field = issue.path[0];
    if ((field === 'email' || field === 'password') && !errors[field]) {
      errors[field] = issue.message;
    }
    return errors;
  }, {});
}
