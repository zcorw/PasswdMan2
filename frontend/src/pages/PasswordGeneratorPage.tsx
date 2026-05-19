import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

import {
  defaultPasswordGeneratorOptions,
  generatePassword,
  type PasswordGeneratorOptions,
} from '../features/password-generator/passwordGenerator';
import { useNotification } from '../features/ui/notificationStore';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { appTokens } from '../theme';

type PasswordOptionKey = 'useLowercase' | 'useUppercase' | 'useNumbers' | 'useSymbols' | 'excludeAmbiguous';

const optionLabels: Array<{ key: PasswordOptionKey; label: string }> = [
  { key: 'useLowercase', label: 'Lowercase' },
  { key: 'useUppercase', label: 'Uppercase' },
  { key: 'useNumbers', label: 'Numbers' },
  { key: 'useSymbols', label: 'Symbols' },
  { key: 'excludeAmbiguous', label: 'Exclude ambiguous' },
];

export function PasswordGeneratorPage() {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(defaultPasswordGeneratorOptions);
  const [generatedPassword, setGeneratedPassword] = useState(() => generatePassword(defaultPasswordGeneratorOptions));
  const { notify } = useNotification();

  const selectedSetCount = useMemo(
    () =>
      [options.useLowercase, options.useUppercase, options.useNumbers, options.useSymbols].filter(Boolean).length,
    [options],
  );

  function updateOption(key: PasswordOptionKey, value: boolean) {
    setOptions((currentOptions) => ({ ...currentOptions, [key]: value }));
  }

  function handleGenerate(nextOptions = options) {
    try {
      setGeneratedPassword(generatePassword(nextOptions));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to generate password.', 'error');
    }
  }

  function handleLengthChange(_: Event, nextLength: number | number[]) {
    const length = Array.isArray(nextLength) ? nextLength[0] : nextLength;
    const nextOptions = { ...options, length };
    setOptions(nextOptions);
    handleGenerate(nextOptions);
  }

  async function handleCopy() {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard is unavailable.');
      }
      await navigator.clipboard.writeText(generatedPassword);
      notify('Password copied.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Copy failed.', 'error');
    }
  }

  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <Stack spacing={0.75}>
          <Typography variant="h2" component="h1">
            Generator
          </Typography>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            borderColor: 'divider',
            borderRadius: appTokens.radii.card,
            p: 2,
            bgcolor: appTokens.colors.mutedSurface,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Generated password
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField fullWidth value={generatedPassword} InputProps={{ readOnly: true }} />
              <Tooltip title="Generate password">
                <IconButton aria-label="Generate password" onClick={() => handleGenerate()}>
                  <RefreshOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy generated password">
                <IconButton aria-label="Copy generated password" color="primary" onClick={handleCopy}>
                  <ContentCopyOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Length
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {options.length}
            </Typography>
          </Stack>
          <Slider
            aria-label="Password length"
            min={6}
            max={64}
            value={options.length}
            onChange={handleLengthChange}
          />
        </Stack>

        <Stack spacing={0.5}>
          {optionLabels.map((option) => (
            <FormControlLabel
              key={option.key}
              control={
                <Checkbox
                  checked={options[option.key]}
                  disabled={
                    option.key !== 'excludeAmbiguous' &&
                    selectedSetCount === 1 &&
                    options[option.key]
                  }
                  onChange={(event) => updateOption(option.key, event.target.checked)}
                />
              }
              label={<Typography variant="body1">{option.label}</Typography>}
            />
          ))}
        </Stack>

        <Button variant="contained" fullWidth startIcon={<RefreshOutlinedIcon />} onClick={() => handleGenerate()}>
          Generate
        </Button>
      </Stack>
    </MobileAppLayout>
  );
}
