import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Paper, Stack, Typography } from '@mui/material';

import { appTokens } from '../../theme';
import type { SecondaryPassword } from '../../types/vault';
import { maskSecret } from '../../utils/vault';
import { IconActionButton } from '../common/IconActionButton';

interface SecondaryPasswordRowProps {
  isVisible: boolean;
  password: SecondaryPassword;
  onCopy: (value: string) => void;
  onToggleVisibility: () => void;
}

export function SecondaryPasswordRow({ isVisible, password, onCopy, onToggleVisibility }: SecondaryPasswordRowProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: appTokens.colors.mutedSurface,
        borderColor: 'divider',
        borderRadius: appTokens.radii.card,
        p: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
            {password.note}
          </Typography>
          <Typography variant="body1" color="text.primary" noWrap>
            {isVisible ? password.value : maskSecret(password.value)}
          </Typography>
        </Stack>
        <IconActionButton label={`Show ${password.note}`} color="secondary" onClick={onToggleVisibility}>
          <VisibilityOutlinedIcon fontSize="small" />
        </IconActionButton>
        <IconActionButton label={`Copy ${password.note}`} color="primary" onClick={() => onCopy(password.value)}>
          <ContentCopyOutlinedIcon fontSize="small" />
        </IconActionButton>
      </Stack>
    </Paper>
  );
}
