import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import { Button, Checkbox, FormControlLabel, Slider, Stack, TextField, Typography } from '@mui/material';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { SecondaryPasswordEditor } from '../components/form/SecondaryPasswordEditor';
import {
  defaultPasswordGeneratorOptions,
  generatePassword,
  type PasswordGeneratorOptions,
} from '../features/password-generator/passwordGenerator';
import { encryptItemSecret } from '../lib/vaultCrypto';
import { createItem, getItem, updateItem } from '../features/vault/itemsApi';
import { mapApiItemToVaultItem } from '../features/vault/itemMapper';
import { hasItemFormErrors, validateItemForm, type ItemFormErrors } from '../features/vault/itemValidation';
import {
  addSecondaryPassword,
  deleteSecondaryPassword,
  moveSecondaryPassword,
  normalizeSecondaryPasswordOrder,
  updateSecondaryPassword,
} from '../features/vault/secondaryPasswords';
import { useVaultKey } from '../features/vault/vaultKeyStore';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';
import { appTokens } from '../theme';
import type { SecondaryPassword, VaultItem } from '../types/vault';

type PasswordOptionKey = 'useLowercase' | 'useUppercase' | 'useNumbers' | 'useSymbols' | 'excludeAmbiguous';

const passwordOptionLabels: Array<{ key: PasswordOptionKey; label: string }> = [
  { key: 'useLowercase', label: 'Lowercase' },
  { key: 'useUppercase', label: 'Uppercase' },
  { key: 'useNumbers', label: 'Numbers' },
  { key: 'useSymbols', label: 'Symbols' },
  { key: 'excludeAmbiguous', label: 'Exclude ambiguous' },
];

