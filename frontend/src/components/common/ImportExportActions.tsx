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
import { useRef, useState } from 'react';

import { recordClientAuditEvent, type ClientAuditAction } from '../../features/audit/clientAudit';
import { recordAuditEvent } from '../../features/audit/auditApi';
import { createCsvExport, createCsvExportBlob, createExportFilename } from '../../features/import-export/exportVault';
import { parseImportedVaultFile, type ImportedVaultFile } from '../../features/import-export/importVault';
import { useNotification } from '../../features/ui/notificationStore';
import { createItem, listItems } from '../../features/vault/itemsApi';
import { useVaultKey } from '../../features/vault/vaultKeyStore';
import { encryptItemSecret } from '../../lib/vaultCrypto';

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
  const [importDraft, setImportDraft] = useState<ImportedVaultFile | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { notify } = useNotification();
  const { vaultKey } = useVaultKey();

  function openPrompt(prompt: ActivePrompt) {
    recordClientAuditEvent(prompt.action, { screen });
    setImportDraft(null);
    setActivePrompt(prompt);
  }

  function closePrompt() {
    setImportDraft(null);
    setActivePrompt(null);
  }

  function handleImportClick() {
    recordClientAuditEvent('import.opened', { screen });
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const parsedImport = parseImportedVaultFile(await file.text());
      setImportDraft(parsedImport);
      setActivePrompt({
        action: 'import.opened',
        title: 'Import vault data',
        message: `${parsedImport.items.length} item(s) are ready to import.`,
        severity: 'info',
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Import file is invalid.', 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function confirmImport() {
    if (!importDraft) {
      return;
    }
    if (!vaultKey) {
      notify('Vault is locked. Unlock the vault before importing.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      for (const item of importDraft.items) {
        await createItem({
          encryptedSecret: encryptItemSecret(vaultKey, {
            customFields: item.customFields,
            primaryPassword: item.primaryPassword,
            secureNote: item.secureNote,
            secondaryPasswords: item.secondaryPasswords.map((password) => ({
              id: password.id,
              note: password.note,
              password: password.value,
              sortOrder: password.sortOrder,
            })),
            totpSecret: item.totpSecret,
          }),
          favorite: item.favorite,
          status: item.status,
          title: item.title,
          url: item.url || null,
          username: item.username || null,
        });
      }
      notify('Import completed.', 'success');
      setImportDraft(null);
      setActivePrompt(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Import failed.', 'error');
    } finally {
      setIsImporting(false);
    }
  }

  async function confirmExport() {
    if (!vaultKey) {
      notify('Vault is locked. Unlock the vault before exporting.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const response = await listItems({ status: 'all', pageSize: 100 });
      const exportedAt = new Date().toISOString();
      const csv = createCsvExport(response.items, vaultKey);
      const url = URL.createObjectURL(createCsvExportBlob(csv));
      const link = document.createElement('a');
      link.href = url;
      link.download = createExportFilename(exportedAt);
      link.click();
      URL.revokeObjectURL(url);
      void recordAuditEvent({ action: 'export.opened', metadata: { screen } }).catch(() => undefined);
      notify('Export completed.', 'success');
      setActivePrompt(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Export failed.', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button
          startIcon={<FileUploadOutlinedIcon />}
          variant="outlined"
          onClick={handleImportClick}
        >
          Import
        </Button>
        <input
          ref={fileInputRef}
          accept="text/csv,application/json,.csv,.json"
          hidden
          type="file"
          onChange={(event) => handleImportFile(event.target.files?.[0])}
        />
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
          {importDraft ? (
            <Button disabled={isImporting} onClick={confirmImport}>
              {isImporting ? 'Importing' : 'Import'}
            </Button>
          ) : null}
          {activePrompt?.action === 'export.opened' ? (
            <Button disabled={isExporting} onClick={confirmExport}>
              {isExporting ? 'Exporting' : 'Export'}
            </Button>
          ) : null}
          <Button onClick={closePrompt}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
