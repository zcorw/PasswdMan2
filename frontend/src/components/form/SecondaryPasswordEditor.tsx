import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import { IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';

import { appTokens } from '../../theme';
import type { SecondaryPassword } from '../../types/vault';

interface SecondaryPasswordEditorProps {
  password: SecondaryPassword;
  canMoveDown: boolean;
  canMoveUp: boolean;
  onChange: (password: SecondaryPassword) => void;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
}

export function SecondaryPasswordEditor({
  password,
  canMoveDown,
  canMoveUp,
  onChange,
  onDelete,
  onMoveDown,
  onMoveUp,
}: SecondaryPasswordEditorProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: appTokens.colors.mutedSurface,
        borderColor: 'divider',
        borderRadius: appTokens.radii.card,
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Note
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={password.note}
            onChange={(event) => onChange({ ...password, note: event.target.value })}
          />
        </Stack>
        <Stack spacing={0.75} sx={{ width: 92 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Value
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="password"
            value={password.value}
            onChange={(event) => onChange({ ...password, value: event.target.value })}
          />
        </Stack>
        <Stack spacing={0.5} sx={{ pb: 0.25 }}>
          <Tooltip title="Move secondary password up">
            <span>
              <IconButton
                aria-label="Move secondary password up"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                size="small"
              >
                <KeyboardArrowUpOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move secondary password down">
            <span>
              <IconButton
                aria-label="Move secondary password down"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                size="small"
              >
                <KeyboardArrowDownOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Tooltip title="Delete secondary password">
          <IconButton aria-label="Delete secondary password" color="error" onClick={onDelete} sx={{ mb: 0.25 }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
