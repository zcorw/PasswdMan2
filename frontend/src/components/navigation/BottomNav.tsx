import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import PasswordOutlinedIcon from '@mui/icons-material/PasswordOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { routes } from '../../routePaths';
import { appTokens } from '../../theme';

const navItems = [
  { label: 'Vault', path: routes.vault, icon: <KeyOutlinedIcon fontSize="small" /> },
  { label: 'Gen', path: routes.generator, icon: <PasswordOutlinedIcon fontSize="small" /> },
  { label: 'Log', path: routes.auditLog, icon: <HistoryOutlinedIcon fontSize="small" /> },
  { label: 'Settings', path: routes.settings, icon: <SettingsOutlinedIcon fontSize="small" /> },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const value =
    navItems.find((item) => location.pathname === item.path || location.pathname.startsWith('/items'))?.path ??
    routes.vault;

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: appTokens.layout.bottomNavHeight,
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, nextValue: string) => navigate(nextValue)}
        sx={{
          height: '100%',
          px: 2.5,
          alignItems: 'center',
          '& .MuiBottomNavigationAction-root': {
            borderRadius: appTokens.radii.nav,
            color: 'text.secondary',
            maxWidth: 72,
            minWidth: 72,
            height: 48,
            p: 0,
          },
          '& .Mui-selected': {
            color: appTokens.colors.primary,
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            bgcolor: appTokens.colors.activeSurface,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: 11,
            lineHeight: '14px',
          },
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={
              <Box component="span" sx={{ fontSize: 11, lineHeight: '14px' }}>
                {item.label}
              </Box>
            }
            value={item.path}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
