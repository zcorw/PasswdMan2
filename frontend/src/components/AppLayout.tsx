import AddIcon from '@mui/icons-material/Add';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PasswordIcon from '@mui/icons-material/Password';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  Paper,
} from '@mui/material';
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { routes } from '../routes';

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentValue = location.pathname.startsWith('/items') ? routes.vault : location.pathname;

  return (
    <Box className="mobile-shell">
      <Container maxWidth="xs" sx={{ px: 2, pb: 11, pt: 2 }}>
        {children}
      </Container>
      <Paper className="bottom-nav" elevation={3}>
        <BottomNavigation
          showLabels
          value={currentValue}
          onChange={(_, value: string) => navigate(value)}
        >
          <BottomNavigationAction icon={<ShieldOutlinedIcon />} label="Vault" value={routes.vault} />
          <BottomNavigationAction icon={<AddIcon />} label="New" value={routes.itemNew} />
          <BottomNavigationAction icon={<PasswordIcon />} label="Generator" value={routes.generator} />
          <BottomNavigationAction icon={<ArticleOutlinedIcon />} label="Logs" value={routes.auditLog} />
          <BottomNavigationAction icon={<SettingsOutlinedIcon />} label="Settings" value={routes.settings} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
