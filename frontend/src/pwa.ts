export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    void unregisterDevelopmentServiceWorkers();
    return;
  }

  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Service worker registration failed', error);
      });
    });
  }
}

async function unregisterDevelopmentServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('passwdman2-'))
        .map((cacheName) => caches.delete(cacheName)),
    );
  }
}
