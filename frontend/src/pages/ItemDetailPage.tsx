import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import KeyIcon from '@mui/icons-material/Key';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { useVaultItems } from '../context/VaultItemsContext';
import { routes } from '../routes';

export function ItemDetailPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { items } = useVaultItems();
  const item = items.find((candidate) => candidate.id === itemId);

  if (!item) {
    return (
      <AppLayout>
        <Stack spacing={2}>
          <IconButton aria-label="Back to vault" onClick={() => navigate(routes.vault)} sx={{ alignSelf: 'flex-start' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Item not found</Typography>
        </Stack>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Stack spacing={2.25}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton aria-label="Back to vault" onClick={() => navigate(routes.vault)}>
            <ArrowBackIcon />
          </IconButton>
          <IconButton aria-label="Edit item" color="primary" onClick={() => navigate(routes.itemEditPath(item.id))}>
            <EditIcon />
          </IconButton>
        </Stack>

        <Box>
          <Typography variant="h5" component="h1">
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Updated {new Date(item.updatedAt).toLocaleDateString()}
          </Typography>
        </Box>

        <Stack className="detail-panel" spacing={2}>
          <DetailLine label="URL" value={item.url} icon={<LaunchIcon />} />
          <DetailLine label="Username" value={item.username} icon={<ContentCopyIcon />} />
          <DetailLine label="Primary password" value="••••••••••••" icon={<KeyIcon />} />
          <Divider />
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Secondary passwords
            </Typography>
            {item.secondaryPasswords.map((secondary) => (
              <Stack className="secondary-row" direction="row" alignItems="center" justifyContent="space-between" key={secondary.id}>
                <Box>
                  <Typography variant="body2">{secondary.note}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ••••••••
                  </Typography>
                </Box>
                <IconButton aria-label={`Secondary password ${secondary.note}`}>
                  <KeyIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </AppLayout>
  );
}

function DetailLine({ label, value, icon }: { label: string; value: string; icon: JSX.Element }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography noWrap>{value}</Typography>
      </Box>
      <IconButton aria-label={label}>{icon}</IconButton>
    </Stack>
  );
}
