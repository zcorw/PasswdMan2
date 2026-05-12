import { Stack, Typography } from '@mui/material';

import { AppLayout } from '../components/AppLayout';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <AppLayout>
      <Stack spacing={1}>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary">This section will be completed in its dedicated TodoList task.</Typography>
      </Stack>
    </AppLayout>
  );
}
