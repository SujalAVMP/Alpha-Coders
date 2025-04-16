import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Link,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    handleMenuClose();
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    handleMenuClose();
    setMobileOpen(false);
    navigate(path);
  };

  const isActive = (path) => {
    // For paths with query parameters
    if (path.includes('?')) {
      const [basePath, queryParam] = path.split('?');
      return location.pathname === basePath && location.search.includes(queryParam);
    }
    // For regular paths
    return location.pathname === path;
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    if (!user) return [];

    if (user.role === 'assessor') {
      return [
        { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
        { text: 'Tests', path: '/tests', icon: <CodeIcon /> },
        { text: 'Assessments', path: '/assessments', icon: <CodeIcon /> },
        { text: 'Profile', path: '/profile', icon: <PersonIcon /> }
      ];
    } else {
      // For assessee users - only show Dashboard and Active Tests
      return [
        { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
        { text: 'Active Tests', path: '/dashboard', icon: <CodeIcon /> }
      ];
    }
  };

  const menuItems = getMenuItems();

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 700 }}>
          CodeTest
        </Typography>
      </Box>
      <Divider />
      <List>
        {isAuthenticated ? (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="subtitle1" noWrap>
                {user?.name || 'User'}
              </Typography>
            </Box>
            <Divider />
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.50',
                    borderRight: 3,
                    borderColor: 'primary.main',
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: 'primary.100',
                  },
                  cursor: 'pointer',
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem onClick={() => handleNavigation('/login')} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <LoginIcon />
              </ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem onClick={() => handleNavigation('/register')} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <PersonAddIcon />
              </ListItemIcon>
              <ListItemText primary="Register" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }} className="navbar">
      <Box className="content-container">
        <Toolbar disableGutters>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: 'flex',
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 }
            }}
          >
            CodeTest
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', ml: 4 }}>
              {isAuthenticated && menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  color="inherit"
                  sx={{
                    mx: 1,
                    fontWeight: 500,
                    color: isActive(item.path) ? 'primary.main' : 'text.primary',
                    borderBottom: isActive(item.path) ? 2 : 0,
                    borderColor: 'primary.main',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: 'primary.main',
                    },
                    py: 2
                  }}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          <Box>
            {isAuthenticated ? (
              <>
                {!isMobile && (
                  <Button
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                    sx={{ textTransform: 'none' }}
                    startIcon={
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {user?.name?.charAt(0) || 'U'}
                      </Avatar>
                    }
                  >
                    {user?.name}
                  </Button>
                )}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    elevation: 2,
                    sx: { minWidth: 200, mt: 1 }
                  }}
                >
                  <MenuItem onClick={() => handleNavigation('/profile')}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Profile</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                {!isMobile && (
                  <>
                    <Button
                      color="inherit"
                      component={RouterLink}
                      to="/login"
                      sx={{ mr: 1 }}
                      startIcon={<LoginIcon />}
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      component={RouterLink}
                      to="/register"
                      startIcon={<PersonAddIcon />}
                    >
                      Register
                    </Button>
                  </>
                )}
              </>
            )}
          </Box>
        </Toolbar>
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