export function ItemFormPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { vaultKey } = useVaultKey();
  const [existingItem, setExistingItem] = useState<VaultItem | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(itemId));
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const isNew = !itemId;
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [primaryPassword, setPrimaryPassword] = useState('');
  const [secondaryPasswords, setSecondaryPasswords] = useState<SecondaryPassword[]>([]);
  const [formErrors, setFormErrors] = useState<ItemFormErrors>({});
  const [passwordOptions, setPasswordOptions] = useState<PasswordGeneratorOptions>(defaultPasswordGeneratorOptions);
  const [passwordOptionsExpanded, setPasswordOptionsExpanded] = useState(false);

  const selectedSetCount = useMemo(
    () =>
      [
        passwordOptions.useLowercase,
        passwordOptions.useUppercase,
        passwordOptions.useNumbers,
        passwordOptions.useSymbols,
      ].filter(Boolean).length,
    [passwordOptions],
  );

  useEffect(() => {
    let ignore = false;

    async function loadExistingItem() {
      if (!itemId) {
        setExistingItem(null);
        setTitle('');
        setUrl('');
        setUsername('');
        setPrimaryPassword('');
        setSecondaryPasswords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');
      try {
        if (!vaultKey) {
          throw new Error('Vault is locked. Unlock the vault before editing this item.');
        }
        const response = await getItem(itemId);
        const mappedItem = mapApiItemToVaultItem(response.item, vaultKey);
        if (!ignore) {
          setExistingItem(mappedItem);
          setTitle(mappedItem.title);
          setUrl(mappedItem.url);
          setUsername(mappedItem.username);
          setPrimaryPassword(mappedItem.primaryPassword);
          setSecondaryPasswords(normalizeSecondaryPasswordOrder(mappedItem.secondaryPasswords));
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load item.');
          setExistingItem(null);
          setSecondaryPasswords([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadExistingItem();

    return () => {
      ignore = true;
    };
  }, [itemId, vaultKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateItemForm({ primaryPassword, secondaryPasswords, title, url, username });
    setFormErrors(nextErrors);
    setSaveError('');

    if (hasItemFormErrors(nextErrors)) {
      return;
    }

    if (!vaultKey) {
      setSaveError('Vault is locked. Unlock the vault before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const encryptedSecret = encryptItemSecret(vaultKey, {
        primaryPassword,
        secondaryPasswords: secondaryPasswords.map((password) => ({
          id: password.id,
          note: password.note,
          password: password.value,
          sortOrder: password.sortOrder,
        })),
      });
      const payload = {
        encryptedSecret,
        title: title.trim(),
        url: url.trim() || null,
        username: username.trim() || null,
      };
      const response = isNew ? await createItem(payload) : await updateItem(itemId as string, payload);
      navigate(`/items/${response.item.id}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save item.');
    } finally {
      setIsSaving(false);
    }
  }

  function updateSecondary(nextPassword: SecondaryPassword) {
    setSecondaryPasswords((current) => updateSecondaryPassword(current, nextPassword));
  }

  function handleAddSecondaryPassword() {
    if (secondaryPasswords.length >= 20) {
      setFormErrors((current) => ({ ...current, secondaryPasswords: 'Use 20 or fewer secondary passwords.' }));
      return;
    }
    setSecondaryPasswords((current) => addSecondaryPassword(current));
  }

  function handleGeneratePrimaryPassword(nextOptions = passwordOptions) {
    try {
      setPrimaryPassword(generatePassword(nextOptions));
      setFormErrors((current) => ({ ...current, primaryPassword: undefined }));
    } catch (error) {
      setFormErrors((current) => ({
        ...current,
        primaryPassword: error instanceof Error ? error.message : 'Unable to generate password.',
      }));
    }
  }

  function handlePasswordLengthChange(_: Event, nextLength: number | number[]) {
    const length = Array.isArray(nextLength) ? nextLength[0] : nextLength;
    setPasswordOptions((current) => ({ ...current, length }));
  }

  function updatePasswordOption(key: PasswordOptionKey, value: boolean) {
    setPasswordOptions((current) => ({ ...current, [key]: value }));
  }

  return (
    <MobileAppLayout>
      {isLoading ? (
        <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
          Loading item.
        </Typography>
      ) : null}
      {loadError ? (
        <Typography variant="body2" color="error" sx={{ pt: 0.5 }}>
          {loadError}
        </Typography>
      ) : null}
      <Stack component="form" noValidate spacing={2.5} onSubmit={handleSubmit} sx={{ pt: 0.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.75}>
            <Typography variant="h2" component="h1">
              {isNew ? 'New item' : 'Edit item'}
            </Typography>
          </Stack>
          <Button disabled={isSaving} type="submit" variant="contained" sx={{ minWidth: 80, minHeight: 42 }}>
            {isSaving ? 'Saving' : 'Save'}
          </Button>
        </Stack>

        <Stack spacing={2.25}>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Title
            </Typography>
            <TextField
              error={Boolean(formErrors.title)}
              fullWidth
              helperText={formErrors.title}
              name="title"
              onChange={(event) => {
                setTitle(event.target.value);
                setFormErrors((current) => ({ ...current, title: undefined }));
              }}
              value={title}
            />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              URL
            </Typography>
            <TextField
              error={Boolean(formErrors.url)}
              fullWidth
              helperText={formErrors.url}
              name="url"
              onChange={(event) => {
                setUrl(event.target.value);
                setFormErrors((current) => ({ ...current, url: undefined }));
              }}
              value={url}
            />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Username
            </Typography>
            <TextField
              error={Boolean(formErrors.username)}
              fullWidth
              helperText={formErrors.username}
              name="username"
              onChange={(event) => {
                setUsername(event.target.value);
                setFormErrors((current) => ({ ...current, username: undefined }));
              }}
              value={username}
            />
          </Stack>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Main password
            </Typography>
            <TextField
              fullWidth
              error={Boolean(formErrors.primaryPassword)}
              helperText={formErrors.primaryPassword}
              name="primaryPassword"
              type="password"
              placeholder={Array.from({ length: 12 }, () => '\u2022').join('')}
              value={primaryPassword}
              onChange={(event) => {
                setPrimaryPassword(event.target.value);
                setFormErrors((current) => ({ ...current, primaryPassword: undefined }));
              }}
              InputProps={{
                endAdornment: (
                  <Button
                    type="button"
                    onClick={() => handleGeneratePrimaryPassword()}
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
            <Button
              type="button"
              variant="text"
              endIcon={
                <ExpandMoreOutlinedIcon
                  sx={{
                    transform: passwordOptionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 160ms ease',
                  }}
                />
              }
              onClick={() => setPasswordOptionsExpanded((expanded) => !expanded)}
              sx={{ alignSelf: 'flex-start', px: 0 }}
            >
              Generator settings
            </Button>
            {passwordOptionsExpanded ? (
              <Stack spacing={1.25}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Length
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {passwordOptions.length}
                    </Typography>
                  </Stack>
                  <Slider
                    aria-label="Main password length"
                    min={6}
                    max={64}
                    value={passwordOptions.length}
                    onChange={handlePasswordLengthChange}
                  />
                </Stack>
                <Stack spacing={0.25}>
                  {passwordOptionLabels.map((option) => (
                    <FormControlLabel
                      key={option.key}
                      control={
                        <Checkbox
                          checked={passwordOptions[option.key]}
                          disabled={
                            option.key !== 'excludeAmbiguous' &&
                            selectedSetCount === 1 &&
                            passwordOptions[option.key]
                          }
                          onChange={(event) => updatePasswordOption(option.key, event.target.checked)}
                        />
                      }
                      label={<Typography variant="body1">{option.label}</Typography>}
                    />
                  ))}
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Stack>

        <Typography variant="h3" component="h2" sx={{ pt: 2 }}>
          Secondary passwords
        </Typography>
        {formErrors.secondaryPasswords ? (
          <Typography variant="body2" color="error">
            {formErrors.secondaryPasswords}
          </Typography>
        ) : null}
        <Stack spacing={1.5}>
          {secondaryPasswords.map((password, index) => (
            <SecondaryPasswordEditor
              key={password.id}
              password={password}
              canMoveDown={index < secondaryPasswords.length - 1}
              canMoveUp={index > 0}
              onChange={(nextPassword) => {
                updateSecondary(nextPassword);
                setFormErrors((current) => ({ ...current, secondaryPasswords: undefined }));
              }}
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
        {saveError ? (
          <Typography variant="body2" color="error">
            {saveError}
          </Typography>
        ) : null}
      </Stack>
    </MobileAppLayout>
  );
}
