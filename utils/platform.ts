import { Platform } from 'react-native';

/**
 * Platform detection utilities for cross-platform development
 * Helps apply platform-specific logic and styling
 */

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = isIOS || isAndroid;

/**
 * Get responsive container max width based on screen size
 * Useful for centering content on larger screens
 */
export const getContainerMaxWidth = (): number | string => {
  if (!isWeb) return '100%';
  
  // Use window dimensions if available (client-side)
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width >= 1200) return 1200;
    if (width >= 768) return 900;
  }
  
  return '100%';
};

/**
 * Check if running on desktop-sized web viewport
 * Desktop breakpoint: >= 1024px
 */
export const isDesktop = (): boolean => {
  if (!isWeb) return false;
  if (typeof window !== 'undefined') {
    return window.innerWidth >= 1024;
  }
  return false;
};

/**
 * Check if running on tablet-sized web viewport
 * Tablet breakpoint: 768px - 1023px
 */
export const isTablet = (): boolean => {
  if (!isWeb) return false;
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    return width >= 768 && width < 1024;
  }
  return false;
};

/**
 * Check if running on mobile-sized web viewport
 * Mobile breakpoint: < 768px
 */
export const isMobileWeb = (): boolean => {
  if (!isWeb) return false;
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
};

/**
 * Get responsive padding based on screen size
 */
export const getResponsivePadding = (): number => {
  if (isDesktop()) return 40;
  if (isTablet()) return 24;
  return 20;
};

/**
 * Get responsive font size multiplier
 */
export const getFontSizeMultiplier = (): number => {
  if (isDesktop()) return 1.1;
  if (isTablet()) return 1.05;
  return 1;
};

