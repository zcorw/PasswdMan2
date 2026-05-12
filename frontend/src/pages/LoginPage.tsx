import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import {
  clearRememberedAccount,
  loadRememberedAccount,
  saveRememberedAccount,
} from '../lib/rememberAccount';
import { routes } from '../routes';

export function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [rememberAccount, setRememberAccount] = useState(false);

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
    <Box className="app-shell">
      <Container maxWidth="xs" sx={{ px: 2, py: 3 }}>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2.5 }}>
          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box className="brand-mark" aria-hidden="true">
                <LockOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h5" component="h1">
                  PasswdMan2
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to your encrypted vault
                </Typography>
              </Box>
            </Stack>

            <TextField
              autoComplete="username"
              fullWidth
              label="Email"
              name="email"
              onChange={(event) => setIdentifier(event.target.value)}
              type="email"
              value={identifier}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberAccount}
                  onChange={(event) => handleRememberChange(event.target.checked)}
                />
              }
              label="Remember account"
            />

            <Button endIcon={<LoginIcon />} type="submit" variant="contained">
              Continue
            </Button>
            <Typography variant="body2" color="text.secondary">
              New to PasswdMan2?{' '}
              <Button component={RouterLink} to={routes.register} variant="text" sx={{ minHeight: 0, p: 0 }}>
                Create account
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
