import { Box, Typography } from '@mui/material';

export function StatusBar() {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        height: 42,
        justifyContent: 'space-between',
        px: 3,
        flexShrink: 0,
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        9:41
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        5G 100%
      </Typography>
    </Box>
  );
}
