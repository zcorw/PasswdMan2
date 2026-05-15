import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { SecondaryPasswordEditor } from '../components/form/SecondaryPasswordEditor';
import { mockVaultItems } from '../data/mockVault';
import { generatePassword } from '../features/password-generator/passwordGenerator';
import {
  addSecondaryPassword,
  deleteSecondaryPassword,
  moveSecondaryPassword,
  normalizeSecondaryPasswordOrder,
  updateSecondaryPassword,
} from '../features/vault/secondaryPasswords';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';
import { appTokens } from '../theme';
import type { SecondaryPassword } from '../types/vault';
import { getVaultItem } from '../utils/vault';

export function ItemFormPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const existingItem = useMemo(() => (itemId ? getVaultItem(mockVaultItems, itemId) : mockVaultItems[0]), [itemId]);
  const isNew = !itemId;
  const [primaryPassword, setPrimaryPassword] = useState('');
  const [secondaryPasswords, setSecondaryPasswords] = useState<SecondaryPassword[]>(
    isNew ? [] : normalizeSecondaryPasswordOrder(existingItem.secondaryPasswords),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(isNew ? routes.vault : `/items/${existingItem.id}`);
  }

  function updateSecondary(nextPassword: SecondaryPassword) {
    setSecondaryPasswords((current) => updateSecondaryPassword(current, nextPassword));
  }

  function handleAddSecondaryPassword() {
    setSecondaryPasswords((current) => addSecondaryPassword(current));
  }

  return (
    <MobileAppLayout>
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit} sx={{ pt: 0.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Secondary password editor
            </Typography>
            <Typography variant="h2" component="h1">
              {isNew ? 'New item' : 'Edit item'}
            </Typography>
          </Stack>
          <Button type="submit" variant="contained" sx={{ minWidth: 80, minHeight: 42 }}>
            Save
          </Button>
        </Stack>

        <Stack spacing={2.25}>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Title
            </Typography>
            <TextField fullWidth defaultValue={isNew ? '' : existingItem.title} name="title" />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              URL
            </Typography>
            <TextField fullWidth defaultValue={isNew ? '' : existingItem.url} name="url" />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Username
            </Typography>
            <TextField fullWidth defaultValue={isNew ? '' : existingItem.username} name="username" />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Main password
            </Typography>
            <TextField
              fullWidth
              name="primaryPassword"
              type="password"
              placeholder={Array.from({ length: 12 }, () => '\u2022').join('')}
              value={primaryPassword}
              onChange={(event) => setPrimaryPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <Button
                    type="button"
                    onClick={() => setPrimaryPassword(generatePassword())}
                    variant="contained"
                    sx={{
                      mr: -1.25,
                      minWidth: 108,
                      minHeight: 36,
                      bgcolor: appTokens.colors.mutedSurface,
                      color: 'primary.main',
                      '&:hover': { bgcolor: appTokens.colors.activeSurface },
                    }}
                  >
                    Generate
                  </Button>
                ),
              }}
            />
          </Stack>
        </Stack>

        <Typography variant="h3" component="h2" sx={{ pt: 2 }}>
          Secondary passwords
        </Typography>
        <Stack spacing={1.5}>
          {secondaryPasswords.map((password, index) => (
            <SecondaryPasswordEditor
              key={password.id}
              password={password}
              canMoveDown={index < secondaryPasswords.length - 1}
              canMoveUp={index > 0}
              onChange={updateSecondary}
              onDelete={() => setSecondaryPasswords((current) => deleteSecondaryPassword(current, password.id))}
              onMoveDown={() => setSecondaryPasswords((current) => moveSecondaryPassword(current, password.id, 'down'))}
              onMoveUp={() => setSecondaryPasswords((current) => moveSecondaryPassword(current, password.id, 'up'))}
            />
          ))}
        </Stack>
        <Button
          type="button"
          startIcon={<AddOutlinedIcon />}
          onClick={handleAddSecondaryPassword}
          variant="contained"
          fullWidth
          sx={{
            justifyContent: 'flex-start',
            minHeight: 44,
            bgcolor: appTokens.colors.activeSurface,
            color: 'primary.main',
            '&:hover': { bgcolor: appTokens.colors.activeSurface },
          }}
        >
          Add secondary password
        </Button>
      </Stack>
    </MobileAppLayout>
  );
}
