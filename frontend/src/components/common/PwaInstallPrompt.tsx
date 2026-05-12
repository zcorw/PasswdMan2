import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { Button, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  return (
    <Snackbar
      action={
        <Button color="inherit" startIcon={<DownloadOutlinedIcon />} onClick={handleInstall}>
          Install
        </Button>
      }
      message="Install PasswdMan2"
      onClose={() => setInstallPrompt(null)}
      open={Boolean(installPrompt)}
    />
  );
}
