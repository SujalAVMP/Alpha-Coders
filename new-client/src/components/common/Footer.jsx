import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Link, Grid, Stack, Divider, IconButton } from '@mui/material';
import { GitHub as GitHubIcon, LinkedIn as LinkedInIcon, Twitter as TwitterIcon } from '@mui/icons-material';

const Footer = () => {
  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { name: 'Home', path: '/' },
        { name: 'Challenges', path: '/tests' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Submissions', path: '/submissions' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', path: '/' },
        { name: 'API', path: '/' },
        { name: 'Blog', path: '/' },
        { name: 'Help Center', path: '/' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', path: '/' },
        { name: 'Careers', path: '/' },
        { name: 'Contact', path: '/' },
        { name: 'Privacy Policy', path: '/' }
      ]
    }
  ];

  const socialLinks = [
    { icon: <GitHubIcon />, url: 'https://github.com' },
    { icon: <LinkedInIcon />, url: 'https://linkedin.com' },
    { icon: <TwitterIcon />, url: 'https://twitter.com' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Logo and description */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                display: 'inline-block',
                mb: 2
              }}
            >
              CodeTest
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              An interactive platform for coding challenges, technical interviews, and skill development. Practice coding, improve your skills, and prepare for technical interviews.
            </Typography>
            <Stack direction="row" spacing={1}>
              {socialLinks.map((social, index) => (
                <IconButton
                  key={index}
                  component="a"
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Footer links */}
          {footerLinks.map((section) => (
            <Grid item xs={6} sm={4} md={2} key={section.title}>
              <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight={600}>
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    component={RouterLink}
                    to={link.path}
                    color="text.secondary"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} CodeTest Platform. All rights reserved.
          </Typography>
          <Box>
            <Link color="text.secondary" sx={{ ml: 2, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              Terms of Service
            </Link>
            <Link color="text.secondary" sx={{ ml: 2, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              Privacy Policy
            </Link>
            <Link color="text.secondary" sx={{ ml: 2, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              Cookies
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
