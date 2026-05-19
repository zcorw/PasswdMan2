import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  clearRememberedAccount,
  loadRememberedAccount,
  saveRememberedAccount,
} from '../lib/rememberAccount';
import { useAuth } from '../features/auth/authStore';
import { hasLoginFormErrors, validateLoginForm, type LoginFormErrors } from '../features/auth/loginValidation';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';
import { appTokens } from '../theme';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberAccount, setRememberAccount] = useState(false);
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = loadRememberedAccount();
    if (remembered) {
      setIdentifier(remembered);
      setRememberAccount(true);
    }
  }, []);

  function handleRememberChange(checked: boolean) {
    setRememberAccount(checked);
    if (!checked) {
      clearRememberedAccount();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginForm({ email: identifier, password });
    setFormErrors(nextErrors);
    setSubmitError('');

    if (hasLoginFormErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: identifier, password });
      if (rememberAccount) {
        saveRememberedAccount(identifier);
      } else {
        clearRememberedAccount();
      }
      navigate(routes.vault);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileAppLayout>
      <Stack component="form" noValidate spacing={3} onSubmit={handleSubmit} sx={{ pt: 0.5 }}>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography variant="h1" component="h1">
            PasswdMan2
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 302 }}>
            Unlock your encrypted personal vault on this device.
          </Typography>
        </Stack>

        <Stack spacing={2.5} sx={{ pt: 3 }}>
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
                setIdentifier(event.target.value);
                setFormErrors((current) => ({ ...current, email: undefined }));
              }}
              type="email"
              value={identifier}
            />
          </Stack>

          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Password
            </Typography>
            <TextField
              autoComplete="current-password"
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
        </Stack>
        {submitError ? (
          <Typography color="error" variant="body2">
            {submitError}
          </Typography>
        ) : null}

        <FormControl sx={{ pt: 0.25 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberAccount}
                onChange={(event) => handleRememberChange(event.target.checked)}
                sx={{ color: appTokens.colors.border }}
              />
            }
            label={
              <Stack spacing={0.25}>
                <Typography variant="body1" fontWeight={600}>
                  Remember account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only saves your account identifier on this device.
                </Typography>
              </Stack>
            }
          />
        </FormControl>

        <Stack spacing={2} sx={{ pt: 2 }}>
          <Button disabled={isSubmitting} type="submit" variant="contained" fullWidth sx={{ minHeight: 50 }}>
            {isSubmitting ? 'Signing in' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="contained"
            fullWidth
            onClick={() => navigate(routes.register)}
            sx={{
              minHeight: 46,
              bgcolor: appTokens.colors.mutedSurface,
              color: 'text.primary',
              '&:hover': { bgcolor: appTokens.colors.activeSurface },
            }}
          >
            Create account
          </Button>
        </Stack>

        <Typography variant="body1" color="text.secondary" sx={{ pt: 8 }}>
          Vault data stays encrypted before it leaves your device.
        </Typography>
      </Stack>
    </MobileAppLayout>
  );
}
