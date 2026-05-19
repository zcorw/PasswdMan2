import { AppSnackbar } from './components/common/AppSnackbar';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { AuthProvider } from './features/auth/authStore';
import { NotificationProvider } from './features/ui/notificationStore';
import { VaultKeyProvider } from './features/vault/vaultKeyStore';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <VaultKeyProvider>
          <AppRoutes />
          <PwaInstallPrompt />
          <AppSnackbar />
        </VaultKeyProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
