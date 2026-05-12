import { describe, expect, it } from 'vitest';

import detailPageSource from './ItemDetailPage.tsx?raw';
import secondaryRowSource from '../components/data-display/SecondaryPasswordRow.tsx?raw';

describe('ItemDetailPage icon action rules', () => {
  it('does not render visible text buttons for field actions', () => {
    expect(detailPageSource).not.toMatch(/>\s*(Show|Copy|Edit)\s*</);
    expect(secondaryRowSource).not.toMatch(/>\s*(Show|Copy|Edit)\s*</);
  });

  it('keeps URL, username, main password, and secondary password actions icon based', () => {
    expect(detailPageSource).toContain('OpenInNewOutlinedIcon');
    expect(detailPageSource).toContain('ContentCopyOutlinedIcon');
    expect(detailPageSource).toContain('VisibilityOutlinedIcon');
    expect(secondaryRowSource).toContain('ContentCopyOutlinedIcon');
    expect(secondaryRowSource).toContain('VisibilityOutlinedIcon');
  });
});
