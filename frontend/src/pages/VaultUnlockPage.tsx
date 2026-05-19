import { Button, Stack, TextField, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { getVault } from '../features/vault/vaultApi';
import { useVaultKey } from '../features/vault/vaultKeyStore';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';

export function VaultUnlockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { unlockVaultKey, vaultKey } = useVaultKey();
  const [masterPassword, setMasterPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = getSafeNextPath(searchParams.get('next'));

  if (vaultKey) {
    return <Navigate to={nextPath} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (!masterPassword) {
      setFormError('Master password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { vault } = await getVault();
      await unlockVaultKey(masterPassword, vault.encryptedVaultKey);
      navigate(nextPath, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to unlock vault.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileAppLayout showBottomNav>
      <Stack component="form" noValidate spacing={3} onSubmit={handleSubmit} sx={{ pt: 0.5 }}>
        <Stack spacing={1.5}>
          <Typography variant="h2" component="h1">
            Unlock vault
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 320 }}>
            Enter your master password to decrypt the Vault Key on this device.
          </Typography>
        </Stack>

        <Stack spacing={0.75}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Master password
          </Typography>
          <TextField
            autoComplete="current-password"
            error={Boolean(formError)}
            fullWidth
            helperText={formError}
            name="masterPassword"
            onChange={(event) => {
              setMasterPassword(event.target.value);
              setFormError('');
            }}
            type="password"
            value={masterPassword}
          />
        </Stack>

        <Button disabled={isSubmitting} type="submit" variant="contained" fullWidth sx={{ minHeight: 50 }}>
          {isSubmitting ? 'Unlocking' : 'Unlock vault'}
        </Button>
      </Stack>
    </MobileAppLayout>
  );
}

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return routes.vault;
  }

  if (next === routes.login || next === routes.register || next === routes.vaultUnlock) {
    return routes.vault;
  }

  return next;
}
