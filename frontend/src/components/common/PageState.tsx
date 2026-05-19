import { Button, Stack, Typography } from '@mui/material';

interface PageStateProps {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  tone?: 'error' | 'muted';
}

export function PageState({ actionLabel, message, onAction, tone = 'muted' }: PageStateProps) {
  return (
    <Stack spacing={1} sx={{ pt: 0.5 }}>
      <Typography variant="body2" color={tone === 'error' ? 'error' : 'text.secondary'}>
        {message}
      </Typography>
      {actionLabel && onAction ? (
        <Button variant="outlined" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  );
}

