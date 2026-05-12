import { IconButton, Tooltip } from '@mui/material';
import type { ReactNode } from 'react';

import { appTokens } from '../../theme';

interface IconActionButtonProps {
  label: string;
  children: ReactNode;
  color?: 'primary' | 'secondary' | 'default' | 'error';
  onClick?: () => void;
}

export function IconActionButton({ label, children, color = 'default', onClick }: IconActionButtonProps) {
  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        color={color}
        onClick={onClick}
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            bgcolor: appTokens.colors.mutedSurface,
          },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}
