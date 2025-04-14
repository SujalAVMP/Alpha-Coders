import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
        borderTop: 1,
        borderColor: 'divider'
      }}
      className="footer"
    >
      <Box className="content-container">
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            CodeTest
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
