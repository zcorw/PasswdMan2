import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import { IconActionButton } from '../components/common/IconActionButton';
import { FieldActionRow } from '../components/data-display/FieldActionRow';
import { SecondaryPasswordRow } from '../components/data-display/SecondaryPasswordRow';
import { mockVaultItems } from '../data/mockVault';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';
import { appTokens } from '../theme';
import { getVaultItem, maskSecret, normalizeExternalUrl } from '../utils/vault';

export function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const item = getVaultItem(mockVaultItems, itemId);

  function copyValue(value: string) {
    void navigator.clipboard?.writeText(value);
  }

  function openUrl() {
    window.open(normalizeExternalUrl(item.url), '_blank', 'noopener,noreferrer');
  }

  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={2.25} sx={{ pt: 0.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Main password + secondary passwords
        </Typography>
        <Button
          variant="text"
          onClick={() => navigate(routes.vault)}
          sx={{ alignSelf: 'flex-start', minHeight: 0, p: 0, color: 'primary.main' }}
        >
          {'< Vault'}
        </Button>

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h2" component="h1" noWrap>
            {item.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconActionButton label="Edit item" onClick={() => navigate(`/items/${item.id}/edit`)}>
              <EditOutlinedIcon fontSize="small" />
            </IconActionButton>
            <IconActionButton label="More actions">
              <MoreHorizOutlinedIcon fontSize="small" />
            </IconActionButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Chip label={item.category} sx={{ bgcolor: appTokens.colors.activeSurface, color: 'primary.main' }} />
          <Chip
            label={`${item.secondaryPasswords.length} secondary`}
            sx={{ bgcolor: appTokens.colors.activeSurface, color: 'primary.main' }}
          />
        </Stack>

        <FieldActionRow
          label="URL"
          value={item.url.replace(/^https?:\/\//i, '')}
          actions={
            <IconActionButton label="Open URL in new window" color="secondary" onClick={openUrl}>
              <OpenInNewOutlinedIcon fontSize="small" />
            </IconActionButton>
          }
        />
        <FieldActionRow
          label="Username"
          value={item.username}
          actions={
            <IconActionButton label="Copy username" color="primary" onClick={() => copyValue(item.username)}>
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconActionButton>
          }
        />
        <FieldActionRow
          label="Main password"
          value={maskSecret(item.primaryPassword)}
          actions={
            <>
              <IconActionButton label="Show main password" color="secondary">
                <VisibilityOutlinedIcon fontSize="small" />
              </IconActionButton>
              <IconActionButton
                label="Copy main password"
                color="primary"
                onClick={() => copyValue(item.primaryPassword)}
              >
                <ContentCopyOutlinedIcon fontSize="small" />
              </IconActionButton>
            </>
          }
        />

        <Typography variant="h3" component="h2" sx={{ pt: 1.75 }}>
          Secondary passwords
        </Typography>
        <Stack spacing={1.5}>
          {item.secondaryPasswords.map((secondary) => (
            <SecondaryPasswordRow key={secondary.id} password={secondary} onCopy={copyValue} />
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Each secondary password has its own copy button.
        </Typography>
      </Stack>
    </MobileAppLayout>
  );
}
