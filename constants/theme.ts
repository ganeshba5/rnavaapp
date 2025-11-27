/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const LightPalette = {
  text: '#0F172A',
  secondaryText: '#334155',
  tertiaryText: '#475569',
  inverseText: '#F8FAFC',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#EFF4FF',
  border: '#E2E8F0',
  shadow: '#0F172A26',
  tint: '#2563EB',
  tintSoft: '#DBEAFE',
  primary: '#2563EB',
  primaryMuted: '#3B82F6',
  tabIconDefault: '#64748B',
  tabIconSelected: '#2563EB',
  success: '#15803D',
  warning: '#C2410C',
  danger: '#DC2626',
  icon: '#475569',
};

const DarkPalette = {
  text: '#F8FAFC',
  secondaryText: '#E2E8F0',
  tertiaryText: '#CBD5F5',
  inverseText: '#0F172A',
  background: '#030712',
  surface: '#0F172A',
  surfaceMuted: '#1E293B',
  border: '#1F2937',
  shadow: '#020617AA',
  tint: '#60A5FA',
  tintSoft: '#1D4ED8',
  primary: '#60A5FA',
  primaryMuted: '#1D4ED8',
  tabIconDefault: '#A5B4FC',
  tabIconSelected: '#60A5FA',
  success: '#4ADE80',
  warning: '#F97316',
  danger: '#F87171',
  icon: '#E2E8F0',
};

export const Colors = {
  light: LightPalette,
  dark: DarkPalette,
};

export type ThemeColors = typeof LightPalette;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
