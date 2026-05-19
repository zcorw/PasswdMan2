import { Alert, Snackbar } from '@mui/material';

import { useNotification } from '../../features/ui/notificationStore';

export function AppSnackbar() {
  const { clearNotification, current } = useNotification();

  return (
    <Snackbar
      autoHideDuration={2600}
      key={current?.id}
      onClose={clearNotification}
      open={Boolean(current)}
    >
      <Alert severity={current?.severity ?? 'info'} variant="filled">
        {current?.message}
      </Alert>
    </Snackbar>
  );
}

