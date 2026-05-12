import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { appTokens } from '../../theme';

interface FieldActionRowProps {
  label: string;
  value: string;
  actions: ReactNode;
}

export function FieldActionRow({ label, value, actions }: FieldActionRowProps) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: appTokens.colors.mutedSurface,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: appTokens.radii.control,
          display: 'flex',
          minHeight: 52,
          gap: 1,
          pl: 1.75,
          pr: 0.5,
        }}
      >
        <Typography variant="body1" sx={{ flex: 1, minWidth: 0 }} noWrap>
          {value}
        </Typography>
        <Stack direction="row" spacing={1}>
          {actions}
        </Stack>
      </Box>
    </Stack>
  );
}
