import { Box, Stack } from '@mui/material';
import type { ReactNode } from 'react';

import { appTokens } from '../theme';
import { BottomNav } from '../components/navigation/BottomNav';

interface MobileAppLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MobileAppLayout({ children, showBottomNav = false }: MobileAppLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: { xs: 'background.paper', sm: appTokens.colors.mutedSurface },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Stack
        sx={{
          width: '100%',
          maxWidth: appTokens.layout.mobileFrameWidth,
          minHeight: '100vh',
          bgcolor: 'background.paper',
          borderColor: { xs: 'transparent', sm: appTokens.colors.frameBorder },
          borderStyle: 'solid',
          borderWidth: { xs: 0, sm: 1 },
          borderRadius: { xs: 0, sm: `${appTokens.radii.phone}px` },
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          component="header"
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexShrink: 0,
            height: 64,
            px: appTokens.layout.pageX,
          }}
        >
          <Box
            component="img"
            src="/icons/icon.svg"
            alt="PasswdMan2"
            sx={{
              display: 'block',
              height: 36,
              width: 36,
            }}
          />
        </Box>
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: appTokens.layout.pageX,
            pb: showBottomNav ? `${appTokens.layout.bottomNavHeight + 16}px` : 4,
          }}
        >
          {children}
        </Box>
        {showBottomNav ? <BottomNav /> : null}
      </Stack>
    </Box>
  );
}
