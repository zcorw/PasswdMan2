import { Button, Stack, TextField, Typography } from '@mui/material';
import { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routes';
import { appTokens } from '../theme';

export function RegisterPage() {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(routes.vault);
  }

  return (
    <MobileAppLayout>
      <Stack component="form" spacing={3} onSubmit={handleSubmit} sx={{ pt: 0.5 }}>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Authentication
          </Typography>
          <Typography variant="h2" component="h1" sx={{ pt: 3 }}>
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
            <TextField autoComplete="username" fullWidth name="email" type="email" />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Login password
            </Typography>
            <TextField autoComplete="new-password" fullWidth name="password" type="password" />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Master password
            </Typography>
            <TextField autoComplete="new-password" fullWidth name="masterPassword" type="password" />
          </Stack>
        </Stack>

        <Stack spacing={2} sx={{ pt: 2 }}>
          <Button type="submit" variant="contained" fullWidth sx={{ minHeight: 50 }}>
            Create account
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
