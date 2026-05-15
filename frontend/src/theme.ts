import { createTheme } from '@mui/material/styles';

export const appTokens = {
  colors: {
    textPrimary: '#141f29',
    textSecondary: '#637585',
    primary: '#0d736b',
    actionBlue: '#1f54d1',
    danger: '#d1292e',
    border: '#d6dee3',
    frameBorder: '#bdc7d1',
    surface: '#ffffff',
    mutedSurface: '#f7fafb',
    activeSurface: '#e3f2f0',
    placeholder: '#adbac7',
  },
  radii: {
    control: 8,
    card: '10px',
    nav: 12,
    phone: 28,
  },
  layout: {
    mobileFrameWidth: 390,
    pageX: 3,
    bottomNavHeight: 80,
  },
} as const;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: appTokens.colors.primary,
    },
    secondary: {
      main: appTokens.colors.actionBlue,
    },
    warning: {
      main: '#b45309',
    },
    error: {
      main: appTokens.colors.danger,
    },
    background: {
      default: appTokens.colors.surface,
      paper: appTokens.colors.surface,
    },
    text: {
      primary: appTokens.colors.textPrimary,
      secondary: appTokens.colors.textSecondary,
    },
    divider: appTokens.colors.border,
  },
  shape: {
    borderRadius: appTokens.radii.control,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: 30,
      fontWeight: 700,
      lineHeight: '34px',
    },
    h2: {
      fontSize: 28,
      fontWeight: 700,
      lineHeight: '34px',
    },
    h3: {
      fontSize: 18,
      fontWeight: 700,
      lineHeight: '24px',
    },
    body1: {
      fontSize: 14,
      lineHeight: '20px',
    },
    body2: {
      fontSize: 12,
      lineHeight: '16px',
    },
    button: {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: '20px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          textTransform: 'none',
          borderRadius: appTokens.radii.control,
          boxShadow: 'none',
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: appTokens.radii.control,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: appTokens.radii.control,
        },
        input: {
          fontSize: 14,
          lineHeight: '20px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 13,
          fontSize: 12,
          height: 26,
        },
      },
    },
  },
});
