import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { Button, Checkbox, FormControlLabel, IconButton, Stack, TextField, Typography } from '@mui/material';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { useVaultItems } from '../context/VaultItemsContext';
import { routes } from '../routes';

export function ItemFormPage() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { addItem, items, updateItem } = useVaultItems();
  const existingItem = useMemo(() => items.find((item) => item.id === itemId), [itemId, items]);
  const [title, setTitle] = useState(existingItem?.title ?? '');
  const [url, setUrl] = useState(existingItem?.url ?? '');
  const [username, setUsername] = useState(existingItem?.username ?? '');
  const [primaryPassword, setPrimaryPassword] = useState('');
  const [favorite, setFavorite] = useState(existingItem?.favorite ?? false);
  const [secondaryNotes, setSecondaryNotes] = useState<string[]>(
    existingItem?.secondaryPasswords.map((secondary) => secondary.note) ?? [''],
  );
  const isEdit = Boolean(itemId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { title, url, username, favorite, secondaryNotes };
    const item = existingItem ? updateItem(existingItem.id, input) : addItem(input);
    setPrimaryPassword('');
    navigate(item ? routes.itemDetailPath(item.id) : routes.vault);
  }

  return (
    <AppLayout>
      <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label="Back to vault" onClick={() => navigate(routes.vault)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {isEdit ? 'Edit item' : 'New item'}
          </Typography>
        </Stack>

        <TextField required fullWidth label="Title" onChange={(event) => setTitle(event.target.value)} value={title} />
        <TextField fullWidth label="URL" onChange={(event) => setUrl(event.target.value)} value={url} />
        <TextField fullWidth label="Username" onChange={(event) => setUsername(event.target.value)} value={username} />
        <TextField
          fullWidth
          label="Primary password"
          onChange={(event) => setPrimaryPassword(event.target.value)}
          type="password"
          value={primaryPassword}
        />
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Secondary password notes</Typography>
          {secondaryNotes.map((note, index) => (
            <TextField
              fullWidth
              key={index}
              label={`Secondary note ${index + 1}`}
              onChange={(event) =>
                setSecondaryNotes((current) =>
                  current.map((currentNote, currentIndex) => (currentIndex === index ? event.target.value : currentNote)),
                )
              }
              value={note}
            />
          ))}
          <Button variant="outlined" onClick={() => setSecondaryNotes((current) => [...current, ''])}>
            Add secondary note
          </Button>
        </Stack>
        <FormControlLabel
          control={<Checkbox checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />}
          label="Favorite"
        />
        <Button endIcon={<SaveIcon />} type="submit" variant="contained">
          Save
        </Button>
      </Stack>
    </AppLayout>
  );
}
