import {
  Box,
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
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routes';
import { appTokens } from '../theme';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [rememberAccount, setRememberAccount] = useState(false);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rememberAccount) {
      saveRememberedAccount(identifier);
    } else {
      clearRememberedAccount();
    }
    navigate(routes.vault);
  }

  return (
    <MobileAppLayout>
      <Stack component="form" spacing={3} onSubmit={handleSubmit} sx={{ pt: 0.5 }}>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Authentication
          </Typography>
          <Box sx={{ height: 28 }} />
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
              fullWidth
              name="email"
              onChange={(event) => setIdentifier(event.target.value)}
              type="email"
              value={identifier}
            />
          </Stack>

          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Password
            </Typography>
            <TextField autoComplete="current-password" fullWidth name="password" type="password" />
          </Stack>
        </Stack>

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
          <Button type="submit" variant="contained" fullWidth sx={{ minHeight: 50 }}>
            Sign in
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
