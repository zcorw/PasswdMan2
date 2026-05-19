import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button, Chip, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IconActionButton } from '../components/common/IconActionButton';
import { PageState } from '../components/common/PageState';
import { FieldActionRow } from '../components/data-display/FieldActionRow';
import { SecondaryPasswordRow } from '../components/data-display/SecondaryPasswordRow';
import { recordAuditEvent } from '../features/audit/auditApi';
import { useNotification } from '../features/ui/notificationStore';
import { deleteItem, getItem } from '../features/vault/itemsApi';
import { mapApiItemToVaultItem } from '../features/vault/itemMapper';
import { useVaultKey } from '../features/vault/vaultKeyStore';
import { MobileAppLayout } from '../layouts/MobileAppLayout';
import { routes } from '../routePaths';
import { appTokens } from '../theme';
import type { VaultItem } from '../types/vault';
import { maskSecret, normalizeExternalUrl } from '../utils/vault';

export function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { vaultKey } = useVaultKey();
  const [item, setItem] = useState<VaultItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrimaryVisible, setIsPrimaryVisible] = useState(false);
  const [visibleSecondaryIds, setVisibleSecondaryIds] = useState<Set<string>>(() => new Set());
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadItem() {
      if (!itemId) {
        setError('Item not found.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        if (!vaultKey) {
          throw new Error('Vault is locked. Unlock the vault before viewing this item.');
        }
        const response = await getItem(itemId);
        const mappedItem = mapApiItemToVaultItem(response.item, vaultKey);
        if (!ignore) {
          setItem(mappedItem);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load item.');
          setItem(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadItem();

    return () => {
      ignore = true;
    };
  }, [itemId, vaultKey]);

  async function copyValue(value: string, audit?: { action: 'password.primary.copied' | 'password.secondary.copied'; slot: string }) {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard is unavailable.');
      }
      await navigator.clipboard.writeText(value);
      notify('Copied.', 'success');
      if (audit && item) {
        void sendPasswordAuditEvent(audit.action, audit.slot);
      }
    } catch (copyError) {
      notify(copyError instanceof Error ? copyError.message : 'Copy failed.', 'error');
    }
  }

  function openUrl() {
    if (item) {
      window.open(normalizeExternalUrl(item.url), '_blank', 'noopener,noreferrer');
    }
  }

  function togglePrimaryVisibility() {
    setIsPrimaryVisible((current) => {
      const next = !current;
      if (next) {
        void sendPasswordAuditEvent('password.primary.viewed', 'primary');
      }
      return next;
    });
  }

  function toggleSecondaryVisibility(passwordId: string) {
    setVisibleSecondaryIds((current) => {
      const next = new Set(current);
      if (next.has(passwordId)) {
        next.delete(passwordId);
      } else {
        next.add(passwordId);
        void sendPasswordAuditEvent('password.secondary.viewed', 'secondary');
      }
      return next;
    });
  }

  async function handleDeleteItem() {
    if (!item || !window.confirm('Delete this item?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteItem(item.id);
      navigate(routes.vault);
    } catch (deleteError) {
      notify(deleteError instanceof Error ? deleteError.message : 'Delete failed.', 'error');
    } finally {
      setIsDeleting(false);
      setMoreAnchor(null);
    }
  }

  function sendPasswordAuditEvent(action: 'password.primary.viewed' | 'password.primary.copied' | 'password.secondary.viewed' | 'password.secondary.copied', slot: string) {
    if (!item) {
      return Promise.resolve();
    }

    return recordAuditEvent({
      action,
      metadata: { slot },
      resourceId: item.id,
      resourceType: 'password_item',
    }).catch(() => undefined);
  }

  if (isLoading) {
    return (
      <MobileAppLayout showBottomNav>
        <PageState message="Loading item." />
      </MobileAppLayout>
    );
  }

  if (error || !item) {
    return (
      <MobileAppLayout showBottomNav>
        <PageState message={error || 'Item not found.'} tone="error" />
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout showBottomNav>
      <Stack spacing={2.25} sx={{ pt: 0.5 }}>
        <Button
          variant="text"
          onClick={() => navigate(routes.vault)}
          sx={{ alignSelf: 'flex-start', minHeight: 0, p: 0, color: 'primary.main' }}
        >
          {'< Vault'}
        </Button>

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h2" component="h1" noWrap>
            {item.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconActionButton label="Edit item" onClick={() => navigate(`/items/${item.id}/edit`)}>
              <EditOutlinedIcon fontSize="small" />
            </IconActionButton>
            <IconActionButton label="More actions" onClick={(event) => setMoreAnchor(event.currentTarget)}>
              <MoreHorizOutlinedIcon fontSize="small" />
            </IconActionButton>
          </Stack>
        </Stack>
        <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
          <MenuItem disabled={isDeleting} onClick={handleDeleteItem}>
            Delete
          </MenuItem>
        </Menu>

        <Stack direction="row" spacing={1}>
          <Chip label={item.category} sx={{ bgcolor: appTokens.colors.activeSurface, color: 'primary.main' }} />
          <Chip
            label={`${item.secondaryPasswords.length} secondary`}
            sx={{ bgcolor: appTokens.colors.activeSurface, color: 'primary.main' }}
          />
        </Stack>

        <FieldActionRow
          label="URL"
          value={item.url.replace(/^https?:\/\//i, '')}
          actions={
            <IconActionButton label="Open URL in new window" color="secondary" onClick={openUrl}>
              <OpenInNewOutlinedIcon fontSize="small" />
            </IconActionButton>
          }
        />
        <FieldActionRow
          label="Username"
          value={item.username}
          actions={
            <IconActionButton label="Copy username" color="primary" onClick={() => copyValue(item.username)}>
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconActionButton>
          }
        />
        <FieldActionRow
          label="Main password"
          value={isPrimaryVisible ? item.primaryPassword : maskSecret(item.primaryPassword)}
          actions={
            <>
              <IconActionButton label="Show main password" color="secondary" onClick={togglePrimaryVisibility}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconActionButton>
              <IconActionButton
                label="Copy main password"
                color="primary"
                onClick={() => copyValue(item.primaryPassword, { action: 'password.primary.copied', slot: 'primary' })}
              >
                <ContentCopyOutlinedIcon fontSize="small" />
              </IconActionButton>
            </>
          }
        />

        <Typography variant="h3" component="h2" sx={{ pt: 1.75 }}>
          Secondary passwords
        </Typography>
        <Stack spacing={1.5}>
          {item.secondaryPasswords.map((secondary) => (
            <SecondaryPasswordRow
              key={secondary.id}
              isVisible={visibleSecondaryIds.has(secondary.id)}
              password={secondary}
              onCopy={(value) => copyValue(value, { action: 'password.secondary.copied', slot: 'secondary' })}
              onToggleVisibility={() => toggleSecondaryVisibility(secondary.id)}
            />
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Each secondary password has its own copy button.
        </Typography>
      </Stack>
    </MobileAppLayout>
  );
}
