import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { recordClientAuditEvent, type ClientAuditAction } from '../../features/audit/clientAudit';

interface ImportExportActionsProps {
  screen: 'vault' | 'settings';
}

interface ActivePrompt {
  action: ClientAuditAction;
  title: string;
  message: string;
  severity: 'info' | 'warning';
}

export function ImportExportActions({ screen }: ImportExportActionsProps) {
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);

  function openPrompt(prompt: ActivePrompt) {
    recordClientAuditEvent(prompt.action, { screen });
    setActivePrompt(prompt);
  }

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button
          startIcon={<FileUploadOutlinedIcon />}
          variant="outlined"
          onClick={() =>
            openPrompt({
              action: 'import.opened',
              title: 'Import vault data',
              message: 'Import templates and field mapping will be confirmed later.',
              severity: 'info',
            })
          }
        >
          Import
        </Button>
        <Button
          startIcon={<FileDownloadOutlinedIcon />}
          variant="outlined"
          onClick={() =>
            openPrompt({
              action: 'export.opened',
              title: 'Export vault data',
              message: 'Exports may contain sensitive encrypted vault data. Store exported files carefully.',
              severity: 'warning',
            })
          }
        >
          Export
        </Button>
      </Stack>

      <Dialog open={Boolean(activePrompt)} onClose={() => setActivePrompt(null)} fullWidth maxWidth="xs">
        <DialogTitle>{activePrompt?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Alert severity={activePrompt?.severity ?? 'info'}>{activePrompt?.message}</Alert>
            <Typography variant="body2" color="text.secondary">
              This entry is audit logged without passwords, secrets, tokens, or key material.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivePrompt(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
