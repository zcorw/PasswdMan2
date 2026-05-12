import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  Alert,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';

import { mockSessions } from '../data/mockSessions';
import { createRecoveryCode } from '../features/security/recoveryCode';
import { encryptVaultKey, generateVaultKey, rewrapEncryptedVaultKey } from '../lib/vaultCrypto';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { appTokens } from '../theme';

export function SettingsPage() {
  const [currentMasterPassword, setCurrentMasterPassword] = useState('');
  const [nextMasterPassword, setNextMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryCodeDismissed, setRecoveryCodeDismissed] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sessions, setSessions] = useState(mockSessions);

  async function handleChangeMasterPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentMasterPassword || nextMasterPassword !== confirmMasterPassword) {
      setSnackbarMessage('Check your master password fields.');
      return;
    }

    const demoVaultKey = generateVaultKey();
    const encryptedVaultKey = await encryptVaultKey(currentMasterPassword, demoVaultKey);
    await rewrapEncryptedVaultKey(currentMasterPassword, nextMasterPassword, encryptedVaultKey);
    setSnackbarMessage('Vault Key re-encrypted with the new master password.');
    setCurrentMasterPassword('');
    setNextMasterPassword('');
    setConfirmMasterPassword('');
  }

  function handleCreateRecoveryCode() {
    if (recoveryCodeDismissed) {
      setSnackbarMessage('Create a new recovery code to view plaintext again.');
      return;
    }
    setRecoveryCode(createRecoveryCode());
  }

  function handleDismissRecoveryCode() {
    setRecoveryCode(null);
    setRecoveryCodeDismissed(true);
  }

  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <Stack spacing={0.75}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Vault access and sessions
          </Typography>
          <Typography variant="h2" component="h1">
            Settings
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: appTokens.radii.card, p: 2 }}>
          <Stack component="form" spacing={1.5} onSubmit={handleChangeMasterPassword}>
            <Stack direction="row" spacing={1} alignItems="center">
              <KeyOutlinedIcon color="primary" />
              <Typography variant="h3" component="h2">
                Master password
              </Typography>
            </Stack>
            <TextField
              label="Current master password"
              type="password"
              value={currentMasterPassword}
              onChange={(event) => setCurrentMasterPassword(event.target.value)}
            />
            <TextField
              label="New master password"
              type="password"
              value={nextMasterPassword}
              onChange={(event) => setNextMasterPassword(event.target.value)}
            />
            <TextField
              label="Confirm new master password"
              type="password"
              value={confirmMasterPassword}
              onChange={(event) => setConfirmMasterPassword(event.target.value)}
            />
            <Button type="submit" variant="contained" startIcon={<RestartAltOutlinedIcon />}>
              Re-encrypt Vault Key
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: appTokens.radii.card, p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ShieldOutlinedIcon color="primary" />
              <Typography variant="h3" component="h2">
                Recovery code
              </Typography>
            </Stack>
            {recoveryCode ? (
              <Alert severity="warning" action={<Button onClick={handleDismissRecoveryCode}>Done</Button>}>
                {recoveryCode}
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Plaintext is shown once. After closing it, create a new recovery code to view another one.
              </Typography>
            )}
            <Button variant="contained" onClick={handleCreateRecoveryCode}>
              Create recovery code
            </Button>
          </Stack>
        </Paper>

        <Stack spacing={1.5}>
          <Typography variant="h3" component="h2">
            Active sessions
          </Typography>
          {sessions.map((session) => (
            <Paper key={session.id} variant="outlined" sx={{ borderRadius: appTokens.radii.card, p: 2 }}>
              <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body1" fontWeight={700}>
                      {session.device}
                    </Typography>
                    {session.current ? <Chip label="Current" size="small" color="primary" /> : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Created {session.createdAt} - Expires {session.expiresAt}
                  </Typography>
                </Stack>
                <Button
                  color="error"
                  disabled={session.current}
                  startIcon={<LogoutOutlinedIcon />}
                  onClick={() => setSessions((current) => current.filter((item) => item.id !== session.id))}
                >
                  Sign out
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>

      <Snackbar
        autoHideDuration={2600}
        onClose={() => setSnackbarMessage('')}
        open={Boolean(snackbarMessage)}
        message={snackbarMessage}
      />
    </MobileAppLayout>
  );
}
