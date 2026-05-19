import { Button, Stack, TextField, Typography } from '@mui/material';
import { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../features/auth/authStore';
import {
  hasRegisterFormErrors,
  validateRegisterForm,
  type RegisterFormErrors,
} from '../features/auth/registerValidation';
import { useVaultKey } from '../features/vault/vaultKeyStore';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';
import { appTokens } from '../theme';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { clearVaultKey, createEncryptedVaultKey } = useVaultKey();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegisterForm({ email, masterPassword, password });
    setFormErrors(nextErrors);
    setSubmitError('');

    if (hasRegisterFormErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const encryptedVaultKey = await createEncryptedVaultKey(masterPassword);
      await register({ email, encryptedVaultKey, password });
      await login({ email, password });
      navigate(routes.vault);
    } catch (error) {
      clearVaultKey();
      setSubmitError(error instanceof Error ? error.message : 'Create account failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileAppLayout>
      <Stack component="form" noValidate spacing={3} onSubmit={handleSubmit} sx={{ pt: 0.5 }}>
        <Stack spacing={1.5}>
          <Typography variant="h2" component="h1">
            Create account
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 320 }}>
            Create a personal vault and protect it with a master password.
          </Typography>
        </Stack>

        <Stack spacing={2.5}>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Email
            </Typography>
            <TextField
              autoComplete="username"
              error={Boolean(formErrors.email)}
              fullWidth
              helperText={formErrors.email}
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setFormErrors((current) => ({ ...current, email: undefined }));
              }}
              type="email"
              value={email}
            />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Login password
            </Typography>
            <TextField
              autoComplete="new-password"
              error={Boolean(formErrors.password)}
              fullWidth
              helperText={formErrors.password}
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
                setFormErrors((current) => ({ ...current, password: undefined }));
              }}
              type="password"
              value={password}
            />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Master password
            </Typography>
            <TextField
              autoComplete="new-password"
              error={Boolean(formErrors.masterPassword)}
              fullWidth
              helperText={formErrors.masterPassword}
              name="masterPassword"
              onChange={(event) => {
                setMasterPassword(event.target.value);
                setFormErrors((current) => ({ ...current, masterPassword: undefined }));
              }}
              type="password"
              value={masterPassword}
            />
          </Stack>
        </Stack>
        {submitError ? (
          <Typography color="error" variant="body2">
            {submitError}
          </Typography>
        ) : null}

        <Stack spacing={2} sx={{ pt: 2 }}>
          <Button disabled={isSubmitting} type="submit" variant="contained" fullWidth sx={{ minHeight: 50 }}>
            {isSubmitting ? 'Creating account' : 'Create account'}
          </Button>
          <Button
            type="button"
            variant="contained"
            fullWidth
            onClick={() => navigate(routes.login)}
            sx={{
              minHeight: 46,
              bgcolor: appTokens.colors.mutedSurface,
              color: 'text.primary',
              '&:hover': { bgcolor: appTokens.colors.activeSurface },
            }}
          >
            Sign in
          </Button>
        </Stack>

        <Typography variant="body1" color="text.secondary" sx={{ pt: 4 }}>
          The server only syncs encrypted vault data and encrypted Vault Key material.
        </Typography>
      </Stack>
    </MobileAppLayout>
  );
}
