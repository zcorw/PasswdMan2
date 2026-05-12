import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { Box, Button, Container, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { routes } from '../routes';

export function RegisterPage() {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(routes.vault);
  }

  return (
    <Box className="app-shell">
      <Container maxWidth="xs" sx={{ px: 2, py: 3 }}>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2.5 }}>
          <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box className="brand-mark" aria-hidden="true">
                <LockOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h5" component="h1">
                  Create vault
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a personal encrypted password vault
                </Typography>
              </Box>
            </Stack>
            <TextField autoComplete="username" fullWidth label="Email" type="email" />
            <TextField autoComplete="new-password" fullWidth label="Login password" type="password" />
            <TextField autoComplete="new-password" fullWidth label="Master password" type="password" />
            <Button endIcon={<PersonAddAlt1Icon />} type="submit" variant="contained">
              Create account
            </Button>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to={routes.login}>
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
