import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { useVaultItems } from '../context/VaultItemsContext';
import { routes } from '../routes';

export function VaultPage() {
  const navigate = useNavigate();
  const { items } = useVaultItems();
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) =>
      [item.title, item.url, item.username].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [items, query]);

  return (
    <AppLayout>
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" component="h1">
              Vault
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {items.length} encrypted records
            </Typography>
          </Box>
          <IconButton aria-label="Create item" color="primary" onClick={() => navigate(routes.itemNew)}>
            <AddIcon />
          </IconButton>
        </Stack>

        <TextField
          fullWidth
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, URL, username"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          value={query}
        />

        <List disablePadding className="item-list">
          {filteredItems.map((item) => (
            <ListItemButton
              className="item-row"
              key={item.id}
              onClick={() => navigate(routes.itemDetailPath(item.id))}
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1">{item.title}</Typography>
                    {item.favorite ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                  </Stack>
                }
                secondary={
                  <Stack spacing={0.75}>
                    <Typography variant="body2" color="text.secondary">
                      {item.username}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={item.status} size="small" variant="outlined" />
                      <Chip label={`${item.secondaryPasswords.length} secondary`} size="small" variant="outlined" />
                    </Stack>
                  </Stack>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Stack>
    </AppLayout>
  );
}
