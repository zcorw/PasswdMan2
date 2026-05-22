import { describe, expect, it } from 'vitest';

import bottomNavSource from './components/navigation/BottomNav.tsx?raw';
import vaultPageSource from './pages/VaultPage.tsx?raw';

describe('mobile fixed controls', () => {
  it('keeps the bottom navigation fixed to the viewport bottom', () => {
    expect(bottomNavSource).toContain("position: 'fixed'");
    expect(bottomNavSource).toContain('bottom: 0');
  });

  it('keeps the vault create button fixed above the bottom navigation', () => {
    expect(vaultPageSource).toContain("position: 'fixed'");
    expect(vaultPageSource).toContain('bottom: appTokens.layout.bottomNavHeight + 24');
  });
});
