import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';

const statusItems = [
  'PWA shell ready',
  'FastAPI backend skeleton',
  'Docker Compose baseline',
];

export default function App() {
  return (
    <Box className="app-shell">
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box className="brand-mark" aria-hidden="true">
                <LockOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h5" component="h1">
                  PasswdMan2
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Personal password manager PWA skeleton
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body1">
              This build contains only the project shell for the MVP. Authentication, vault
              encryption, password records, audit logs, and settings will be implemented in later
              TodoList tasks.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {statusItems.map((item) => (
                <Chip key={item} label={item} color="primary" variant="outlined" />
              ))}
            </Stack>

            <Button variant="contained" href="/api/health">
              Check API health
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
