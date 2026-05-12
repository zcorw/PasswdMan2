import { describe, expect, it } from 'vitest';

import offlinePageSource from '../public/offline.html?raw';
import serviceWorkerSource from '../public/sw.js?raw';

describe('PWA assets', () => {
  it('does not cache API requests in the service worker', () => {
    expect(serviceWorkerSource).toContain("requestUrl.pathname.startsWith('/api/')");
    expect(serviceWorkerSource).toContain('return;');
  });

  it('caches app shell and falls back to the offline page for navigation', () => {
    expect(serviceWorkerSource).toContain('APP_SHELL');
    expect(serviceWorkerSource).toContain("caches.match('/offline.html')");
  });

  it('explains that sensitive API data is not cached on the offline page', () => {
    expect(offlinePageSource).toContain('sensitive data are not cached');
  });
});
