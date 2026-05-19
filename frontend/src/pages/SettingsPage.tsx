import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';

import { ImportExportActions } from '../components/common/ImportExportActions';
import { PageState } from '../components/common/PageState';
import { useAuth } from '../features/auth/authStore';
import { listSessions, mapSessionToView, revokeSession, type ActiveSessionView } from '../features/auth/sessionsApi';
import { createRecoveryCode } from '../features/security/recoveryCode';
import { useNotification } from '../features/ui/notificationStore';
import {
  hasMasterPasswordFormErrors,
  validateMasterPasswordForm,
  type MasterPasswordFormErrors,
} from '../features/vault/masterPasswordValidation';
import { getVault, syncVault } from '../features/vault/vaultApi';
import { useVaultKey } from '../features/vault/vaultKeyStore';
import { rewrapEncryptedVaultKey } from '../lib/vaultCrypto';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { appTokens } from '../theme';

export function SettingsPage() {
  const { session: currentSession } = useAuth();
  const { notify } = useNotification();
  const { encryptedVaultKey, setUnlockedVaultKey, vaultKey } = useVaultKey();
  const [currentMasterPassword, setCurrentMasterPassword] = useState('');
  const [nextMasterPassword, setNextMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [masterPasswordErrors, setMasterPasswordErrors] = useState<MasterPasswordFormErrors>({});
  const [isChangingMasterPassword, setIsChangingMasterPassword] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryCodeDismissed, setRecoveryCodeDismissed] = useState(false);
  const [sessions, setSessions] = useState<ActiveSessionView[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSessions() {
      setSessionsLoading(true);
      setSessionsError('');
      try {
        const response = await listSessions();
        if (!ignore) {
          setSessions(response.sessions.map((item) => mapSessionToView(item, currentSession?.id)));
        }
      } catch (error) {
        if (!ignore) {
          setSessionsError(error instanceof Error ? error.message : 'Unable to load active sessions.');
          setSessions([]);
        }
      } finally {
        if (!ignore) {
          setSessionsLoading(false);
        }
      }
    }

    void loadSessions();

    return () => {
      ignore = true;
    };
  }, [currentSession?.id]);

  async function handleChangeMasterPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateMasterPasswordForm({
      confirmMasterPassword,
      currentMasterPassword,
      nextMasterPassword,
    });
    setMasterPasswordErrors(nextErrors);

    if (hasMasterPasswordFormErrors(nextErrors)) {
      return;
    }

    if (!encryptedVaultKey || !vaultKey) {
      notify('Vault is locked. Unlock the vault before changing the master password.', 'error');
      return;
    }

    setIsChangingMasterPassword(true);
    try {
      const nextEncryptedVaultKey = await rewrapEncryptedVaultKey(
        currentMasterPassword,
        nextMasterPassword,
        encryptedVaultKey,
      );
      const { vault } = await getVault();
      await syncVault({
        encryptedData: vault.encryptedData,
        encryptedVaultKey: nextEncryptedVaultKey,
      });
      setUnlockedVaultKey(vaultKey, nextEncryptedVaultKey);
      notify('Vault Key re-encrypted with the new master password.', 'success');
      setCurrentMasterPassword('');
      setNextMasterPassword('');
      setConfirmMasterPassword('');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to change master password.', 'error');
    } finally {
      setIsChangingMasterPassword(false);
    }
  }

  function handleCreateRecoveryCode() {
    if (recoveryCodeDismissed) {
      notify('Create a new recovery code to view plaintext again.', 'info');
      return;
    }
    setRecoveryCode(createRecoveryCode());
  }

  function handleDismissRecoveryCode() {
    setRecoveryCode(null);
    setRecoveryCodeDismissed(true);
  }

  async function handleRevokeSession(sessionId: string) {
    setRevokingSessionId(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((current) => current.filter((item) => item.id !== sessionId));
      notify('Session signed out.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to sign out session.', 'error');
    } finally {
      setRevokingSessionId(null);
    }
  }

  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <Stack spacing={0.75}>
          <Typography variant="h2" component="h1">
            Settings
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: appTokens.radii.card, p: 2 }}>
          <Stack component="form" noValidate spacing={1.5} onSubmit={handleChangeMasterPassword}>
            <Stack direction="row" spacing={1} alignItems="center">
              <KeyOutlinedIcon color="primary" />
              <Typography variant="h3" component="h2">
                Master password
              </Typography>
            </Stack>
            <TextField
              label="Current master password"
              error={Boolean(masterPasswordErrors.currentMasterPassword)}
              helperText={masterPasswordErrors.currentMasterPassword}
              type="password"
              value={currentMasterPassword}
              onChange={(event) => {
                setCurrentMasterPassword(event.target.value);
                setMasterPasswordErrors((current) => ({ ...current, currentMasterPassword: undefined }));
              }}
            />
            <TextField
              label="New master password"
              error={Boolean(masterPasswordErrors.nextMasterPassword)}
              helperText={masterPasswordErrors.nextMasterPassword}
              type="password"
              value={nextMasterPassword}
              onChange={(event) => {
                setNextMasterPassword(event.target.value);
                setMasterPasswordErrors((current) => ({ ...current, nextMasterPassword: undefined }));
              }}
            />
            <TextField
              label="Confirm new master password"
              error={Boolean(masterPasswordErrors.confirmMasterPassword)}
              helperText={masterPasswordErrors.confirmMasterPassword}
              type="password"
              value={confirmMasterPassword}
              onChange={(event) => {
                setConfirmMasterPassword(event.target.value);
                setMasterPasswordErrors((current) => ({ ...current, confirmMasterPassword: undefined }));
              }}
            />
            <Button
              disabled={isChangingMasterPassword}
              type="submit"
              variant="contained"
              startIcon={<RestartAltOutlinedIcon />}
            >
              {isChangingMasterPassword ? 'Re-encrypting Vault Key' : 'Re-encrypt Vault Key'}
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

        <Paper variant="outlined" sx={{ borderRadius: appTokens.radii.card, p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="h3" component="h2">
              Import / export
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Exported vault files require careful handling even when encrypted.
            </Typography>
            <ImportExportActions screen="settings" />
          </Stack>
        </Paper>

        <Stack spacing={1.5}>
          <Typography variant="h3" component="h2">
            Active sessions
          </Typography>
          {sessionsLoading ? <PageState message="Loading sessions." /> : null}
          {sessionsError ? <PageState message={sessionsError} tone="error" /> : null}
          {!sessionsLoading && !sessionsError && sessions.length === 0 ? (
            <PageState message="No active sessions." />
          ) : null}
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
                  disabled={session.current || revokingSessionId === session.id}
                  startIcon={<LogoutOutlinedIcon />}
                  onClick={() => handleRevokeSession(session.id)}
                >
                  {revokingSessionId === session.id ? 'Signing out' : 'Sign out'}
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </MobileAppLayout>
  );
}
