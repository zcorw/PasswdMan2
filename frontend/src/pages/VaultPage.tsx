import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import { Box, Fab, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { IconActionButton } from '../components/common/IconActionButton';
import { ImportExportActions } from '../components/common/ImportExportActions';
import { VaultItemCard } from '../components/data-display/VaultItemCard';
import { mockVaultItems } from '../data/mockVault';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';

export function VaultPage() {
  const navigate = useNavigate();

  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
          <Stack spacing={0.75}>
            <Typography variant="h2" component="h1">
              Vault
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ pb: 0.75 }}>
            38 items
          </Typography>
        </Stack>

        <TextField
          fullWidth
          placeholder="Search vault"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
        />

        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
          <ImportExportActions screen="vault" />
          <Stack direction="row" spacing={1}>
            <IconActionButton label="Filter vault">
              <FilterListOutlinedIcon fontSize="small" />
            </IconActionButton>
            <IconActionButton label="Sort vault">
              <SortOutlinedIcon fontSize="small" />
            </IconActionButton>
          </Stack>
        </Stack>

        <Stack spacing={1.5}>
          {mockVaultItems.map((item) => (
            <VaultItemCard key={item.id} item={item} />
          ))}
        </Stack>
      </Stack>

      <Box sx={{ position: 'absolute', right: 24, bottom: 150 }}>
        <Fab
          color="primary"
          aria-label="Create new item"
          onClick={() => navigate(routes.itemNew)}
          sx={{ width: 60, height: 60, borderRadius: '18px' }}
        >
          <AddOutlinedIcon />
        </Fab>
      </Box>
    </MobileAppLayout>
  );
}
