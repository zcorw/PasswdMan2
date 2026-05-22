import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import { Box, Fab, InputAdornment, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IconActionButton } from '../components/common/IconActionButton';
import { ImportExportActions } from '../components/common/ImportExportActions';
import { PageState } from '../components/common/PageState';
import { VaultItemCard } from '../components/data-display/VaultItemCard';
import { listItems, type ItemListParams } from '../features/vault/itemsApi';
import { mapApiItemsToVaultItems } from '../features/vault/itemMapper';
import { useVaultKey } from '../features/vault/vaultKeyStore';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';
import { appTokens } from '../theme';
import type { VaultItem } from '../types/vault';

export function VaultPage() {
  const navigate = useNavigate();
  const { vaultKey } = useVaultKey();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemListParams['status']>('active');
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | undefined>(undefined);
  const [sortMode, setSortMode] = useState<ItemListParams['sort']>('updatedAtDesc');
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      setIsLoading(true);
      setError('');
      try {
        if (!vaultKey) {
          throw new Error('Vault is locked. Unlock the vault before loading items.');
        }
        const response = await listItems({
          favorite: favoriteFilter,
          q: searchQuery.trim() || undefined,
          sort: sortMode,
          status: statusFilter,
        });
        const mappedItems = mapApiItemsToVaultItems(response.items, vaultKey);
        if (!ignore) {
          setItems(mappedItems);
          setTotalItems(response.pagination.total);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load vault items.');
          setItems([]);
          setTotalItems(0);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      ignore = true;
    };
  }, [favoriteFilter, searchQuery, sortMode, statusFilter, vaultKey]);

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
            {totalItems} items
          </Typography>
        </Stack>

        <TextField
          fullWidth
          placeholder="Search vault"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
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
            <IconActionButton label="Filter vault" onClick={(event) => setFilterAnchor(event.currentTarget)}>
              <FilterListOutlinedIcon fontSize="small" />
            </IconActionButton>
            <IconActionButton label="Sort vault" onClick={(event) => setSortAnchor(event.currentTarget)}>
              <SortOutlinedIcon fontSize="small" />
            </IconActionButton>
          </Stack>
        </Stack>
        <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
          <MenuItem
            selected={statusFilter === 'active' && favoriteFilter === undefined}
            onClick={() => {
              setStatusFilter('active');
              setFavoriteFilter(undefined);
              setFilterAnchor(null);
            }}
          >
            Active
          </MenuItem>
          <MenuItem
            selected={favoriteFilter === true}
            onClick={() => {
              setStatusFilter('active');
              setFavoriteFilter(true);
              setFilterAnchor(null);
            }}
          >
            Favorites
          </MenuItem>
          <MenuItem
            selected={statusFilter === 'archived'}
            onClick={() => {
              setStatusFilter('archived');
              setFavoriteFilter(undefined);
              setFilterAnchor(null);
            }}
          >
            Archived
          </MenuItem>
          <MenuItem
            selected={statusFilter === 'all'}
            onClick={() => {
              setStatusFilter('all');
              setFavoriteFilter(undefined);
              setFilterAnchor(null);
            }}
          >
            All
          </MenuItem>
        </Menu>
        <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
          <MenuItem
            selected={sortMode === 'updatedAtDesc'}
            onClick={() => {
              setSortMode('updatedAtDesc');
              setSortAnchor(null);
            }}
          >
            Recently updated
          </MenuItem>
          <MenuItem
            selected={sortMode === 'titleAsc'}
            onClick={() => {
              setSortMode('titleAsc');
              setSortAnchor(null);
            }}
          >
            Title A-Z
          </MenuItem>
          <MenuItem
            selected={sortMode === 'createdAtDesc'}
            onClick={() => {
              setSortMode('createdAtDesc');
              setSortAnchor(null);
            }}
          >
            Recently created
          </MenuItem>
        </Menu>

        <Stack spacing={1.5}>
          {isLoading ? <PageState message="Loading vault items." /> : null}
          {error ? <PageState message={error} tone="error" /> : null}
          {!isLoading && !error && items.length === 0 ? (
            <PageState message="No vault items yet." />
          ) : null}
          {items.map((item) => (
            <VaultItemCard key={item.id} item={item} />
          ))}
        </Stack>
      </Stack>

      <Box
        sx={{
          position: 'fixed',
          right: {
            xs: 24,
            sm: `calc((100vw - ${appTokens.layout.mobileFrameWidth}px) / 2 + 24px)`,
          },
          bottom: appTokens.layout.bottomNavHeight + 24,
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
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
