import { Stack, Typography } from '@mui/material';

import { MobileAppLayout } from '../layouts/MobileAppLayout';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={1.5} sx={{ pt: 0.5 }}>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </MobileAppLayout>
  );
}
