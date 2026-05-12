import { CardActionArea, Chip, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { appTokens } from '../../theme';
import type { VaultItem } from '../../types/vault';

interface VaultItemCardProps {
  item: VaultItem;
}

export function VaultItemCard({ item }: VaultItemCardProps) {
  const navigate = useNavigate();

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: 'divider',
        borderRadius: appTokens.radii.card,
        overflow: 'hidden',
      }}
    >
      <CardActionArea onClick={() => navigate(`/items/${item.id}`)} sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack spacing={0.5} minWidth={0}>
              <Typography variant="body1" fontWeight={700} noWrap>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {item.username}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
              {item.updatedAt}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={item.category} sx={{ bgcolor: appTokens.colors.activeSurface, color: 'primary.main' }} />
            <Chip
              label={`${item.secondaryPasswords.length} secondary`}
              sx={{ bgcolor: appTokens.colors.activeSurface, color: 'primary.main' }}
            />
          </Stack>
        </Stack>
      </CardActionArea>
    </Paper>
  );
}
