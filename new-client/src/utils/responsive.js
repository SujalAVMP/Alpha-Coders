/**
 * Responsive design utility functions and constants
 */

import { useMediaQuery, useTheme } from '@mui/material';

// Custom hook to check if the current screen size is mobile
export const useIsMobile = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
};

// Custom hook to check if the current screen size is tablet
export const useIsTablet = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'md'));
};

// Custom hook to check if the current screen size is desktop
export const useIsDesktop = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('md'));
};

// Responsive padding values based on screen size
export const getResponsivePadding = (isMobile, isTablet) => {
  if (isMobile) return { px: 2, py: 2 };
  if (isTablet) return { px: 3, py: 3 };
  return { px: 4, py: 4 };
};

// Responsive spacing values based on screen size
export const getResponsiveSpacing = (isMobile, isTablet) => {
  if (isMobile) return 2;
  if (isTablet) return 3;
  return 4;
};

// Responsive typography variants based on screen size
export const getResponsiveVariant = (baseVariant, isMobile, isTablet) => {
  if (baseVariant === 'h4') {
    if (isMobile) return 'h5';
    if (isTablet) return 'h4';
    return 'h4';
  }
  
  if (baseVariant === 'h5') {
    if (isMobile) return 'h6';
    return 'h5';
  }
  
  return baseVariant;
};

export default {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  getResponsivePadding,
  getResponsiveSpacing,
  getResponsiveVariant
};
