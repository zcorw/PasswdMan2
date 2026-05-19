import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import { Chip, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { PageState } from '../components/common/PageState';
import { listAuditLogs, type AuditLogEntry } from '../features/audit/auditApi';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { appTokens } from '../theme';

const actionLabels: Record<string, string> = {
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'item.created': 'Created item',
  'item.updated': 'Updated item',
  'item.deleted': 'Deleted item',
  'password.primary.viewed': 'Viewed main password',
  'password.primary.copied': 'Copied main password',
  'password.secondary.viewed': 'Viewed secondary password',
  'password.secondary.copied': 'Copied secondary password',
  'import.opened': 'Opened import',
  'export.opened': 'Opened export',
};

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadLogs() {
      setIsLoading(true);
      setError('');
      try {
        const response = await listAuditLogs();
        if (!ignore) {
          setLogs(response.logs);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load audit logs.');
          setLogs([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadLogs();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <Stack spacing={0.75}>
          <Typography variant="h2" component="h1">
            Log
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {isLoading ? <PageState message="Loading audit logs." /> : null}
          {error ? <PageState message={error} tone="error" /> : null}
          {!isLoading && !error && logs.length === 0 ? (
            <PageState message="No audit logs yet." />
          ) : null}
          {logs.map((log) => (
            <Paper
              key={log.id}
              variant="outlined"
              sx={{
                borderColor: 'divider',
                borderRadius: appTokens.radii.card,
                p: 2,
                bgcolor: appTokens.colors.mutedSurface,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <SecurityOutlinedIcon color="primary" fontSize="small" />
                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography variant="body1" fontWeight={700} noWrap>
                      {actionLabels[log.action] ?? log.action}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {log.createdAt}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={log.resourceType ?? 'event'} size="small" />
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <Typography key={key} variant="body2" color="text.secondary" noWrap>
                        {key}: {value}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </MobileAppLayout>
  );
}
