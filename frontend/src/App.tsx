import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <>
      <AppRoutes />
      <PwaInstallPrompt />
    </>
  );
}
